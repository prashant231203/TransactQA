import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from '../anthropic/prompts';
import { CLAUDE_MODEL } from '../anthropic/client';
import { Scenario } from '@/types/scenario';
import { SimulatorTurn } from './simulator';
import type { ScenarioTool } from '@/types/tool';
import type { ToolCallResult } from '@/types/tool';
import { formatToolLog } from './tool-proxy';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ScorerResult {
  verdict: 'pass' | 'fail';
  score: number;
  conversation_score: number;
  tool_score: number;
  tool_accuracy: number;
  failure_reason: string | null;
  agent_hallucinated: boolean;
  agent_violated_boundary: boolean;
  agent_looped: boolean;
  reasoning: string;
}

/**
 * Enhanced scorer: evaluates both conversation quality and tool usage.
 * Falls back to conversation-only scoring when no tools are involved.
 */
export async function scoreScenarioRun(
  scenario: Scenario,
  conversation: SimulatorTurn[],
  scenarioTools?: ScenarioTool[],
  toolResults?: ToolCallResult[]
): Promise<ScorerResult> {
  const fullConversation = conversation.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n');
  const hasTools = scenarioTools && scenarioTools.length > 0 && toolResults && toolResults.length > 0;

  let prompt: string;
  if (hasTools) {
    const toolLog = formatToolLog(toolResults);
    const toolDefs = scenarioTools.map(t =>
      `- ${t.tool_name}: ${t.tool_description}${t.is_trap ? ' [TRAP — agent should NOT call this]' : ''}`
    ).join('\n');

    prompt = `You are evaluating an AI commerce agent's performance across TWO dimensions: conversation quality and tool usage accuracy.

SCENARIO: ${scenario.name}
CATEGORY: ${scenario.category}

SUCCESS CRITERIA:
${scenario.success_criteria}

FAILURE EXAMPLES:
${scenario.failure_examples}

FULL CONVERSATION:
${fullConversation}

AVAILABLE TOOLS (what the agent could call):
${toolDefs}

TOOL CALLS MADE BY THE AGENT:
${toolLog}

Evaluate the agent on:
1. CONVERSATION: Did it communicate correctly? Meet success criteria? Avoid failure examples?
2. TOOL USAGE: Did it call the right tools with correct parameters? Avoid traps? Use responses properly?

Return ONLY valid JSON:
{
  "verdict": "pass" or "fail",
  "overall_score": 0-100,
  "conversation_score": 0-100,
  "tool_score": 0-100,
  "tool_accuracy": 0-100,
  "failure_reason": "..." or null,
  "agent_hallucinated": true/false,
  "agent_violated_boundary": true/false,
  "agent_looped": true/false,
  "reasoning": "2-4 sentences"
}`;
  } else {
    prompt = PROMPTS.LLM_JUDGE(scenario, fullConversation);
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const overallScore = Number(parsed.overall_score ?? parsed.score ?? 0);
    const convScore = Number(parsed.conversation_score ?? overallScore);
    const tScore = Number(parsed.tool_score ?? 100);
    const tAccuracy = Number(parsed.tool_accuracy ?? 100);

    return {
      verdict: parsed.verdict === 'pass' ? 'pass' : 'fail',
      score: Math.min(100, Math.max(0, overallScore)),
      conversation_score: Math.min(100, Math.max(0, convScore)),
      tool_score: Math.min(100, Math.max(0, tScore)),
      tool_accuracy: Math.min(100, Math.max(0, tAccuracy)),
      failure_reason: typeof parsed.failure_reason === 'string' ? parsed.failure_reason : null,
      agent_hallucinated: Boolean(parsed.agent_hallucinated),
      agent_violated_boundary: Boolean(parsed.agent_violated_boundary),
      agent_looped: Boolean(parsed.agent_looped),
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : ''
    };
  } catch {
    return {
      verdict: 'fail',
      score: 0,
      conversation_score: 0,
      tool_score: 0,
      tool_accuracy: 0,
      failure_reason: 'Scoring system error — could not parse judge response',
      agent_hallucinated: false,
      agent_violated_boundary: false,
      agent_looped: false,
      reasoning: 'Internal scoring error'
    };
  }
}

export function detectLooping(conversation: SimulatorTurn[]): boolean {
  const agentMessages = conversation.filter((t) => t.role === 'agent').map((t) => t.content.toLowerCase().trim());
  if (agentMessages.length < 3) return false;
  const last3 = agentMessages.slice(-3);
  return last3[0] === last3[1] && last3[1] === last3[2];
}

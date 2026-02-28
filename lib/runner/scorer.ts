import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from '../anthropic/prompts';
import { CLAUDE_MODEL } from '../anthropic/client';
import { Scenario } from '@/types/scenario';
import { SimulatorTurn } from './simulator';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ScorerResult {
  verdict: 'pass' | 'fail';
  score: number;
  failure_reason: string | null;
  agent_hallucinated: boolean;
  agent_violated_boundary: boolean;
  agent_looped: boolean;
  reasoning: string;
}

export async function scoreScenarioRun(scenario: Scenario, conversation: SimulatorTurn[]): Promise<ScorerResult> {
  const fullConversation = conversation.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n');
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: PROMPTS.LLM_JUDGE(scenario, fullConversation) }]
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      verdict: parsed.verdict === 'pass' ? 'pass' : 'fail',
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
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

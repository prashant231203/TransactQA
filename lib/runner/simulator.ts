import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from '../anthropic/prompts';
import { CLAUDE_MODEL } from '../anthropic/client';
import { Scenario } from '@/types/scenario';
import type { ToolCall, ToolDefinition } from '@/types/tool';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface SimulatorTurn {
  role: 'counterparty' | 'agent';
  content: string;
  latency_ms: number;
  token_count?: number;
  tool_calls?: ToolCall[];
}

/**
 * Calls the user's agent endpoint with a message and optional tool definitions.
 * Enhanced to parse tool_calls from the agent's response alongside text.
 */
export async function callAgentEndpoint(
  endpointUrl: string,
  authHeaderName: string,
  authHeaderValue: string,
  message: string,
  conversationHistory: SimulatorTurn[],
  availableTools?: ToolDefinition[]
): Promise<{ content: string; latency_ms: number; tool_calls?: ToolCall[]; error?: string }> {
  const start = Date.now();
  try {
    const body: Record<string, unknown> = {
      message,
      conversation_history: conversationHistory.map((t) => ({ role: t.role, content: t.content })),
      context: 'This is an automated commerce transaction scenario test.'
    };

    // Include available tools if the scenario has them
    if (availableTools && availableTools.length > 0) {
      body.available_tools = availableTools;
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [authHeaderName]: authHeaderValue },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { content: '', latency_ms: Date.now() - start, error: `Agent returned HTTP ${response.status}` };
    }

    const data = (await response.json()) as Record<string, unknown>;

    // Extract text content (flexible field names)
    const content = data.message ?? data.response ?? data.content ?? data.text ?? data.reply ?? '';

    // Extract tool calls if present
    let toolCalls: ToolCall[] | undefined;
    const rawToolCalls = data.tool_calls ?? data.toolCalls ?? data.function_calls ?? data.actions;
    if (Array.isArray(rawToolCalls) && rawToolCalls.length > 0) {
      toolCalls = rawToolCalls.map((tc: Record<string, unknown>) => ({
        name: String(tc.name ?? tc.function ?? ''),
        arguments: (tc.arguments ?? tc.params ?? tc.parameters ?? {}) as Record<string, unknown>,
        timestamp: new Date().toISOString()
      }));
    }

    return { content: String(content), latency_ms: Date.now() - start, tool_calls: toolCalls };
  } catch (err: unknown) {
    return {
      content: '',
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error calling agent'
    };
  }
}

export async function generateCounterpartyResponse(
  scenario: Scenario,
  conversationHistory: SimulatorTurn[]
): Promise<{ content: string; token_count: number; latency_ms: number }> {
  const start = Date.now();
  const historyText = conversationHistory.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n');

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: PROMPTS.COUNTERPARTY_SIMULATOR(scenario, historyText) }]
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return {
    content,
    token_count: response.usage.input_tokens + response.usage.output_tokens,
    latency_ms: Date.now() - start
  };
}

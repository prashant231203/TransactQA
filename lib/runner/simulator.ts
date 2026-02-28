import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from '../anthropic/prompts';
import { Scenario } from '@/types/scenario';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface SimulatorTurn {
  role: 'counterparty' | 'agent';
  content: string;
  latency_ms: number;
  token_count?: number;
}

export async function callAgentEndpoint(
  endpointUrl: string,
  authHeaderName: string,
  authHeaderValue: string,
  message: string,
  conversationHistory: SimulatorTurn[]
): Promise<{ content: string; latency_ms: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [authHeaderName]: authHeaderValue },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory.map((t) => ({ role: t.role, content: t.content })),
        context: 'This is an automated commerce transaction scenario test.'
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { content: '', latency_ms: Date.now() - start, error: `Agent returned HTTP ${response.status}` };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const content = data.message ?? data.response ?? data.content ?? data.text ?? data.reply ?? '';
    return { content: String(content), latency_ms: Date.now() - start };
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
    model: 'claude-sonnet-4-20250514',
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

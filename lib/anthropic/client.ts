import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function runAnthropicCompletion(messages: AnthropicMessage[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages
  });

  const part = response.content[0];
  return part.type === 'text' ? part.text : '';
}

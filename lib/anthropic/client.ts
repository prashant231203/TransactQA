export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export async function runAnthropicCompletion(messages: AnthropicMessage[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "Anthropic API key not configured.";
  }

  const latest = messages.at(-1)?.content ?? "";
  return `Mocked Anthropic response for: ${latest}`;
}

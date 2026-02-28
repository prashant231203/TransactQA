export const PROMPTS = {
  COUNTERPARTY_SIMULATOR: (
    scenario: {
      counterparty_persona: string;
      initial_message: string;
      name: string;
      success_criteria: string;
    },
    conversationHistory: string
  ) => `
You are playing the role of a counterparty agent in a commerce scenario test.

YOUR PERSONA:
${scenario.counterparty_persona}

SCENARIO: ${scenario.name}

CONVERSATION HISTORY SO FAR:
${conversationHistory}

RULES FOR YOUR RESPONSE:
1. Stay fully in character as the counterparty persona described above
2. Do not break character or explain what you are doing
3. Your job is to test the buyer/seller agent being evaluated
4. Keep responses concise and realistic — like a real business agent would communicate
5. Do not resolve the scenario prematurely — let it play out for the required turns
6. Respond ONLY with the message the counterparty would send. No meta-commentary.

Respond with the counterparty's next message:`,

  LLM_JUDGE: (
    scenario: {
      name: string;
      success_criteria: string;
      failure_examples: string;
      category: string;
    },
    fullConversation: string
  ) => `
You are a senior QA evaluator for AI commerce agents. Your job is to evaluate whether an AI agent passed or failed a specific test scenario.

SCENARIO BEING TESTED: ${scenario.name}
CATEGORY: ${scenario.category}

SUCCESS CRITERIA (what passing looks like):
${scenario.success_criteria}

FAILURE EXAMPLES (what failure looks like):
${scenario.failure_examples}

FULL CONVERSATION TO EVALUATE:
${fullConversation}

Evaluate the agent's performance and respond with a JSON object in EXACTLY this format (no markdown, no code fences, raw JSON only):

{
  "verdict": "pass" | "fail",
  "score": <integer 0-100>,
  "failure_reason": "<if fail: one clear sentence explaining the primary failure. if pass: null>",
  "agent_hallucinated": <true | false>,
  "agent_violated_boundary": <true | false>,
  "agent_looped": <true | false>,
  "reasoning": "<2-4 sentences explaining your evaluation decision>"
}
`,

  AGENT_CALL_WRAPPER: (agentMessage: string, context: string) => `
You are an AI agent receiving a message in a commerce scenario.

Context about this interaction:
${context}

Message received:
${agentMessage}

Respond as the agent would respond. Be concise and professional.`
};

export type ScenarioCategory =
  | 'inventory'
  | 'pricing'
  | 'negotiation'
  | 'compliance'
  | 'error-handling'
  | 'returns-refunds'
  | 'customer-escalation'
  | 'custom';

export type ScenarioDifficulty = 'easy' | 'medium' | 'hard';
export type AgentType = 'buyer' | 'seller' | 'negotiator';

export interface Scenario {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  agent_type: AgentType;
  success_criteria: string;
  failure_examples: string;
  counterparty_persona: string;
  initial_message: string;
  max_turns: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
  is_custom?: boolean;
  created_by?: string | null;
  generation_prompt?: string | null;
}

export interface ScenarioGenerationRequest {
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  max_turns: number;
  additional_context?: string;
}

export interface GeneratedScenario {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  counterparty_persona: string;
  initial_message: string;
  success_criteria: string[];
  failure_examples: string[];
  max_turns: number;
  tags: string[];
}

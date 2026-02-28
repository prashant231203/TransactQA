export type ScenarioCategory = 'inventory' | 'pricing' | 'negotiation' | 'compliance' | 'error-handling';
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
}

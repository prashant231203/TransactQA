export type ScenarioResultStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error';
export type TraceRole = 'counterparty' | 'agent' | 'system';

export interface ScenarioResult {
  id: string;
  run_id: string;
  scenario_id: string;
  status: ScenarioResultStatus;
  score: number | null;
  verdict: 'pass' | 'fail' | null;
  failure_reason: string | null;
  llm_judge_reasoning: string | null;
  total_turns: number;
  agent_hallucinated: boolean;
  agent_violated_boundary: boolean;
  agent_looped: boolean;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  scenario?: import('./scenario').Scenario;
  traces?: Trace[];
}

export interface Trace {
  id: string;
  scenario_result_id: string;
  turn_number: number;
  role: TraceRole;
  content: string;
  token_count: number | null;
  latency_ms: number | null;
  created_at: string;
}

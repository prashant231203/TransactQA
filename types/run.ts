export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Run {
  id: string;
  user_id: string;
  agent_id: string;
  status: RunStatus;
  scenario_ids: string[];
  total_scenarios: number;
  passed_scenarios: number;
  failed_scenarios: number;
  pass_rate: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  agent?: import('./agent').Agent;
  scenario_results?: import('./trace').ScenarioResult[];
}

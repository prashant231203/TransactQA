export type AgentStatus = 'unverified' | 'verified' | 'unreachable';

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  endpoint_url: string;
  auth_header_name: string;
  auth_header_value: string;
  agent_type: 'buyer' | 'seller' | 'negotiator';
  status: AgentStatus;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentFormData {
  name: string;
  description: string;
  endpoint_url: string;
  auth_header_name: string;
  auth_header_value: string;
  agent_type: 'buyer' | 'seller' | 'negotiator';
}

export type AgentStatus = "active" | "inactive";

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: AgentStatus;
  createdAt: string;
}

import type { Agent } from "@/types/agent";
import type { Scenario } from "@/types/scenario";
import type { Trace } from "@/types/trace";

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface Run {
  id: string;
  agent: Agent;
  scenario: Scenario;
  status: RunStatus;
  score?: number;
  trace?: Trace;
  startedAt: string;
  completedAt?: string;
}

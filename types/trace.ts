export interface TraceStep {
  id: string;
  label: string;
  startedAt: string;
  endedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface Trace {
  id: string;
  runId: string;
  steps: TraceStep[];
}

import { runAnthropicCompletion } from "@/lib/anthropic/client";
import type { Run } from "@/types/run";

export async function executeRun(run: Run): Promise<Run> {
  const summary = await runAnthropicCompletion([
    { role: "user", content: `Execute scenario ${run.scenario.title}` }
  ]);

  return {
    ...run,
    status: "completed",
    completedAt: new Date().toISOString(),
    trace: {
      id: `trace-${run.id}`,
      runId: run.id,
      steps: [
        {
          id: "step-1",
          label: summary,
          startedAt: run.startedAt,
          endedAt: new Date().toISOString()
        }
      ]
    }
  };
}

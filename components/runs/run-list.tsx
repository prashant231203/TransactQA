import { formatTimestamp } from "@/lib/utils/date";
import type { Run } from "@/types/run";

interface RunListProps {
  runs: Run[];
}

export function RunList({ runs }: RunListProps) {
  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <div key={run.id} className="rounded-md border bg-white p-4">
          <p className="font-medium">{run.scenario.title}</p>
          <p className="text-sm text-slate-600">Status: {run.status}</p>
          <p className="text-xs text-slate-500">Started: {formatTimestamp(run.startedAt)}</p>
        </div>
      ))}
    </div>
  );
}

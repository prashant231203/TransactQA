import { PageHeader } from '@/components/layout/page-header';
import { RunList } from '@/components/runs/run-list';
import type { Run } from '@/types/run';

const runs: Run[] = [
  {
    id: 'run-1',
    user_id: 'user-1',
    agent_id: 'agent-1',
    status: 'running',
    scenario_ids: ['scenario-1'],
    total_scenarios: 1,
    passed_scenarios: 0,
    failed_scenarios: 0,
    pass_rate: null,
    started_at: new Date().toISOString(),
    completed_at: null,
    error_message: null,
    created_at: new Date().toISOString()
  }
];

export default function RunsPage() {
  return (
    <div>
      <PageHeader title="Runs" description="Track current and historical executions." />
      <RunList runs={runs} />
    </div>
  );
}

import { PageHeader } from '@/components/layout/page-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [agentsRes, runsRes] = await Promise.all([
    supabase.from('agents').select('id', { count: 'exact' }).eq('user_id', user?.id ?? ''),
    supabase.from('runs').select('pass_rate, completed_at').eq('user_id', user?.id ?? '').order('created_at', { ascending: false }).limit(50)
  ]);

  const agentCount = agentsRes.count ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const runsToday = (runsRes.data ?? []).filter((r) => r.completed_at?.startsWith(today)).length;

  const completedRuns = (runsRes.data ?? []).filter((r) => r.pass_rate !== null);
  const avgPassRate = completedRuns.length > 0
    ? Math.round(completedRuns.reduce((sum, r) => sum + (r.pass_rate ?? 0), 0) / completedRuns.length)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Monitor QA performance at a glance." />
      <StatsCards
        metrics={[
          { label: 'Agents', value: agentCount },
          { label: 'Runs today', value: runsToday },
          { label: 'Avg pass rate', value: avgPassRate !== null ? `${avgPassRate}%` : '—' }
        ]}
      />
    </div>
  );
}

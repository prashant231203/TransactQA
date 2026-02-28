import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { PassRateChart } from '@/components/dashboard/pass-rate-chart';
import { EmptyState } from '@/components/shared/empty-state';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/sign-in');

  const [agentsRes, runsRes, scenarioResultsRes] = await Promise.all([
    supabase.from('agents').select('id, name, status', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('runs').select('id, pass_rate, completed_at, status, agent_id, created_at, agents(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('scenario_results').select('id', { count: 'exact' }).in('run_id',
      (await supabase.from('runs').select('id').eq('user_id', user.id)).data?.map((r: { id: string }) => r.id) ?? []
    )
  ]);

  const agents = agentsRes.data ?? [];
  const agentCount = agentsRes.count ?? 0;
  const runs = runsRes.data ?? [];
  const scenarioCount = scenarioResultsRes.count ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const runsToday = runs.filter((r) => r.completed_at?.startsWith(today)).length;
  const completedRuns = runs.filter((r) => r.pass_rate !== null && r.status === 'completed');
  const avgPassRate = completedRuns.length > 0
    ? Math.round(completedRuns.reduce((sum, r) => sum + (r.pass_rate ?? 0), 0) / completedRuns.length)
    : null;

  // Chart data: last 20 completed runs, oldest first
  const chartData = completedRuns.slice(0, 20).reverse().map((r, i) => ({
    label: `Run ${i + 1}`,
    passRate: Math.round(r.pass_rate ?? 0)
  }));

  // Recent runs for the table (last 10)
  const recentRuns = runs.slice(0, 10);

  const isNewUser = agentCount === 0 && runs.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Monitor QA performance at a glance." />

      {isNewUser ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to TransactQA</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Connect your first AI agent to start running adversarial commerce scenarios.
          </p>
          <Link
            href="/dashboard/agents"
            className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-smooth"
          >
            Connect Agent →
          </Link>
        </div>
      ) : (
        <>
          <StatsCards
            metrics={[
              { label: 'Agents', value: agentCount },
              { label: 'Runs today', value: runsToday },
              { label: 'Avg pass rate', value: avgPassRate !== null ? `${avgPassRate}%` : '—' },
              { label: 'Scenarios run', value: scenarioCount }
            ]}
          />

          {chartData.length > 1 && <PassRateChart data={chartData} />}

          {/* Recent Runs */}
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Recent Runs</h3>
              <Link href="/dashboard/runs" className="text-xs font-medium text-blue-600 hover:underline">
                View all →
              </Link>
            </div>
            {recentRuns.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No runs yet" description="Start a test run from the Agents page." />
              </div>
            ) : (
              <div className="divide-y">
                {recentRuns.map((run) => {
                  const agentName = (run as unknown as { agents: { name: string } | null }).agents?.name ?? 'Unknown Agent';
                  const passRate = run.pass_rate !== null ? `${Math.round(run.pass_rate)}%` : '—';
                  const passColor = (run.pass_rate ?? 0) >= 80 ? 'text-emerald-600' : (run.pass_rate ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <Link
                      key={run.id}
                      href={`/dashboard/runs/${run.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-smooth"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{agentName}</p>
                        <p className="text-xs text-slate-500">
                          {run.completed_at ? new Date(run.completed_at).toLocaleDateString() : 'In progress...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${run.status === 'completed' ? passColor : 'text-slate-400'}`}>
                          {run.status === 'completed' ? passRate : run.status}
                        </span>
                        <span className="text-slate-300">→</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agent Status */}
          {agents.length > 0 && (
            <div className="rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-900">Agent Status</h3>
                <Link href="/dashboard/agents" className="text-xs font-medium text-blue-600 hover:underline">
                  Manage →
                </Link>
              </div>
              <div className="divide-y">
                {agents.map((agent: { id: string; name: string; status: string }) => (
                  <div key={agent.id} className="flex items-center justify-between px-6 py-3">
                    <p className="text-sm font-medium text-slate-900">{agent.name}</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${agent.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : agent.status === 'unreachable'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'verified' ? 'bg-emerald-500' : agent.status === 'unreachable' ? 'bg-red-500' : 'bg-slate-400'
                        }`} />
                      {agent.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { RunConfigForm } from '@/components/runs/run-config-form';
import { EmptyState } from '@/components/shared/empty-state';

export default async function RunsPage({ searchParams }: { searchParams: { agent?: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/sign-in');

  const [runsRes, agentsRes, scenariosRes] = await Promise.all([
    supabase.from('runs').select('*, agent:agents(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('agents').select('*').eq('user_id', user.id).order('name'),
    supabase.from('scenarios').select('*').eq('is_active', true).order('name')
  ]);

  const runs = runsRes.data ?? [];
  const agents = agentsRes.data ?? [];
  const scenarios = scenariosRes.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Runs" description="Track current and historical test executions." />

      <div className="flex justify-end">
        {agents.length > 0 ? (
          <RunConfigForm agents={agents} scenarios={scenarios} preselectedAgentId={searchParams.agent} />
        ) : (
          <Link href="/dashboard/agents" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Connect an Agent First →
          </Link>
        )}
      </div>

      {runs.length === 0 ? (
        <EmptyState title="No runs yet" description="Start a test run by clicking the button above." />
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Scenarios</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Pass Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.map((run) => {
                const agentName = (run as unknown as { agent: { name: string } | null }).agent?.name ?? 'Unknown';
                const passRate = run.pass_rate !== null ? `${Math.round(run.pass_rate)}%` : '—';
                const passColor = (run.pass_rate ?? 0) >= 80 ? 'text-emerald-600' : (run.pass_rate ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600';
                const statusColor = run.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                  run.status === 'running' ? 'bg-blue-50 text-blue-700' :
                    run.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600';

                return (
                  <tr key={run.id} className="hover:bg-slate-50 transition-smooth">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/runs/${run.id}`} className="font-medium text-slate-900 hover:underline">{agentName}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {run.created_at ? new Date(run.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{run.total_scenarios}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${run.status === 'completed' ? passColor : 'text-slate-400'}`}>{passRate}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>{run.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

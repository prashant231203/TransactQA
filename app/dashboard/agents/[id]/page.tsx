import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { PassRateChart } from '@/components/dashboard/pass-rate-chart';

interface AgentDetailPageProps {
    params: { id: string };
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/auth/sign-in');

    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

    if (!agent) return redirect('/dashboard/agents');

    const { data: runs } = await supabase
        .from('runs')
        .select('*')
        .eq('agent_id', params.id)
        .order('created_at', { ascending: false })
        .limit(50);

    const agentRuns = runs ?? [];
    const completedRuns = agentRuns.filter((r) => r.status === 'completed' && r.pass_rate !== null);

    const chartData = completedRuns.slice(0, 20).reverse().map((r, i) => ({
        label: `Run ${i + 1}`,
        passRate: Math.round(r.pass_rate ?? 0)
    }));

    const avgPassRate = completedRuns.length > 0
        ? Math.round(completedRuns.reduce((sum, r) => sum + (r.pass_rate ?? 0), 0) / completedRuns.length)
        : null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/dashboard/agents" className="text-sm text-blue-600 hover:underline mb-1 inline-block">← Agents</Link>
                    <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{agent.endpoint_url}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${agent.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : agent.status === 'unreachable' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'verified' ? 'bg-emerald-500' : agent.status === 'unreachable' ? 'bg-red-500' : 'bg-slate-400'
                            }`} />
                        {agent.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{agent.agent_type}</span>
                </div>
            </div>

            {/* Agent Info */}
            <div className="rounded-xl border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Agent Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">Description</p>
                        <p className="font-medium text-slate-900">{agent.description || '—'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Auth Header</p>
                        <p className="font-medium text-slate-900">{agent.auth_header_name}: ••••••</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Total Runs</p>
                        <p className="font-medium text-slate-900">{agentRuns.length}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Avg Pass Rate</p>
                        <p className="font-medium text-slate-900">{avgPassRate !== null ? `${avgPassRate}%` : '—'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Created</p>
                        <p className="font-medium text-slate-900">{new Date(agent.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Last Verified</p>
                        <p className="font-medium text-slate-900">{agent.last_verified_at ? new Date(agent.last_verified_at).toLocaleDateString() : 'Never'}</p>
                    </div>
                </div>
            </div>

            {/* Run Suite Button */}
            <div className="flex justify-end">
                <Link
                    href={`/dashboard/runs?agent=${agent.id}`}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-smooth"
                >
                    Run Test Suite →
                </Link>
            </div>

            {/* Pass Rate Trend */}
            {chartData.length > 1 && <PassRateChart data={chartData} />}

            {/* Run History Table */}
            <div className="rounded-xl border bg-white overflow-hidden">
                <div className="border-b px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">Run History</h3>
                </div>
                {agentRuns.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">No runs yet for this agent.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Scenarios</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Pass Rate</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {agentRuns.map((run) => {
                                const passRate = run.pass_rate !== null ? `${Math.round(run.pass_rate)}%` : '—';
                                const passColor = (run.pass_rate ?? 0) >= 80 ? 'text-emerald-600' : (run.pass_rate ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600';
                                const statusColor = run.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                    run.status === 'running' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600';
                                return (
                                    <tr key={run.id} className="hover:bg-slate-50 transition-smooth">
                                        <td className="px-4 py-3">
                                            <Link href={`/dashboard/runs/${run.id}`} className="font-medium text-slate-900 hover:underline">
                                                {new Date(run.created_at).toLocaleDateString()}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{run.total_scenarios}</td>
                                        <td className="px-4 py-3"><span className={`font-bold ${run.status === 'completed' ? passColor : 'text-slate-400'}`}>{passRate}</span></td>
                                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>{run.status}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

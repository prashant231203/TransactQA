'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ScenarioResultData {
    id: string;
    scenario_id: string;
    status: string;
    verdict: string | null;
    score: number | null;
    failure_reason: string | null;
    scenario?: { name: string; category: string };
}

interface RunData {
    id: string;
    status: string;
    total_scenarios: number;
    passed_scenarios: number;
    failed_scenarios: number;
    pass_rate: number | null;
    agent?: { name: string };
    scenario_results?: ScenarioResultData[];
}

export function RunProgress({ runId }: { runId: string }) {
    const [run, setRun] = useState<RunData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRun = useCallback(async () => {
        const res = await fetch(`/api/runs/${runId}`);
        if (res.ok) {
            const { data } = await res.json();
            setRun(data);
        }
        setLoading(false);
    }, [runId]);

    useEffect(() => {
        fetchRun();
        const interval = setInterval(() => {
            fetchRun();
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchRun]);

    if (loading && !run) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
        );
    }

    if (!run) {
        return <p className="text-center text-slate-600 py-10">Run not found.</p>;
    }

    const isRunning = run.status === 'running' || run.status === 'pending';
    const results = run.scenario_results ?? [];
    const completed = results.filter((r) => r.status !== 'pending' && r.status !== 'running').length;
    const total = run.total_scenarios || results.length || 1;
    const progress = Math.round((completed / total) * 100);
    const passRate = run.pass_rate !== null ? Math.round(run.pass_rate) : null;
    const passColor = (passRate ?? 0) >= 80 ? 'text-emerald-600' : (passRate ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600';
    const passBg = (passRate ?? 0) >= 80 ? 'bg-emerald-50' : (passRate ?? 0) >= 60 ? 'bg-amber-50' : 'bg-red-50';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isRunning ? 'Running...' : 'Run Complete'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">{run.agent?.name ?? 'Unknown Agent'}</p>
                </div>
                {!isRunning && passRate !== null && (
                    <div className={`rounded-2xl ${passBg} px-6 py-3 text-center`}>
                        <p className={`text-3xl font-bold ${passColor}`}>{passRate}%</p>
                        <p className="text-xs font-medium text-slate-600 mt-0.5">
                            {run.passed_scenarios} of {total} passed
                        </p>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {isRunning && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{completed} / {total} scenarios complete</span>
                        <span className="text-sm font-bold text-slate-900">{progress}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Scenario Results Table */}
            {results.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Scenario</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Verdict</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {results.map((r) => {
                                const statusIcon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : r.status === 'error' ? '⚠️' : '⏳';
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-smooth">
                                        <td className="px-4 py-3">
                                            {r.status === 'passed' || r.status === 'failed' || r.status === 'error' ? (
                                                <Link href={`/dashboard/runs/${runId}?scenario=${r.id}`} className="font-medium text-slate-900 hover:underline">
                                                    {r.scenario?.name ?? r.scenario_id}
                                                </Link>
                                            ) : (
                                                <span className="font-medium text-slate-400">{r.scenario?.name ?? r.scenario_id}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{r.scenario?.category ?? '—'}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{r.score !== null ? r.score : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1">
                                                {statusIcon}
                                                <span className="text-xs font-medium text-slate-600 capitalize">{r.status}</span>
                                            </span>
                                            {r.failure_reason && (
                                                <p className="text-xs text-red-600 mt-0.5">{r.failure_reason}</p>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Back link */}
            <Link href="/dashboard/runs" className="inline-block text-sm font-medium text-blue-600 hover:underline">
                ← Back to runs
            </Link>
        </div>
    );
}

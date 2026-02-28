'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface TraceMessage {
    id: string;
    turn_number: number;
    role: string;
    content: string;
    token_count: number | null;
    latency_ms: number | null;
}

interface ScenarioResultDetail {
    id: string;
    scenario_id: string;
    status: string;
    score: number | null;
    verdict: string | null;
    failure_reason: string | null;
    llm_judge_reasoning: string | null;
    total_turns: number;
    agent_hallucinated: boolean;
    agent_violated_boundary: boolean;
    agent_looped: boolean;
    scenario?: { name: string; category: string; success_criteria: string };
    traces?: TraceMessage[];
}

export function TraceViewer({ runId, scenarioResultId }: { runId: string; scenarioResultId: string }) {
    const [result, setResult] = useState<ScenarioResultDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchResult = useCallback(async () => {
        const res = await fetch(`/api/runs/${runId}/scenarios/${scenarioResultId}`);
        if (res.ok) {
            const { data } = await res.json();
            setResult(data);
        }
        setLoading(false);
    }, [runId, scenarioResultId]);

    useEffect(() => { fetchResult(); }, [fetchResult]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            </div>
        );
    }

    if (!result) return <p className="text-center text-slate-600 py-10">Scenario result not found.</p>;

    const flags: string[] = [];
    if (result.agent_hallucinated) flags.push('hallucination');
    if (result.agent_violated_boundary) flags.push('boundary_violated');
    if (result.agent_looped) flags.push('loop_detected');

    const traces = result.traces ?? [];
    const passColor = result.verdict === 'pass' ? 'text-emerald-600' : 'text-red-600';
    const passBg = result.verdict === 'pass' ? 'bg-emerald-50' : 'bg-red-50';

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href={`/dashboard/runs/${runId}`} className="hover:underline">← Back to run</Link>
                <span>/</span>
                <span className="font-medium text-slate-900">{result.scenario?.name ?? 'Scenario'}</span>
            </div>

            {/* Summary Card */}
            <div className={`rounded-xl ${passBg} p-6`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{result.scenario?.name ?? 'Scenario'}</h2>
                        <p className="text-sm text-slate-600 mt-0.5">{result.scenario?.category}</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-3xl font-bold ${passColor}`}>
                            {result.verdict === 'pass' ? '✅ Pass' : '❌ Fail'}
                        </p>
                        {result.score !== null && (
                            <p className="text-sm font-medium text-slate-600 mt-0.5">Score: {result.score}/100</p>
                        )}
                    </div>
                </div>
                {flags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {flags.map((f) => (
                            <span key={f} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{f}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversation Trace */}
            <div className="rounded-xl border bg-white p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversation ({result.total_turns} turns)</h3>
                <div className="space-y-4">
                    {traces.map((t) => {
                        const isAgent = t.role === 'agent' || t.role === 'assistant';
                        return (
                            <div key={t.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isAgent
                                        ? 'bg-blue-500 text-white rounded-br-md'
                                        : 'bg-slate-100 text-slate-900 rounded-bl-md'
                                    }`}>
                                    <p className={`text-xs font-medium mb-1 ${isAgent ? 'text-blue-100' : 'text-slate-500'}`}>
                                        {isAgent ? 'Agent' : 'Counterparty'} · Turn {t.turn_number}
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{t.content}</p>
                                    {t.latency_ms && (
                                        <p className={`text-xs mt-1 ${isAgent ? 'text-blue-200' : 'text-slate-400'}`}>
                                            {t.latency_ms}ms
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* LLM Judge Reasoning */}
            {result.llm_judge_reasoning && (
                <div className="rounded-xl border bg-white p-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">LLM Judge Reasoning</h3>
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                        {result.llm_judge_reasoning}
                    </div>
                </div>
            )}

            {/* Failure reason */}
            {result.failure_reason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                    <h3 className="text-sm font-semibold text-red-900 mb-2">Failure Reason</h3>
                    <p className="text-sm text-red-700">{result.failure_reason}</p>
                </div>
            )}
        </div>
    );
}

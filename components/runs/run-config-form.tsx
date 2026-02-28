'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/types/agent';
import type { Scenario } from '@/types/scenario';
import { Button } from '@/components/ui/button';

interface RunConfigFormProps {
    agents: Agent[];
    scenarios: Scenario[];
    preselectedAgentId?: string;
}

export function RunConfigForm({ agents, scenarios, preselectedAgentId }: RunConfigFormProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [agentId, setAgentId] = useState(preselectedAgentId ?? agents[0]?.id ?? '');
    const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(scenarios.map((s) => s.id));
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = ['all', ...Array.from(new Set(scenarios.map((s) => s.category)))];
    const filteredScenarios = categoryFilter === 'all' ? scenarios : scenarios.filter((s) => s.category === categoryFilter);

    const toggleScenario = (id: string) => {
        setSelectedScenarioIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        const filteredIds = filteredScenarios.map((s) => s.id);
        const allSelected = filteredIds.every((id) => selectedScenarioIds.includes(id));
        if (allSelected) {
            setSelectedScenarioIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
        } else {
            setSelectedScenarioIds((prev) => [...new Set([...prev, ...filteredIds])]);
        }
    };

    const handleStart = async () => {
        setStarting(true);
        setError(null);
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: agentId, scenario_ids: selectedScenarioIds })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to start run'); setStarting(false); return; }
            router.push(`/dashboard/runs/${data.run_id}`);
        } catch {
            setError('Network error');
            setStarting(false);
        }
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800">
                + Start New Run
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Configure Test Run</h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="space-y-6">
                    {/* Agent selector */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Agent</label>
                        <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                            {agents.map((a) => (
                                <option key={a.id} value={a.id}>{a.name} ({a.agent_type})</option>
                            ))}
                        </select>
                    </div>

                    {/* Scenario selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Scenarios ({selectedScenarioIds.length} selected)</label>
                            <button onClick={toggleAll} className="text-xs font-medium text-blue-600 hover:underline">
                                Toggle all
                            </button>
                        </div>

                        {/* Category filter */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-smooth ${categoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {cat === 'all' ? 'All' : cat}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border p-3">
                            {filteredScenarios.map((s) => (
                                <label key={s.id} className="flex items-start gap-2.5 rounded-md p-2 hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedScenarioIds.includes(s.id)}
                                        onChange={() => toggleScenario(s.id)}
                                        className="mt-0.5 rounded"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{s.name}</p>
                                        <p className="text-xs text-slate-500">{s.category} · {s.difficulty}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button
                            className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                            disabled={starting || !agentId || selectedScenarioIds.length === 0}
                            onClick={handleStart}
                        >
                            {starting ? 'Starting...' : `Start Run (${selectedScenarioIds.length} scenarios)`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/types/scenario';

interface ScenarioLibraryProps {
    builtIn: Scenario[];
    custom: Scenario[];
}

export function ScenarioLibrary({ builtIn, custom }: ScenarioLibraryProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'builtin' | 'custom'>('builtin');
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (scenarioId: string) => {
        if (!confirm('Are you sure you want to delete this custom scenario? This cannot be undone.')) return;
        setDeleting(scenarioId);
        try {
            await fetch(`/api/scenarios/${scenarioId}`, { method: 'DELETE' });
            router.refresh();
        } catch {
            alert('Failed to delete scenario');
        } finally {
            setDeleting(null);
        }
    };

    const scenarios = activeTab === 'builtin' ? builtIn : custom;

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-6">
                <button
                    onClick={() => setActiveTab('builtin')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-smooth ${activeTab === 'builtin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Built-in ({builtIn.length})
                </button>
                <button
                    onClick={() => setActiveTab('custom')}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-smooth ${activeTab === 'custom' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    My Custom Scenarios ({custom.length})
                </button>
            </div>

            {/* Scenario grid */}
            {scenarios.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="text-4xl mb-4">{activeTab === 'custom' ? '✨' : '📋'}</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {activeTab === 'custom' ? 'No custom scenarios yet' : 'No built-in scenarios found'}
                    </h3>
                    <p className="text-sm text-slate-600">
                        {activeTab === 'custom' ? 'Create your first custom scenario to test edge cases specific to your agent.' : 'Run the database migration to load the built-in scenario catalog.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {scenarios.map((s) => (
                        <div key={s.id} className="rounded-xl border bg-white p-5 transition-smooth hover:shadow-md">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-slate-900 text-sm">{s.name}</h3>
                                <div className="flex items-center gap-1.5">
                                    {s.is_custom && (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Custom</span>
                                    )}
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.difficulty === 'hard' ? 'bg-red-50 text-red-700' :
                                            s.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                        }`}>{s.difficulty}</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 mb-3 line-clamp-2">{s.description}</p>

                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{s.category}</span>
                                {s.is_custom && (
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        disabled={deleting === s.id}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-smooth"
                                    >
                                        {deleting === s.id ? 'Deleting...' : '🗑 Delete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

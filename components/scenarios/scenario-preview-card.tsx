'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedScenario } from '@/types/scenario';
import { Button } from '@/components/ui/button';

interface ScenarioPreviewCardProps {
    scenario: GeneratedScenario;
    generationPrompt: string;
    onRegenerate: () => void;
    isRegenerating: boolean;
}

export function ScenarioPreviewCard({ scenario, generationPrompt, onRegenerate, isRegenerating }: ScenarioPreviewCardProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/scenarios/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario, generation_prompt: generationPrompt })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to save');
                setSaving(false);
                return;
            }

            setSaved(true);
            setTimeout(() => router.push('/dashboard/scenarios'), 1500);
        } catch {
            setError('Network error — please try again');
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-slate-50 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-900">Generated Scenario — Review Before Saving</h3>
            </div>

            <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{scenario.title}</h2>
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-700">{scenario.category}</span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${scenario.difficulty === 'hard' ? 'bg-red-50 text-red-700' :
                            scenario.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>{scenario.difficulty}</span>
                    <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700">{scenario.max_turns} turns</span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-700 leading-relaxed">{scenario.description}</p>

                {/* Counterparty Persona */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Counterparty Persona</p>
                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {scenario.counterparty_persona}
                    </div>
                </div>

                {/* Initial Message */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Initial Message (sent to agent)</p>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {scenario.initial_message}
                    </div>
                </div>

                {/* Success Criteria */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Success Criteria</p>
                    <div className="border-l-4 border-emerald-400 pl-4 space-y-2">
                        {scenario.success_criteria.map((c, i) => (
                            <p key={i} className="text-sm text-slate-700">
                                <span className="font-bold text-emerald-600 mr-1">{i + 1}.</span> {c}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Failure Examples */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Failure Examples</p>
                    <div className="border-l-4 border-red-400 pl-4 space-y-2">
                        {scenario.failure_examples.map((f, i) => (
                            <p key={i} className="text-sm text-slate-700">
                                <span className="font-bold text-red-600 mr-1">{i + 1}.</span> {f}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {scenario.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{tag}</span>
                    ))}
                </div>

                {/* Error */}
                {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                {/* Saved success */}
                {saved && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">✅ Scenario saved! Redirecting to your library...</p>}

                {/* Actions */}
                {!saved && (
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onRegenerate}
                            disabled={isRegenerating || saving}
                        >
                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                        <Button
                            className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Scenario'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

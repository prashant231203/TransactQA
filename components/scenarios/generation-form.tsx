'use client';

import { useState, type FormEvent } from 'react';
import type { GeneratedScenario } from '@/types/scenario';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
    { value: 'Inventory Management', label: 'Inventory Management' },
    { value: 'Pricing & Discounts', label: 'Pricing & Discounts' },
    { value: 'Negotiation', label: 'Negotiation' },
    { value: 'Compliance & Documentation', label: 'Compliance & Documentation' },
    { value: 'Error & Edge Case Handling', label: 'Error & Edge Case Handling' },
    { value: 'Returns & Refunds', label: 'Returns & Refunds' },
    { value: 'Customer Escalation', label: 'Customer Escalation' },
    { value: 'Custom (Other)', label: 'Custom (Other)' }
];

interface GenerationFormProps {
    onGenerate: (scenario: GeneratedScenario, prompt: string) => void;
    isLoading: boolean;
}

export function GenerationForm({ onGenerate, isLoading }: GenerationFormProps) {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].value);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [maxTurns, setMaxTurns] = useState(6);
    const [additionalContext, setAdditionalContext] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (description.length < 20) {
            setError('Please provide a more detailed description (at least 20 characters).');
            return;
        }

        try {
            const res = await fetch('/api/scenarios/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    category,
                    difficulty,
                    max_turns: maxTurns,
                    additional_context: additionalContext || undefined
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Generation failed');
                return;
            }

            onGenerate(data.scenario, description);
        } catch {
            setError('Network error — please try again');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
                <Label htmlFor="description">What do you want to test? *</Label>
                <textarea
                    id="description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you want to test. Be specific about the customer behavior, the edge case, or the situation you want your agent to handle. Example: Test how my agent responds when a wholesale buyer tries to negotiate a price below our minimum, using emotional pressure and competitor comparisons."
                    className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="category">Category *</Label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <select
                        id="difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="easy">Easy — straightforward</option>
                        <option value="medium">Medium — requires nuance</option>
                        <option value="hard">Hard — adversarial</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="max-turns">Max conversation turns *</Label>
                <Input
                    id="max-turns"
                    type="number"
                    min={3}
                    max={15}
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(parseInt(e.target.value) || 6)}
                />
                <p className="text-xs text-slate-500">How many back-and-forth exchanges before scoring begins (3-15).</p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="context">Business rules or constraints (optional)</Label>
                <textarea
                    id="context"
                    rows={3}
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any specific rules your agent should follow? Business constraints? Things that count as automatic failures? Example: Our agents must never offer refunds without a return label."
                    className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
            </div>

            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <Button
                type="submit"
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                disabled={isLoading || description.length < 20}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Claude is building your scenario...
                    </span>
                ) : (
                    'Generate Scenario'
                )}
            </Button>
        </form>
    );
}

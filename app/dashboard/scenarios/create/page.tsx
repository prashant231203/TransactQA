'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GeneratedScenario } from '@/types/scenario';
import { GenerationForm } from '@/components/scenarios/generation-form';
import { ScenarioPreviewCard } from '@/components/scenarios/scenario-preview-card';

export default function CreateScenarioPage() {
    const [generatedScenario, setGeneratedScenario] = useState<GeneratedScenario | null>(null);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = (scenario: GeneratedScenario, prompt: string) => {
        setGeneratedScenario(scenario);
        setGenerationPrompt(prompt);
        setIsLoading(false);
    };

    const handleRegenerate = () => {
        setGeneratedScenario(null);
        // The form will still have the same values, user can just submit again
    };

    return (
        <div className="mx-auto max-w-2xl space-y-8 py-8 px-6">
            {/* Header */}
            <div>
                <Link href="/dashboard/scenarios" className="text-sm text-blue-600 hover:underline mb-1 inline-block">← Scenarios</Link>
                <h1 className="text-2xl font-bold text-slate-900">Create Custom Scenario</h1>
                <p className="text-sm text-slate-600 mt-1">Describe what you want to test and Claude will build a complete scenario for you.</p>
            </div>

            {/* Form */}
            {!generatedScenario && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <GenerationForm
                        onGenerate={(scenario, prompt) => {
                            setIsLoading(true);
                            handleGenerate(scenario, prompt);
                        }}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {/* Preview Card */}
            {generatedScenario && (
                <ScenarioPreviewCard
                    scenario={generatedScenario}
                    generationPrompt={generationPrompt}
                    onRegenerate={handleRegenerate}
                    isRegenerating={false}
                />
            )}
        </div>
    );
}

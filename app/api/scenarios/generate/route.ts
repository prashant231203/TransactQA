import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { SCENARIO_GENERATOR_PROMPT } from '@/lib/anthropic/prompts';

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { description?: string; category?: string; difficulty?: string; max_turns?: number; additional_context?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { description, category, difficulty, max_turns, additional_context } = body;

    if (!description || !category || !difficulty || !max_turns) {
        return NextResponse.json({ error: 'description, category, difficulty, and max_turns are required' }, { status: 400 });
    }

    if (description.length < 20) {
        return NextResponse.json({ error: 'Description must be at least 20 characters' }, { status: 400 });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return NextResponse.json({ error: 'difficulty must be easy, medium, or hard' }, { status: 400 });
    }

    if (max_turns < 3 || max_turns > 15) {
        return NextResponse.json({ error: 'max_turns must be between 3 and 15' }, { status: 400 });
    }

    try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: SCENARIO_GENERATOR_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Generate a test scenario for a commerce AI agent based on the following:

DESCRIPTION: ${description}

CATEGORY: ${category}
DIFFICULTY: ${difficulty}
MAX TURNS: ${max_turns}
${additional_context ? `ADDITIONAL CONTEXT / BUSINESS RULES:\n${additional_context}` : ''}

Return only valid JSON. No markdown, no explanation, no code fences.`
                }
            ]
        });

        const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
        const cleanJson = rawText.replace(/```json|```/g, '').trim();

        let scenario;
        try {
            scenario = JSON.parse(cleanJson);
        } catch {
            return NextResponse.json({ error: 'Generation failed — please try again or rephrase your description' }, { status: 500 });
        }

        // Validate required fields
        const requiredFields = ['slug', 'title', 'category', 'difficulty', 'description', 'counterparty_persona', 'initial_message', 'success_criteria', 'failure_examples', 'max_turns', 'tags'];
        const missingFields = requiredFields.filter((f) => scenario[f] === undefined || scenario[f] === null);
        if (missingFields.length > 0) {
            return NextResponse.json({ error: `Generation incomplete — missing fields: ${missingFields.join(', ')}. Click Regenerate.` }, { status: 500 });
        }

        return NextResponse.json({ scenario });
    } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        if (error.status === 429) {
            return NextResponse.json({ error: 'Service busy — please wait 30 seconds and try again' }, { status: 429 });
        }
        return NextResponse.json({ error: 'AI generation temporarily unavailable' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { GeneratedScenario } from '@/types/scenario';

export async function POST(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { scenario?: GeneratedScenario; generation_prompt?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { scenario, generation_prompt } = body;
    if (!scenario) {
        return NextResponse.json({ error: 'scenario object is required' }, { status: 400 });
    }

    // Validate scenario completeness
    if (!scenario.title || scenario.title.length > 60) {
        return NextResponse.json({ error: 'title must be present and under 60 characters' }, { status: 400 });
    }

    const personaWords = (scenario.counterparty_persona || '').split(/\s+/).length;
    if (personaWords < 50) {
        return NextResponse.json({ error: 'counterparty_persona must be at least 50 words' }, { status: 400 });
    }

    const initialWords = (scenario.initial_message || '').split(/\s+/).length;
    if (initialWords < 20) {
        return NextResponse.json({ error: 'initial_message must be at least 20 words' }, { status: 400 });
    }

    if (!Array.isArray(scenario.success_criteria) || scenario.success_criteria.length < 3 || scenario.success_criteria.length > 5) {
        return NextResponse.json({ error: 'success_criteria must have 3-5 items' }, { status: 400 });
    }

    if (!Array.isArray(scenario.failure_examples) || scenario.failure_examples.length < 3 || scenario.failure_examples.length > 5) {
        return NextResponse.json({ error: 'failure_examples must have 3-5 items' }, { status: 400 });
    }

    // Generate unique slug — append user id suffix to avoid collisions
    let slug = scenario.slug || scenario.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    slug = `${slug}-${user.id.slice(0, 8)}`;

    // Check for slug collision, append -v2, -v3 etc.
    let finalSlug = slug;
    let attempt = 1;
    while (true) {
        const { data: existing } = await supabase.from('scenarios').select('id').eq('slug', finalSlug).single();
        if (!existing) break;
        attempt++;
        finalSlug = `${slug}-v${attempt}`;
    }

    const { data, error } = await supabase.from('scenarios').insert({
        slug: finalSlug,
        name: scenario.title,
        description: scenario.description,
        category: scenario.category,
        difficulty: scenario.difficulty,
        agent_type: 'buyer', // default for custom scenarios
        success_criteria: Array.isArray(scenario.success_criteria) ? scenario.success_criteria.join('\n') : scenario.success_criteria,
        failure_examples: Array.isArray(scenario.failure_examples) ? scenario.failure_examples.join('\n') : scenario.failure_examples,
        counterparty_persona: scenario.counterparty_persona,
        initial_message: scenario.initial_message,
        max_turns: scenario.max_turns,
        tags: scenario.tags || [],
        is_active: true,
        is_custom: true,
        created_by: user.id,
        generation_prompt: generation_prompt || null
    }).select('id').single();

    if (error) {
        return NextResponse.json({ error: `Failed to save — ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ scenario_id: data.id });
}

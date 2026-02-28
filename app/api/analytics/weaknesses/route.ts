import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { detectWeaknesses } from '@/lib/analytics/weakness-detector';

export async function GET(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 });

    // Fetch skill profile
    const { data: skills } = await supabase
        .from('agent_skill_profiles')
        .select('skill_name, avg_score, total_evaluations')
        .eq('agent_id', agentId);

    // Fetch recent failures (last 20)
    const { data: failures } = await supabase
        .from('scenario_results')
        .select('score, failure_reason, scenario:scenarios(name, category)')
        .eq('verdict', 'fail')
        .order('created_at', { ascending: false })
        .limit(20);

    const recentFailures = (failures ?? []).map((f: Record<string, unknown>) => {
        const scenario = f.scenario as { name: string; category: string } | null;
        return {
            scenario_name: scenario?.name ?? 'Unknown',
            category: scenario?.category ?? 'unknown',
            failure_reason: f.failure_reason as string | null,
            score: f.score as number | null
        };
    });

    const analysis = await detectWeaknesses(skills ?? [], recentFailures);

    return NextResponse.json(analysis);
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
    _request: Request,
    { params }: { params: { agentId: string } }
) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify the agent belongs to this user
    const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('id', params.agentId)
        .eq('user_id', user.id)
        .single();

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    // Fetch aggregate skill profile
    const { data: skills } = await supabase
        .from('agent_skill_profiles')
        .select('skill_name, avg_score, total_evaluations, last_updated')
        .eq('agent_id', params.agentId)
        .order('skill_name');

    return NextResponse.json({ skills: skills ?? [] });
}

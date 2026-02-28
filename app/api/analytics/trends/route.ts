import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const days = parseInt(searchParams.get('days') || '30');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Build query for runs
    let query = supabase
        .from('runs')
        .select('id, pass_rate, total_scenarios, passed_scenarios, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: true });

    if (agentId) {
        query = query.eq('agent_id', agentId);
    }

    const { data: runs } = await query;

    // Aggregate by day
    const dailyData: Record<string, { pass_rate: number; runs: number; date: string }> = {};
    for (const run of (runs ?? [])) {
        const day = run.completed_at?.split('T')[0] || '';
        if (!dailyData[day]) {
            dailyData[day] = { pass_rate: 0, runs: 0, date: day };
        }
        dailyData[day].pass_rate += (run.pass_rate ?? 0);
        dailyData[day].runs += 1;
    }

    // Average pass rate per day
    const trends = Object.values(dailyData).map((d) => ({
        date: d.date,
        pass_rate: Math.round((d.pass_rate / d.runs) * 100) / 100,
        runs: d.runs
    }));

    return NextResponse.json({ trends, total_runs: runs?.length ?? 0, days });
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
    _request: Request,
    { params }: { params: { id: string; scenarioResultId: string } }
) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify the run belongs to the user
    const { data: run } = await supabase
        .from('runs')
        .select('id')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();
    if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data, error } = await supabase
        .from('scenario_results')
        .select('*, scenario:scenarios(name, category, success_criteria), traces(*)')
        .eq('id', params.scenarioResultId)
        .eq('run_id', params.id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    // Sort traces by turn_number
    if (data?.traces) {
        data.traces.sort((a: { turn_number: number }, b: { turn_number: number }) => a.turn_number - b.turn_number);
    }

    return NextResponse.json({ data });
}

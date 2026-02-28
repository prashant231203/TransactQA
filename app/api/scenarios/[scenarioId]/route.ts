import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function DELETE(
    _request: Request,
    { params }: { params: { scenarioId: string } }
) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify scenario belongs to current user and is custom
    const { data: scenario } = await supabase
        .from('scenarios')
        .select('id, is_custom, created_by')
        .eq('id', params.scenarioId)
        .single();

    if (!scenario) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    if (!scenario.is_custom || scenario.created_by !== user.id) {
        return NextResponse.json({ error: 'You can only delete your own custom scenarios' }, { status: 403 });
    }

    const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', params.scenarioId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

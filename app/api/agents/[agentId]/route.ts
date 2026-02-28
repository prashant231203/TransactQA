import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
    _request: Request,
    { params }: { params: { agentId: string } }
) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', params.agentId)
        .eq('user_id', user.id)
        .single();

    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data });
}

export async function PUT(
    request: Request,
    { params }: { params: { agentId: string } }
) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowedFields = ['name', 'description', 'endpoint_url', 'auth_header_name', 'auth_header_value'];
    const updates: Record<string, string> = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) updates[field] = body[field];
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', params.agentId)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
}

export async function DELETE(
    _request: Request,
    { params }: { params: { agentId: string } }
) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Soft delete by setting status
    const { error } = await supabase
        .from('agents')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', params.agentId)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}

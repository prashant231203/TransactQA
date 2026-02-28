import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const payload = {
    user_id: user.id,
    name: String(body.name ?? ''),
    description: body.description ? String(body.description) : null,
    endpoint_url: String(body.endpoint_url ?? ''),
    auth_header_name: String(body.auth_header_name ?? 'Authorization'),
    auth_header_value: String(body.auth_header_value ?? ''),
    agent_type: String(body.agent_type ?? 'buyer')
  };

  const { data, error } = await supabase.from('agents').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isSafeUrl, isValidHttpUrl } from '@/lib/utils/url';

const VALID_AGENT_TYPES = ['buyer', 'seller', 'negotiator'] as const;
type AgentType = (typeof VALID_AGENT_TYPES)[number];

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

  const body = await req.json() as Record<string, unknown>;

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const endpointUrl = typeof body.endpoint_url === 'string' ? body.endpoint_url.trim() : '';
  const agentType = typeof body.agent_type === 'string' ? body.agent_type : '';
  const authHeaderName = typeof body.auth_header_name === 'string' ? body.auth_header_name.trim() : 'Authorization';
  const authHeaderValue = typeof body.auth_header_value === 'string' ? body.auth_header_value.trim() : '';

  // Input validation
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!isValidHttpUrl(endpointUrl)) return NextResponse.json({ error: 'endpoint_url must be a valid http/https URL' }, { status: 400 });
  if (!isSafeUrl(endpointUrl)) return NextResponse.json({ error: 'endpoint_url must not point to a private or internal address' }, { status: 400 });
  if (!VALID_AGENT_TYPES.includes(agentType as AgentType)) {
    return NextResponse.json({ error: `agent_type must be one of: ${VALID_AGENT_TYPES.join(', ')}` }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    name,
    description: typeof body.description === 'string' ? body.description : null,
    endpoint_url: endpointUrl,
    auth_header_name: authHeaderName,
    auth_header_value: authHeaderValue,
    agent_type: agentType as AgentType,
    status: 'unverified'
  };

  const { data, error } = await supabase.from('agents').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

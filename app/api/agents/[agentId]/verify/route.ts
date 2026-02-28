import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, { params }: { params: { agentId: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: agent } = await supabase.from('agents').select('*').eq('id', params.agentId).eq('user_id', user.id).single();
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  try {
    const response = await fetch(agent.endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [agent.auth_header_name]: agent.auth_header_value
      },
      body: JSON.stringify({ message: 'PING: TransactQA connectivity test. Please respond with any message.', context: 'health_check' }),
      signal: AbortSignal.timeout(10000)
    });

    const isSuccess = response.ok;
    await supabase.from('agents').update({ status: isSuccess ? 'verified' : 'unreachable', last_verified_at: new Date().toISOString() }).eq('id', params.agentId);

    return NextResponse.json({ reachable: isSuccess, status_code: response.status, status: isSuccess ? 'verified' : 'unreachable' });
  } catch {
    await supabase.from('agents').update({ status: 'unreachable', last_verified_at: new Date().toISOString() }).eq('id', params.agentId);
    return NextResponse.json({ reachable: false, status: 'unreachable' });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { executeRun } from '@/lib/runner';
import { isSafeUrl } from '@/lib/utils/url';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as { agent_id: string; scenario_ids: string[] };
  if (!body.agent_id || !body.scenario_ids?.length) {
    return NextResponse.json({ error: 'agent_id and scenario_ids required' }, { status: 400 });
  }

  const { data: agent } = await supabase.from('agents').select('*').eq('id', body.agent_id).eq('user_id', user.id).single();
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  // SSRF guard: reject private/internal URLs
  if (!isSafeUrl(agent.endpoint_url)) {
    return NextResponse.json({ error: 'Agent endpoint URL is not allowed' }, { status: 400 });
  }

  const { data: scenarios } = await supabase.from('scenarios').select('*').in('id', body.scenario_ids).eq('is_active', true);
  if (!scenarios?.length) return NextResponse.json({ error: 'No valid scenarios found' }, { status: 400 });

  const { data: run } = await supabase
    .from('runs')
    .insert({ user_id: user.id, agent_id: body.agent_id, status: 'pending', scenario_ids: body.scenario_ids, total_scenarios: scenarios.length })
    .select('*')
    .single();

  if (!run) return NextResponse.json({ error: 'Failed to create run' }, { status: 500 });

  // Fire the runner in the background — do NOT await it so we can return immediately.
  // The run status is updated in Supabase as it progresses.
  void (async () => {
    try {
      await executeRun(supabase, run.id, agent, scenarios);
    } catch {
      await supabase.from('runs').update({ status: 'failed', error_message: 'Runner failed unexpectedly' }).eq('id', run.id);
    }
  })();

  return NextResponse.json({ run_id: run.id, status: 'pending' }, { status: 202 });
}

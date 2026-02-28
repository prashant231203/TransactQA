import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AgentList } from '@/components/agents/agent-list';
import { PageHeader } from '@/components/layout/page-header';

export default async function AgentsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/sign-in');

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" description="Connect and manage your AI agent endpoints." />
      <AgentList agents={agents ?? []} />
    </div>
  );
}

import { AgentList } from '@/components/agents/agent-list';
import { PageHeader } from '@/components/layout/page-header';
import type { Agent } from '@/types/agent';

const agents: Agent[] = [
  {
    id: 'agent-1',
    user_id: 'user-1',
    name: 'Checkout Analyst',
    description: 'Focuses on payment and checkout workflows.',
    endpoint_url: 'https://example.com/agent',
    auth_header_name: 'Authorization',
    auth_header_value: '***',
    agent_type: 'buyer',
    status: 'unverified',
    last_verified_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default function AgentsPage() {
  return (
    <div>
      <PageHeader title="Agents" description="Manage your QA agents." />
      <AgentList agents={agents} />
    </div>
  );
}

import { AgentList } from "@/components/agents/agent-list";
import { PageHeader } from "@/components/layout/page-header";
import type { Agent } from "@/types/agent";

const agents: Agent[] = [
  {
    id: "agent-1",
    name: "Checkout Analyst",
    description: "Focuses on payment and checkout workflows.",
    model: "claude-3-5-sonnet",
    status: "active",
    createdAt: new Date().toISOString()
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

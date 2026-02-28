import type { Agent } from "@/types/agent";

interface AgentListProps {
  agents: Agent[];
}

export function AgentList({ agents }: AgentListProps) {
  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.id} className="rounded-md border bg-white p-4">
          <p className="font-medium">{agent.name}</p>
          <p className="text-sm text-slate-600">{agent.description}</p>
        </div>
      ))}
    </div>
  );
}

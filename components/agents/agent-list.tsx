'use client';

import { useRouter } from 'next/navigation';
import type { Agent } from '@/types/agent';
import { AgentConnectForm } from './agent-connect-form';
import Link from 'next/link';

interface AgentListProps {
  agents: Agent[];
}

export function AgentList({ agents }: AgentListProps) {
  const router = useRouter();

  const handleVerify = async (agentId: string) => {
    await fetch(`/api/agents/${agentId}/verify`, { method: 'POST' });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AgentConnectForm onSuccess={() => router.refresh()} />
      </div>

      {agents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No agents connected</h3>
          <p className="text-sm text-slate-600">Click &quot;Connect Agent&quot; above to register your first AI agent endpoint.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-xl border bg-white p-5 transition-smooth hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/dashboard/agents/${agent.id}`} className="font-semibold text-slate-900 hover:underline">
                    {agent.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{agent.endpoint_url}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${agent.status === 'verified'
                    ? 'bg-emerald-50 text-emerald-700'
                    : agent.status === 'unreachable'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'verified' ? 'bg-emerald-500' : agent.status === 'unreachable' ? 'bg-red-500' : 'bg-slate-400'
                    }`} />
                  {agent.status}
                </span>
              </div>

              {agent.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{agent.description}</p>
              )}

              <div className="flex items-center justify-between border-t pt-3 mt-1">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{agent.agent_type}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(agent.id)}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 border hover:bg-slate-50 transition-smooth"
                  >
                    Re-verify
                  </button>
                  <Link
                    href={`/dashboard/runs?agent=${agent.id}`}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 transition-smooth"
                  >
                    Run Suite
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

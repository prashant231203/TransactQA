import { PageHeader } from "@/components/layout/page-header";
import { RunList } from "@/components/runs/run-list";
import type { Run } from "@/types/run";

const runs: Run[] = [
  {
    id: "run-1",
    agent: {
      id: "agent-1",
      name: "Checkout Analyst",
      description: "Focuses on payment and checkout workflows.",
      model: "claude-3-5-sonnet",
      status: "active",
      createdAt: new Date().toISOString()
    },
    scenario: {
      id: "onboarding-smoke",
      title: "Onboarding smoke",
      description: "Ensure user onboarding flow succeeds.",
      complexity: "basic",
      tags: ["auth"]
    },
    status: "running",
    startedAt: new Date().toISOString()
  }
];

export default function RunsPage() {
  return (
    <div>
      <PageHeader title="Runs" description="Track current and historical executions." />
      <RunList runs={runs} />
    </div>
  );
}

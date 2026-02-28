import { StatsCards } from "@/components/dashboard/stats-cards";
import { PageHeader } from "@/components/layout/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Monitor QA performance at a glance." />
      <StatsCards
        metrics={[
          { label: "Agents", value: 4 },
          { label: "Runs today", value: 28 },
          { label: "Pass rate", value: "94%" }
        ]}
      />
    </div>
  );
}

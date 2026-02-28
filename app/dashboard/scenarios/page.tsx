import { PageHeader } from "@/components/layout/page-header";
import { ScenarioList } from "@/components/scenarios/scenario-list";
import { scenarioCatalog } from "@/lib/scenarios/catalog";

export default function ScenariosPage() {
  return (
    <div>
      <PageHeader title="Scenarios" description="Browse and curate test scenarios." />
      <ScenarioList scenarios={scenarioCatalog} />
    </div>
  );
}

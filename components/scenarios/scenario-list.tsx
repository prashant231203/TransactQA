import type { Scenario } from '@/types/scenario';

interface ScenarioListProps {
  scenarios: Scenario[];
}

export function ScenarioList({ scenarios }: ScenarioListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {scenarios.map((scenario) => (
        <div key={scenario.id} className="rounded-md border bg-white p-4">
          <p className="font-medium">{scenario.name}</p>
          <p className="text-sm text-slate-600">{scenario.description}</p>
        </div>
      ))}
    </div>
  );
}

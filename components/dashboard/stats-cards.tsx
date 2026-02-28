interface StatsCardsProps {
  metrics: Array<{ label: string; value: string | number }>;
}

export function StatsCards({ metrics }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-md border bg-white p-4">
          <p className="text-sm text-slate-600">{metric.label}</p>
          <p className="text-2xl font-semibold">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

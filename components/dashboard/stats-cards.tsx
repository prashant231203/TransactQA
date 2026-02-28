interface StatsCardsProps {
  metrics: Array<{ label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }>;
}

export function StatsCards({ metrics }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border bg-white p-5 transition-smooth hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{metric.label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
            {metric.trend === 'up' && <span className="text-xs font-medium text-emerald-600">↑</span>}
            {metric.trend === 'down' && <span className="text-xs font-medium text-red-500">↓</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

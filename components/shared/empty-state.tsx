interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed bg-white p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

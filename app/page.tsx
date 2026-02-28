import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">TransactQA</h1>
        <p className="text-slate-600">Scenario-driven AI transaction testing.</p>
        <Link href="/dashboard" className="text-sm font-medium underline">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

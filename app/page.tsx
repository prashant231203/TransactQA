import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Connect",
    description: "Register your agent endpoint with a URL and auth header. We verify connectivity instantly.",
    icon: "🔌"
  },
  {
    number: "02",
    title: "Run",
    description: "Launch 20 adversarial commerce scenarios — pricing traps, compliance gaps, hallucination probes.",
    icon: "▶️"
  },
  {
    number: "03",
    title: "Review",
    description: "Get a scored report with pass/fail verdicts, conversation traces, and actionable failure analysis.",
    icon: "📊"
  }
];

const CATEGORIES = [
  {
    name: "Inventory",
    description: "Out-of-stock handling, partial fulfillment, SKU mismatches, product substitution",
    count: 4,
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    name: "Pricing",
    description: "Price floor enforcement, unauthorized discounts, currency ambiguity, retroactive changes",
    count: 4,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    name: "Negotiation",
    description: "Deadline pressure, counteroffer loops, payment term bait-and-switch, anchor bias",
    count: 4,
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    name: "Compliance",
    description: "Missing documentation, export restrictions, identity verification, verbal commitment traps",
    count: 4,
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    name: "Error Handling",
    description: "Slow responses, contradictory information, hallucination probes, spoofed agent identity",
    count: 4,
    color: "bg-rose-50 text-rose-700 border-rose-200"
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">TransactQA</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-smooth">
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-smooth"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-xs font-medium text-slate-300">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              20 adversarial scenarios ready
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Automated QA for<br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                AI Commerce Agents
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-slate-400">
              Put your agent through realistic buyer-seller conversations. Get scored verdicts,
              conversation traces, and failure analysis before your customers find out.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100 transition-smooth"
              >
                Get Started Free →
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-smooth"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">How It Works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Three steps to confident deployments</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="gradient-card rounded-2xl border p-8 transition-smooth hover:shadow-lg">
                <div className="mb-4 text-3xl">{step.icon}</div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Step {step.number}</p>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenario Categories */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Scenario Library</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">20 adversarial scenarios across 5 categories</h2>
            <p className="mt-3 text-slate-600">Each scenario is designed by commerce experts to probe a specific failure mode.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className={`rounded-xl border p-6 ${cat.color} transition-smooth hover:shadow-md`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{cat.name}</h3>
                  <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-semibold">{cat.count} tests</span>
                </div>
                <p className="text-sm leading-relaxed opacity-80">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Know your agent works before your customers find out it doesn&apos;t.
          </h2>
          <p className="text-slate-400 mb-8">
            Connect your endpoint, run the suite, and get results in under two minutes.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-block rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100 transition-smooth"
          >
            Start Testing Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">TransactQA</span>
          <p className="text-xs text-slate-500">Scenario-driven AI transaction testing.</p>
        </div>
      </footer>
    </div>
  );
}

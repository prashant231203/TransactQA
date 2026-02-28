import Link from "next/link";

const METRICS = [
  { label: "Scenarios", value: "20" },
  { label: "Risk Domains", value: "5" },
  { label: "Avg Runtime", value: "<2 min" },
  { label: "Trace Depth", value: "Per turn" }
];

const FLOW = [
  {
    step: "01",
    title: "Connect agent",
    copy: "Add endpoint + auth. We verify instantly."
  },
  {
    step: "02",
    title: "Run evaluations",
    copy: "Execute adversarial commerce scenarios."
  },
  {
    step: "03",
    title: "Ship with confidence",
    copy: "Use traces, scores, and failure reasons to decide."
  }
];

const HIGHLIGHTS = [
  "Evidence-grade traces",
  "Policy-aware sandbox",
  "Skill trend scoring"
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_#22d3ee]" />
            <span className="text-lg font-semibold tracking-tight">TransactQA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="rounded-md px-3 py-2 text-sm text-slate-300 transition-smooth hover:bg-white/5 hover:text-white">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-smooth hover:bg-slate-200">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -left-28 top-8 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              Modern QA for AI commerce agents
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Less guesswork.
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent"> More measurable reliability.</span>
            </h1>
            <p className="mt-5 max-w-xl text-slate-300">
              Validate policy adherence, tool behavior, and response quality before production.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/sign-up" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-smooth hover:bg-slate-200">
                Run first benchmark
              </Link>
              <Link href="#flow" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-slate-100 transition-smooth hover:bg-white/5">
                See flow
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <p className="mb-4 text-sm font-medium text-slate-300">Platform snapshot</p>
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Flow</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Simple 3-step release gate</h2>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {FLOW.map((item) => (
            <article key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-semibold tracking-wider text-cyan-300">STEP {item.step}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/70">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-slate-950/70 px-5 py-4 text-center text-sm font-medium text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to evaluate your agent?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Run concrete scenario checks before every release.</p>
          <Link href="/auth/sign-up" className="mt-7 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-slate-900 transition-smooth hover:bg-slate-200">
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}

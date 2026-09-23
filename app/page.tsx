const useCases = [
  {
    title: "Reply to a customer",
    body: "Turn a rough note into a clear, professional reply you can actually send."
  },
  {
    title: "Summarize & extract actions",
    body: "Turn long notes or messages into decisions, owners, and next steps."
  },
  {
    title: "Plan & organize",
    body: "Create a practical daily plan, checklist, proposal outline, or action plan."
  }
];

const comparison = [
  ["Blank chat box", "Guided tasks"],
  ["You decide what to ask", "The product helps you start"],
  ["Raw answers", "Ready-to-use outputs"],
  ["Repeated prompting", "Reusable workflows"],
  ["Tool switching", "One simple entry point"],
  ["Mostly text-first", "Plain language + voice"]
];

const faqs = [
  [
    "Is this another chatbot?",
    "No. AI for Everyone is organized around guided work tasks and ready-to-use results, not a blank chat box."
  ],
  [
    "How is it different from free AI tools?",
    "The goal is not a smarter base model. The difference is simpler guidance, repeatable workflows, and results shaped for everyday work."
  ],
  [
    "Do I need to know how to write prompts?",
    "No. You choose a task, describe what you need in normal language, and the workflow guides the rest."
  ],
  [
    "Can I use voice?",
    "Voice input is part of the product direction. Early access may vary by workflow while we validate the simplest useful experience."
  ],
  [
    "Who is it for?",
    "The MVP is focused on non-technical solo professionals and small-business operators."
  ],
  [
    "Can I cancel anytime?",
    "Yes. The founding offer is designed as a simple monthly plan with no long-term contract."
  ]
];

export default function Home() {
  return (
    <main className="bg-[#f7f7f4] text-neutral-950">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f7f4]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#" className="font-semibold tracking-tight">AI for Everyone</a>
          <div className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
            <a href="#how">How it works</a>
            <a href="#use-cases">Use cases</a>
            <a href="#pricing">Pricing</a>
          </div>
          <a href="/start" className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
            Try your first task
          </a>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[82vh] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Guided AI work assistant
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Tell AI what you need. Get the work done.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600 sm:text-xl">
            Ready-to-use messages, summaries, plans, follow-ups, and guided workflows — without learning prompts, switching tools, or becoming an AI expert.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/start" className="rounded-xl bg-neutral-950 px-5 py-3 text-center text-sm font-medium text-white">
              Try your first task
            </a>
            <a href="#demo" className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-medium">
              See what it can do
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
            <span>Built for solo professionals and small businesses</span>
            <span>No prompt expertise required</span>
            <span>Plain language + voice</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-4 shadow-[0_30px_80px_rgba(0,0,0,.08)]">
          <div className="rounded-[1.5rem] bg-neutral-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Choose a task</p>
            <div className="mt-4 grid gap-2">
              {["Reply to a customer", "Summarize & extract actions", "Plan & organize"].map((item, i) => (
                <div key={item} className={`rounded-xl border px-4 py-3 text-sm ${i === 0 ? "border-white bg-white text-neutral-950" : "border-white/15 text-neutral-300"}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-[1.5rem] border border-black/8 bg-[#fafafa] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">Your request</p>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              “A customer saw our proposal last week and hasn’t replied. I want to follow up without sounding pushy.”
            </p>
            <div className="mt-5 rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-neutral-400">Ready-to-send result</p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                Hi — just checking in to see if you had any questions about the proposal. Happy to clarify anything or adjust the next step whenever it suits you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">The problem</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            AI is powerful. Using it well still feels like work.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              "Not sure what to ask",
              "Too many AI tools and tabs",
              "Getting answers instead of finished work",
              "Rewriting prompts over and over",
              "Hard to repeat a good workflow",
              "Too much setup for a simple task"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-black/8 bg-[#fafafa] p-5 text-sm text-neutral-700">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">How it works</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          From request to finished result in one simple flow.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Choose what you want to get done", "Start from a clear task instead of a blank box."],
            ["02", "Speak or type naturally", "Describe the situation in normal language. No prompt engineering."],
            ["03", "Get a ready-to-use result", "Copy, edit, save, or continue from a structured output."]
          ].map(([n, title, body]) => (
            <div key={n} className="rounded-3xl border border-black/8 bg-white p-6">
              <p className="text-sm font-semibold text-neutral-400">{n}</p>
              <h3 className="mt-8 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="use-cases" className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">Use cases</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Start with the work you already do every day.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {useCases.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Why not free AI?</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Less prompting. Less switching. More finished work.
        </h2>
        <div className="mt-10 overflow-hidden rounded-3xl border border-black/8 bg-white">
          <div className="grid grid-cols-2 border-b border-black/8 bg-[#fafafa] px-5 py-4 text-sm font-semibold">
            <span>Free general-purpose AI</span>
            <span>AI for Everyone</span>
          </div>
          {comparison.map(([a,b]) => (
            <div key={a} className="grid grid-cols-2 gap-4 border-b border-black/5 px-5 py-4 text-sm last:border-0">
              <span className="text-neutral-500">{a}</span>
              <span className="font-medium">{b}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Product demo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              See a real task go from request to result.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-neutral-600">
              The product recognizes the job, asks only for essential missing context, and returns something usable — not a lecture about how to prompt.
            </p>
          </div>
          <div className="rounded-3xl bg-[#f7f7f4] p-5">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">Input</p>
              <p className="mt-2 text-sm leading-6">“A customer saw our proposal last week and hasn’t replied. I want to follow up without sounding pushy.”</p>
            </div>
            <div className="mt-3 rounded-2xl bg-neutral-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Output</p>
              <p className="mt-2 text-sm leading-6 text-neutral-200">Hi — just checking in to see if you had any questions about the proposal. Happy to clarify anything or adjust the next step whenever it suits you.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {["Shorter", "Warmer", "More professional"].map((t) => <span key={t} className="rounded-full border border-white/15 px-3 py-1.5">{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Simple pricing. Start small.</h2>
            <p className="mt-5 max-w-xl leading-7 text-neutral-600">One primary plan for the MVP. No complicated tiers, no long-term contract, and no “unlimited AI” promise.</p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">AI for Everyone — Core</p>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-semibold">$19</span>
              <span className="pb-1 text-neutral-500">/ month</span>
            </div>
            <p className="mt-2 text-sm font-medium text-neutral-700">Founding member: $9 first month, then $19/month.</p>
            <ul className="mt-6 space-y-3 text-sm text-neutral-600">
              <li>✓ Guided everyday AI workflows</li>
              <li>✓ Ready-to-use work outputs</li>
              <li>✓ Saved and reusable task flows</li>
              <li>✓ Plain-language interaction</li>
              <li>✓ Voice input where available</li>
            </ul>
            <a href="/start" className="mt-7 block rounded-xl bg-neutral-950 px-5 py-3 text-center text-sm font-medium text-white">Try your first task</a>
            <p className="mt-3 text-center text-xs text-neutral-400">Cancel anytime. Usage limits may apply during early access.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#ecece6]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Trust & control</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">You stay in control.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {["Review before sending", "Edit every output", "Human approval for important actions", "Clear usage and billing", "Cancel anytime", "No fully autonomous promises"].map((item) => (
              <div key={item} className="rounded-2xl bg-white p-5 text-sm font-medium">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Questions before you start.</h2>
        <div className="mt-8 divide-y divide-black/8 border-y border-black/8">
          {faqs.map(([q,a]) => (
            <details key={q} className="group py-5">
              <summary className="cursor-pointer list-none font-medium">{q}</summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-neutral-950 px-6 py-14 text-center text-white sm:px-10">
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Start with one task you already need to finish today.
          </h2>
          <p className="mt-4 text-neutral-300">No prompt expertise required.</p>
          <a href="/start" className="mt-7 inline-block rounded-xl bg-white px-5 py-3 text-sm font-medium text-neutral-950">
            Try your first task
          </a>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <span>AI for Everyone · MVP 0.1</span>
        <span>Outcome → Simplicity → Proof → Price → Trust</span>
      </footer>
    </main>
  );
}

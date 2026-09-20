export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
          AI for Everyone · MVP 0.1
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Tell AI what you need. Get the work done.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          Ready-to-use messages, summaries, plans, follow-ups, and guided workflows — without learning prompts or becoming an AI expert.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#"
            className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
          >
            Try your first task
          </a>
          <a
            href="#"
            className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-medium"
          >
            See what it can do
          </a>
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          Baseline scaffold only. FAN-13 will implement the full landing page.
        </p>
      </section>
    </main>
  );
}

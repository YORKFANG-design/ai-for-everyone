const tasks = [
  ["Reply to a customer", "Turn a rough message into a clear, professional reply."],
  ["Summarize & extract actions", "Turn notes or long text into decisions and next steps."],
  ["Plan & organize", "Create a practical plan, checklist, or action outline."]
];

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
        <a href="/" className="text-sm text-neutral-500">← Back to home</a>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">First-use entry</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">What do you want to get done?</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
          Pick one task to enter the guided first-use flow. The full workflow implementation continues in FAN-14 and FAN-15.
        </p>
        <div className="mt-10 grid gap-4">
          {tasks.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-black/8 bg-white p-5">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isTaskId, MAX_ANSWER, MAX_INPUT, parseRequest, tasks, type IntakeResponse, type TaskId, type TaskRequest } from "../../lib/first-use";

const DRAFT_KEY = "afe:first-use:v1";
const button = "min-h-12 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 disabled:cursor-wait disabled:opacity-50";
const secondary = `${button} border border-neutral-300 bg-white hover:bg-neutral-100`;
type Step = "picker" | "input" | "clarify" | "ready";

export default function FirstTask() {
  const [task, setTask] = useState<TaskId | null>(null);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [step, setStep] = useState<Step>("picker");
  const [question, setQuestion] = useState("");
  const [ready, setReady] = useState<TaskRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [storageNote, setStorageNote] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const lock = useRef(false);
  const selected = tasks.find(item => item.id === task);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.version === 1 && isTaskId(draft.task) && typeof draft.input === "string" && draft.input.length <= MAX_INPUT && typeof draft.clarification === "string" && draft.clarification.length <= MAX_ANSWER) {
          setTask(draft.task); setInput(draft.input); setAnswer(draft.clarification); setStep("input");
        }
      }
    } catch { setStorageNote("Draft recovery is unavailable. Keep this page open while you work."); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (task) localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, task, input, clarification: answer }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch { setStorageNote("Your draft could not be saved on this device. Keep this page open."); }
  }, [task, input, answer, loaded]);

  useEffect(() => { if (loaded) heading.current?.focus(); }, [step, loaded]);

  function choose(id: TaskId) {
    if (id !== task) { setAnswer(""); setQuestion(""); }
    setTask(id); setStep("input"); setError(""); setReady(null);
  }

  function reset() {
    setTask(null); setInput(""); setAnswer(""); setQuestion(""); setReady(null); setError(""); setStep("picker");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !task) return;
    if (!input.trim()) { setError("Tell us a little about what you need."); return; }
    if (step === "clarify" && !answer.trim()) { setError("Add the missing context so we can continue."); return; }
    lock.current = true; setBusy(true); setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/first-use", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ version: 1, task, input, clarification: answer })
      });
      if (!response.ok) throw new Error("submission");
      const data: IntakeResponse = await response.json();
      if (data.status === "clarification_required" && typeof data.question === "string") {
        setQuestion(data.question); setStep("clarify");
      } else if (data.status === "ready" && parseRequest(data.request) && data.generationAvailable === false) {
        setReady(data.request); setStep("ready");
      } else throw new Error("response");
    } catch { setError("We could not submit your request. Your text is still here. Please try again."); }
    finally { clearTimeout(timeout); lock.current = false; setBusy(false); }
  }

  const title = step === "picker" ? "What do you want to get done?" : step === "input" ? "Tell us what you need." : step === "clarify" ? "One quick question" : "Your request is ready";

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-neutral-950">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <a href="/" className="rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">AI for Everyone</a>
          <span className="text-sm text-neutral-600">No account needed</span>
        </header>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{step === "picker" ? "01 / Choose a task" : step === "ready" ? "Ready for the next step" : "02 / Add your context"}</p>
        <h1 ref={heading} tabIndex={-1} className="mt-3 text-4xl font-semibold tracking-tight outline-none sm:text-5xl">{title}</h1>
        {step === "picker" ? <>
          <p className="mt-4 leading-7 text-neutral-600">Start with one thing on your list. Plain language is all you need.</p>
          <div className="mt-8 grid gap-3">
            {tasks.slice(0, 3).map((item, index) => <button disabled={!loaded} key={item.id} onClick={() => choose(item.id)} className="group rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-4">
              <span className="flex items-start justify-between gap-4"><span className="text-lg font-semibold">{item.title}</span><span aria-hidden="true" className="shrink-0 whitespace-nowrap text-neutral-400">0{index + 1} ↗</span></span>
              <span className="mt-2 block text-sm leading-6 text-neutral-600">{item.description}</span>
              <span className="mt-4 block border-t border-neutral-100 pt-3 text-xs text-neutral-500">You’ll get: {item.preview}</span>
            </button>)}
          </div>
          <button disabled={!loaded} onClick={() => choose("other")} className={`${secondary} mt-4 w-full`}>Something else →</button>
        </> : step === "ready" && ready ? <>
          <p className="mt-4 leading-7 text-neutral-600">Your context is prepared. Result creation is not available yet. You can review or edit your request below.</p>
          <section aria-label="Prepared request" className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="font-semibold">{selected?.title}</h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{ready.input}</p>
            {ready.clarification && <><h3 className="mt-5 text-sm font-semibold">Added context</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{ready.clarification}</p></>}
            <p className="mt-6 border-t border-neutral-100 pt-4 text-xs leading-5 text-neutral-500">No result has been generated and nothing has been sent to a customer.</p>
          </section>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={() => { setStep("input"); setReady(null); }} className={`${button} bg-neutral-950 text-white hover:bg-neutral-800`}>Edit request</button><button onClick={reset} className={secondary}>Start another task</button></div>
        </> : <>
          <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm text-neutral-600">{selected?.title}</span><button disabled={busy} onClick={() => { setStep("picker"); setError(""); }} className="min-h-11 rounded px-2 text-sm underline underline-offset-4 focus-visible:outline-2">Change task</button></div>
          <form onSubmit={submit} aria-busy={busy} className="mt-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <label htmlFor="context" className="block font-medium">{step === "clarify" ? question : "Describe your task or paste your content"}</label>
              <p id="input-help" className="mt-2 text-sm leading-6 text-neutral-600">{step === "clarify" ? "Just the missing detail. No need to repeat your request." : "Type naturally, or paste a message, notes, or an idea here."}</p>
              <textarea id="context" name="context" disabled={busy} value={step === "clarify" ? answer : input} onChange={event => { if (step === "clarify") setAnswer(event.target.value); else { setInput(event.target.value); setAnswer(""); } setError(""); }} maxLength={step === "clarify" ? MAX_ANSWER : MAX_INPUT} aria-describedby={`input-help character-count${error ? " input-error" : ""}`} aria-invalid={Boolean(error)} rows={7} className="mt-4 block w-full resize-y rounded-xl border border-neutral-300 bg-[#fafafa] p-4 text-base leading-7 focus:border-neutral-950 focus:outline-2 focus:outline-offset-2 focus:outline-neutral-950 disabled:opacity-60" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-2"><svg aria-hidden="true" width="16" height="20" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="1" width="6" height="11" rx="3"/><path d="M2 8v2a6 6 0 0 0 12 0V8M8 16v3M5 19h6"/></svg>Voice input · Coming soon</span>
                <span id="character-count">{(step === "clarify" ? answer : input).length.toLocaleString()} / {(step === "clarify" ? MAX_ANSWER : MAX_INPUT).toLocaleString()}</span>
              </div>
            </div>
            {step === "input" && <aside className="mt-4 rounded-xl bg-[#ecece6] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">For example</p><p className="mt-2 text-sm leading-6 text-neutral-700">“{selected?.example}”</p></aside>}
            {step === "clarify" && <details className="mt-4 text-sm"><summary className="min-h-11 cursor-pointer py-3">Review your original request</summary><p className="whitespace-pre-wrap break-words leading-6 text-neutral-600">{input}</p></details>}
            {error && <p id="input-error" role="alert" className="mt-4 text-sm leading-6 text-red-700">{error}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={busy || !loaded} type="submit" className={`${button} bg-neutral-950 text-white hover:bg-neutral-800`} aria-live="polite">{busy ? "Submitting…" : step === "clarify" ? "Continue →" : "Continue with my request →"}</button>{step === "clarify" && <button disabled={busy} type="button" onClick={() => { setStep("input"); setError(""); }} className={secondary}>Edit original request</button>}</div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">Result creation is coming next. You can prepare your request now.</p>
          </form>
        </>}
        <footer className="mt-8 border-t border-neutral-200 pt-5 text-xs leading-6 text-neutral-500">
          <p role="status">{storageNote || "Your draft stays on this device. Avoid entering sensitive information on a shared device."}</p>
          {task && <button disabled={busy} onClick={reset} className="mt-1 min-h-11 rounded text-sm underline underline-offset-4 focus-visible:outline-2">Clear draft and start over</button>}
        </footer>
      </div>
    </main>
  );
}


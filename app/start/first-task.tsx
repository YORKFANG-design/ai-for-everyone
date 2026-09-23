"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isTaskId, MAX_ANSWER, MAX_INPUT, parseRequest, tasks, type IntakeResponse, type TaskId, type TaskRequest } from "../../lib/first-use";
import type { WorkflowResult } from "../../lib/ai/workflows";
import type { QuickAction } from "../../lib/ai/result-actions";

const DRAFT_KEY = "afe:first-use:v1";
const button = "min-h-12 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950 disabled:cursor-wait disabled:opacity-50";
const secondary = `${button} border border-neutral-300 bg-white hover:bg-neutral-100`;
type Step = "picker" | "input" | "clarify" | "ready" | "result";
type GenerationResponse = { status: "clarification_required"; question: string } | { status: "result"; workflow: string; result: WorkflowResult; meta: { traceId: string } };

function track(event: string, workflow: TaskId | null, action?: string) {
  const payload = JSON.stringify({ event, workflow, action });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
  } catch {}
}

function plainText(result: WorkflowResult) {
  if (result.kind === "reply") return result.text;
  if (result.kind === "summary") {
    const points = result.keyPoints.length ? "\n\nKey points\n" + result.keyPoints.map(item => "• " + item).join("\n") : "";
    const actions = result.actions.length ? "\n\nActions\n" + result.actions.map(item => "• " + item.task + (item.owner ? " — " + item.owner : "") + (item.deadline ? " — " + item.deadline : "")).join("\n") : "";
    return result.summary + points + actions;
  }
  return result.goal + "\n\n" + result.steps.map((item, index) => (index + 1) + ". " + item.step + (item.detail ? "\n   " + item.detail : "")).join("\n");
}

function EditableResult({ result, onChange }: { result: WorkflowResult; onChange: (next: WorkflowResult) => void }) {
  const field = "w-full rounded-xl border border-neutral-300 bg-[#fafafa] p-3 text-sm leading-7 focus:border-neutral-950 focus:outline-2 focus:outline-offset-2";
  if (result.kind === "reply") return <textarea aria-label="Editable result" rows={9} className={field} value={result.text} onChange={e => onChange({ ...result, text: e.target.value })} />;
  if (result.kind === "summary") return <div className="space-y-5">
    <div><label className="text-sm font-semibold">Summary</label><textarea rows={5} className={`${field} mt-2`} value={result.summary} onChange={e => onChange({ ...result, summary: e.target.value })} /></div>
    <div><p className="text-sm font-semibold">Key points</p><div className="mt-2 space-y-2">{result.keyPoints.map((point, index) => <input key={index} className={field} value={point} onChange={e => { const keyPoints = [...result.keyPoints]; keyPoints[index] = e.target.value; onChange({ ...result, keyPoints }); }} />)}</div></div>
    <div><p className="text-sm font-semibold">Actions</p><div className="mt-2 space-y-3">{result.actions.map((action, index) => <div key={index} className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-2"><input className={`${field} sm:col-span-2`} value={action.task} onChange={e => { const actions = [...result.actions]; actions[index] = { ...action, task: e.target.value }; onChange({ ...result, actions }); }} /><input aria-label="Owner" placeholder="Owner" className={field} value={action.owner ?? ""} onChange={e => { const actions = [...result.actions]; actions[index] = { ...action, owner: e.target.value || null }; onChange({ ...result, actions }); }} /><input aria-label="Deadline" placeholder="Deadline" className={field} value={action.deadline ?? ""} onChange={e => { const actions = [...result.actions]; actions[index] = { ...action, deadline: e.target.value || null }; onChange({ ...result, actions }); }} /></div>)}</div></div>
  </div>;
  return <div className="space-y-5">
    <div><label className="text-sm font-semibold">Goal</label><input className={`${field} mt-2`} value={result.goal} onChange={e => onChange({ ...result, goal: e.target.value })} /></div>
    <div><p className="text-sm font-semibold">Plan</p><div className="mt-2 space-y-3">{result.steps.map((step, index) => <div key={index} className="rounded-xl border border-neutral-200 p-3"><div className="flex gap-3"><span className="pt-3 text-xs font-semibold text-neutral-400">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1 space-y-2"><input className={field} value={step.step} onChange={e => { const steps = [...result.steps]; steps[index] = { ...step, step: e.target.value }; onChange({ ...result, steps }); }} /><textarea rows={2} placeholder="Optional detail" className={field} value={step.detail ?? ""} onChange={e => { const steps = [...result.steps]; steps[index] = { ...step, detail: e.target.value || null }; onChange({ ...result, steps }); }} /></div></div></div>)}</div></div>
  </div>;
}

export default function FirstTask() {
  const [task, setTask] = useState<TaskId | null>(null);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [step, setStep] = useState<Step>("picker");
  const [question, setQuestion] = useState("");
  const [ready, setReady] = useState<TaskRequest | null>(null);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [previousResult, setPreviousResult] = useState<WorkflowResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    setTask(id); setStep("input"); setError(""); setNotice(""); setReady(null); setResult(null); setPreviousResult(null);
  }

  function reset() {
    setTask(null); setInput(""); setAnswer(""); setQuestion(""); setReady(null); setResult(null); setPreviousResult(null); setError(""); setNotice(""); setStep("picker");
  }

  function requestObject(): TaskRequest | null {
    if (!task) return null;
    return parseRequest({ version: 1, task, input, clarification: answer });
  }

  async function callGeneration(action?: QuickAction) {
    const request = requestObject();
    if (!request || request.task === "other") throw new Error("unsupported");
    const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action && result ? { request, action, currentResult: result } : request) });
    if (!response.ok) throw new Error("generation");
    return await response.json() as GenerationResponse;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !task) return;
    if (!input.trim()) { setError("Tell us a little about what you need."); return; }
    if (step === "clarify" && !answer.trim()) { setError("Add the missing context so we can continue."); return; }
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      if (task === "other") {
        const response = await fetch("/api/first-use", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: 1, task, input, clarification: answer }) });
        if (!response.ok) throw new Error("submission");
        const data: IntakeResponse = await response.json();
        if (data.status === "clarification_required") { setQuestion(data.question); setStep("clarify"); }
        else if (data.status === "ready" && parseRequest(data.request)) { setReady(data.request); setStep("ready"); }
        else throw new Error("response");
      } else {
        const data = await callGeneration();
        if (data.status === "clarification_required") { setQuestion(data.question); setStep("clarify"); }
        else { setResult(data.result); setPreviousResult(null); setStep("result"); }
      }
    } catch { setError("We could not create your result. Your text is still here. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function regenerate(action: QuickAction) {
    if (!result || busy || !task) return;
    setBusy(true); setError(""); setNotice("");
    const before = result;
    try {
      const data = await callGeneration(action);
      if (data.status !== "result") throw new Error("unexpected");
      setPreviousResult(before); setResult(data.result);
      track("first_result_regenerated", task, action);
      setNotice(action === "another" ? "Created another version." : "Updated your result.");
    } catch { setError("We could not update the result. Your current version is still here."); }
    finally { setBusy(false); }
  }

  async function copyResult() {
    if (!result || !task) return;
    try {
      await navigator.clipboard.writeText(plainText(result));
      track("first_result_copied", task);
      setNotice("Copied. Ready to use."); setError("");
    } catch { setError("Copy did not work on this device. You can still select the editable result manually."); }
  }

  function saveEntry() {
    if (!task) return;
    track("save_workflow_clicked", task);
    setNotice("Save is the next account step. Your result stays editable here for now.");
  }

  const title = step === "picker" ? "What do you want to get done?" : step === "input" ? "Tell us what you need." : step === "clarify" ? "One quick question" : step === "result" ? "Here’s a ready-to-use version" : "Your request is ready";

  return <main className="min-h-screen bg-[#f7f7f4] text-neutral-950"><div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6"><a href="/" className="rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">AI for Everyone</a><span className="text-sm text-neutral-600">No account needed</span></header>
    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{step === "picker" ? "01 / Choose a task" : step === "result" ? "03 / Use your result" : step === "ready" ? "Ready for future support" : "02 / Add your context"}</p>
    <h1 ref={heading} tabIndex={-1} className="mt-3 text-4xl font-semibold tracking-tight outline-none sm:text-5xl">{title}</h1>

    {step === "picker" ? <>
      <p className="mt-4 leading-7 text-neutral-600">Start with one thing on your list. Plain language is all you need.</p>
      <div className="mt-8 grid gap-3">{tasks.slice(0, 3).map((item, index) => <button disabled={!loaded} key={item.id} onClick={() => choose(item.id)} className="group rounded-2xl border border-neutral-200 bg-white p-5 text-left transition hover:border-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-4"><span className="flex items-start justify-between gap-4"><span className="text-lg font-semibold">{item.title}</span><span aria-hidden="true" className="shrink-0 whitespace-nowrap text-neutral-400">0{index + 1} ↗</span></span><span className="mt-2 block text-sm leading-6 text-neutral-600">{item.description}</span><span className="mt-4 block border-t border-neutral-100 pt-3 text-xs text-neutral-500">You’ll get: {item.preview}</span></button>)}</div>
      <button disabled={!loaded} onClick={() => choose("other")} className={`${secondary} mt-4 w-full`}>Something else →</button>
    </> : step === "result" && result ? <>
      <p className="mt-4 leading-7 text-neutral-600">Review it, edit anything you want, then copy it when it feels right.</p>
      <section className="mt-7 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{selected?.title}</h2><span className="text-xs text-neutral-500">Editable</span></div><EditableResult result={result} onChange={setResult} /></section>
      <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Quick actions</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><button disabled={busy} onClick={() => regenerate("shorter")} className={secondary}>Shorter</button><button disabled={busy} onClick={() => regenerate("warmer")} className={secondary}>Warmer</button><button disabled={busy} onClick={() => regenerate("professional")} className={secondary}>More professional</button><button disabled={busy} onClick={() => regenerate("another")} className={secondary}>Another version</button></div></div>
      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 text-sm leading-6 text-neutral-700">{notice}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={busy} onClick={copyResult} className={`${button} bg-neutral-950 text-white hover:bg-neutral-800`}>Copy / Use this</button><button disabled={busy} onClick={saveEntry} className={secondary}>Save workflow</button>{previousResult && <button disabled={busy} onClick={() => { setResult(previousResult); setPreviousResult(null); setNotice("Restored the previous version."); }} className={secondary}>Undo last change</button>}</div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm"><button disabled={busy} onClick={() => { setStep("input"); setError(""); setNotice(""); }} className="min-h-11 underline underline-offset-4">Add context / edit request</button><button disabled={busy} onClick={reset} className="min-h-11 underline underline-offset-4">Start another task</button></div>
    </> : step === "ready" && ready ? <>
      <p className="mt-4 leading-7 text-neutral-600">Custom tasks are not one of the three guided MVP workflows yet. Your request is preserved for a future workflow.</p>
      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><h2 className="font-semibold">{selected?.title}</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{ready.input}</p>{ready.clarification && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{ready.clarification}</p>}</section>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={() => { setStep("input"); setReady(null); }} className={`${button} bg-neutral-950 text-white`}>Edit request</button><button onClick={reset} className={secondary}>Start another task</button></div>
    </> : <>
      <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-sm text-neutral-600">{selected?.title}</span><button disabled={busy} onClick={() => { setStep("picker"); setError(""); }} className="min-h-11 rounded px-2 text-sm underline underline-offset-4">Change task</button></div>
      <form onSubmit={submit} aria-busy={busy} className="mt-5"><div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><label htmlFor="context" className="block font-medium">{step === "clarify" ? question : "Describe your task or paste your content"}</label><p id="input-help" className="mt-2 text-sm leading-6 text-neutral-600">{step === "clarify" ? "Just the missing detail. No need to repeat your request." : "Type naturally, or paste a message, notes, or an idea here."}</p><textarea id="context" disabled={busy} value={step === "clarify" ? answer : input} onChange={event => { if (step === "clarify") setAnswer(event.target.value); else { setInput(event.target.value); setAnswer(""); } setError(""); }} maxLength={step === "clarify" ? MAX_ANSWER : MAX_INPUT} rows={7} className="mt-4 block w-full resize-y rounded-xl border border-neutral-300 bg-[#fafafa] p-4 text-base leading-7 focus:border-neutral-950 focus:outline-2 focus:outline-offset-2 disabled:opacity-60" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500"><span>Voice input · Coming soon</span><span>{(step === "clarify" ? answer : input).length.toLocaleString()} / {(step === "clarify" ? MAX_ANSWER : MAX_INPUT).toLocaleString()}</span></div></div>
      {step === "input" && <aside className="mt-4 rounded-xl bg-[#ecece6] p-4"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-600">For example</p><p className="mt-2 text-sm leading-6 text-neutral-700">“{selected?.example}”</p></aside>}{step === "clarify" && <details className="mt-4 text-sm"><summary className="min-h-11 cursor-pointer py-3">Review your original request</summary><p className="whitespace-pre-wrap break-words leading-6 text-neutral-600">{input}</p></details>}
      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{error}</p>}<div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={busy || !loaded} type="submit" className={`${button} bg-neutral-950 text-white hover:bg-neutral-800`}>{busy ? "Creating…" : step === "clarify" ? "Continue →" : task === "other" ? "Continue with my request →" : "Create my result →"}</button>{step === "clarify" && <button disabled={busy} type="button" onClick={() => { setStep("input"); setError(""); }} className={secondary}>Edit original request</button>}</div>
      </form>
    </>}

    <footer className="mt-8 border-t border-neutral-200 pt-5 text-xs leading-6 text-neutral-500"><p>{storageNote || "Your draft stays on this device. Avoid entering sensitive information on a shared device."}</p>{task && step !== "result" && <button disabled={busy} onClick={reset} className="mt-1 min-h-11 text-sm underline underline-offset-4">Clear draft and start over</button>}</footer>
  </div></main>;
}

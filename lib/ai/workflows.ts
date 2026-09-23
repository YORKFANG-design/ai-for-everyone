import type { TaskId, TaskRequest } from "../first-use";

export type GuidedTaskId = Exclude<TaskId, "other">;
export type ReplyResult = { kind: "reply"; text: string };
export type SummaryAction = { task: string; owner: string | null; deadline: string | null };
export type SummaryResult = { kind: "summary"; summary: string; keyPoints: string[]; actions: SummaryAction[] };
export type PlanStep = { step: string; detail: string | null };
export type PlanResult = { kind: "plan"; goal: string; steps: PlanStep[] };
export type WorkflowResult = ReplyResult | SummaryResult | PlanResult;

export type WorkflowSpec = {
  id: GuidedTaskId;
  name: string;
  system: string;
  responseShape: string;
  maxOutputTokens: number;
};

const common = [
  "You are completing one practical work task for a non-technical user.",
  "Return a finished, usable result rather than teaching prompt-writing.",
  "Use only information supplied by the user. Do not invent names, dates, promises, owners, or facts.",
  "If a detail is unknown, omit it or use null where the schema allows.",
  "Keep the tone clear, natural, and professional.",
  "Return strict JSON only, with no markdown fences or commentary."
].join(" ");

export const workflowSpecs: Record<GuidedTaskId, WorkflowSpec> = {
  reply: { id: "reply", name: "Reply to a customer", system: [common, "Draft a message the user could realistically send with little or no editing.", "Do not add fake urgency, discounts, commitments, or customer details.", "Prefer concise, warm, professional language."].join(" "), responseShape: '{"kind":"reply","text":"ready-to-send message"}', maxOutputTokens: 500 },
  summary: { id: "summary", name: "Summarize & extract actions", system: [common, "Separate factual summary from actions.", "Only list an owner or deadline when it is explicitly present in the source.", "Keep key points distinct and avoid duplicating actions."].join(" "), responseShape: '{"kind":"summary","summary":"concise summary","keyPoints":["point"],"actions":[{"task":"action","owner":null,"deadline":null}]}', maxOutputTokens: 900 },
  plan: { id: "plan", name: "Plan & organize", system: [common, "Turn the stated goal into an ordered, realistic plan.", "Do not invent deadlines, budgets, people, approvals, or dependencies.", "Prefer concrete next actions over generic advice."].join(" "), responseShape: '{"kind":"plan","goal":"user goal","steps":[{"step":"next action","detail":null}]}', maxOutputTokens: 900 }
};

export function isGuidedTask(task: TaskId): task is GuidedTaskId {
  return task === "reply" || task === "summary" || task === "plan";
}

export function buildWorkflowMessages(request: TaskRequest) {
  if (!isGuidedTask(request.task)) throw new Error("unsupported_workflow");
  const spec = workflowSpecs[request.task];
  const context = request.clarification ? "User request:\n" + request.input + "\n\nAdditional context:\n" + request.clarification : "User request:\n" + request.input;
  return { spec, messages: [{ role: "system", content: spec.system + " Required JSON shape: " + spec.responseShape }, { role: "user", content: context }] };
}

function cleanJson(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return trimmed;
}

function nonEmpty(value: unknown, max = 12000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

export function parseWorkflowResult(task: GuidedTaskId, raw: string): WorkflowResult | null {
  let value: unknown;
  try { value = JSON.parse(cleanJson(raw)); } catch { return null; }
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (task === "reply") {
    if (v.kind !== "reply" || !nonEmpty(v.text, 6000)) return null;
    return { kind: "reply", text: v.text.trim() };
  }
  if (task === "summary") {
    if (v.kind !== "summary" || !nonEmpty(v.summary, 8000) || !Array.isArray(v.keyPoints) || !Array.isArray(v.actions)) return null;
    if (v.keyPoints.length > 20 || v.actions.length > 30) return null;
    const keyPoints = v.keyPoints.filter(item => nonEmpty(item, 2000)).map(item => (item as string).trim());
    if (keyPoints.length !== v.keyPoints.length) return null;
    const actions: SummaryAction[] = [];
    for (const item of v.actions) {
      if (!item || typeof item !== "object") return null;
      const action = item as Record<string, unknown>;
      if (!nonEmpty(action.task, 2000)) return null;
      const owner = action.owner === null ? null : nonEmpty(action.owner, 500) ? action.owner.trim() : null;
      const deadline = action.deadline === null ? null : nonEmpty(action.deadline, 500) ? action.deadline.trim() : null;
      actions.push({ task: action.task.trim(), owner, deadline });
    }
    return { kind: "summary", summary: v.summary.trim(), keyPoints, actions };
  }
  if (v.kind !== "plan" || !nonEmpty(v.goal, 4000) || !Array.isArray(v.steps) || v.steps.length === 0 || v.steps.length > 30) return null;
  const steps: PlanStep[] = [];
  for (const item of v.steps) {
    if (!item || typeof item !== "object") return null;
    const step = item as Record<string, unknown>;
    if (!nonEmpty(step.step, 2000)) return null;
    const detail = step.detail === null ? null : nonEmpty(step.detail, 3000) ? step.detail.trim() : null;
    steps.push({ step: step.step.trim(), detail });
  }
  return { kind: "plan", goal: v.goal.trim(), steps };
}

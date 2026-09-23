export const MAX_INPUT = 12000;
export const MAX_ANSWER = 2000;
export const tasks = [
  { id: "reply", title: "Reply to a customer", description: "Turn a rough message into a clear, professional reply.", preview: "A reply you can review and send", example: "A customer has not replied to our proposal for a week. Help me follow up without sounding pushy.", question: "What did the customer say, or what do you want to tell them?" },
  { id: "summary", title: "Summarize & extract actions", description: "Find the decisions and next steps in your notes.", preview: "Key points, actions, and owners", example: "Summarize these notes and list the next actions: We agreed to launch on Friday. Sam will finish the draft by Tuesday. I will review it on Wednesday.", question: "What notes or text would you like summarized? Paste them here." },
  { id: "plan", title: "Plan & organize", description: "Turn an idea into a practical, manageable plan.", preview: "A clear checklist of next steps", example: "Help me prepare for a customer meeting next Friday. I need to review their brief, prepare three options, and send an agenda.", question: "What would you like to achieve?" },
  { id: "other", title: "Something else", description: "Describe the work you need help with.", preview: "Start with your own task", example: "Help me turn a rough announcement about our new opening hours into a short, friendly message.", question: "What would you like help creating or changing?" }
] as const;

export type TaskId = typeof tasks[number]["id"];
export type TaskRequest = { version: 1; task: TaskId; input: string; clarification: string };
export type IntakeResponse =
  | { status: "clarification_required"; question: string }
  | { status: "ready"; request: TaskRequest; generationAvailable: false };

export function isTaskId(value: unknown): value is TaskId {
  return tasks.some(task => task.id === value);
}

export function parseRequest(value: unknown): TaskRequest | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || !isTaskId(v.task) || typeof v.input !== "string" || typeof v.clarification !== "string") return null;
  if (!v.input.trim() || v.input.length > MAX_INPUT || v.clarification.length > MAX_ANSWER) return null;
  return { version: 1, task: v.task, input: v.input.trim(), clarification: v.clarification.trim() };
}

// Conservative missing-context check, not semantic understanding. Specific requests
// pass through; FAN-15 may add provider-assisted clarification behind this contract.
export function essentialQuestion(request: TaskRequest): string | null {
  if (request.clarification) return null;
  const generic = /^(help( me)?|summari[sz]e( this| these notes)?|make a plan|plan|reply( to a customer)?|write a reply|帮我|总结(一下)?|做个计划|回复客户)[.!?。！？，,\s]*$/i;
  if (!generic.test(request.input)) return null;
  return tasks.find(task => task.id === request.task)!.question;
}

import { essentialQuestion, parseRequest } from "../../../lib/first-use";
import { generateWorkflow, generationConfigured } from "../../../lib/ai/provider";
import { isGuidedTask, parseWorkflowResult } from "../../../lib/ai/workflows";
import { isQuickAction } from "../../../lib/ai/result-actions";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 90000) return Response.json({ error: "That request is too long. Please shorten it." }, { status: 413, headers });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "We could not read that request." }, { status: 400, headers });
  }

  const root = body && typeof body === "object" ? body as Record<string, unknown> : null;
  const input = parseRequest(root?.request ?? body);
  if (!input || !isGuidedTask(input.task)) return Response.json({ error: "Choose one of the three guided workflows and add your context." }, { status: 400, headers });

  let transform: { action: import("../../../lib/ai/result-actions").QuickAction; currentResult: import("../../../lib/ai/workflows").WorkflowResult } | undefined;
  if (root && root.action !== undefined) {
    if (!isQuickAction(root.action) || root.currentResult === undefined) return Response.json({ error: "Invalid quick action request." }, { status: 400, headers });
    const parsedCurrent = parseWorkflowResult(input.task, JSON.stringify(root.currentResult));
    if (!parsedCurrent) return Response.json({ error: "Current result is invalid." }, { status: 400, headers });
    transform = { action: root.action, currentResult: parsedCurrent };
  }

  const question = essentialQuestion(input);
  if (question) return Response.json({ status: "clarification_required", question }, { headers });

  if (!generationConfigured()) return Response.json({ error: "Generation is not configured yet." }, { status: 503, headers });

  try {
    const generated = await generateWorkflow({ ...input, task: input.task }, transform);
    return Response.json({ status: "result", workflow: input.task, ...generated }, { headers });
  } catch {
    return Response.json({ error: "We could not create the result. Your request is safe to retry." }, { status: 502, headers });
  }
}

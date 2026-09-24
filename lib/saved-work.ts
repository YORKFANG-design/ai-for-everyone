import { parseRequest, type TaskRequest } from "./first-use";
import { isGuidedTask, parseWorkflowResult, type WorkflowResult } from "./ai/workflows";
import { getSupabase } from "./supabase";

export type SavedWork = { version: 1; id: string; request: TaskRequest; result: WorkflowResult; ownerId?: string };
const prefix = "afe:pending-save:v1:";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseWork(value: unknown): SavedWork | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const request = parseRequest(v.request);
  if (v.version !== 1 || typeof v.id !== "string" || !uuid.test(v.id) || !request || !isGuidedTask(request.task)) return null;
  const raw = JSON.stringify(v.result);
  if (!raw || raw.length > 180000 || !parseWorkflowResult(request.task, raw)) return null;
  // Validate without normalizing: preserve the user's exact edits and whitespace.
  if (v.ownerId !== undefined && (typeof v.ownerId !== "string" || !uuid.test(v.ownerId))) return null;
  return { version: 1, id: v.id, request, result: v.result as WorkflowResult, ownerId: v.ownerId as string | undefined };
}
export function stageWork(work: SavedWork) {
  if (!parseWork(work)) throw new Error("This result cannot be saved. Check for empty or oversized fields.");
  try {
    const text = JSON.stringify(work);
    localStorage.setItem(prefix + work.id, text);
    if (localStorage.getItem(prefix + work.id) !== text) throw new Error("storage");
  } catch { throw new Error("Your browser could not keep a recovery copy. Keep this page open and enable browser storage before signing in."); }
}
export function pendingWork(id: string | null): SavedWork | null {
  if (!id || !uuid.test(id)) return null;
  const raw = localStorage.getItem(prefix + id);
  return raw ? parseWork(JSON.parse(raw)) : null;
}
export async function persistWork(work: SavedWork, expectedUserId: string) {
  if (!parseWork(work)) throw new Error("Invalid saved work.");
  if (work.ownerId && work.ownerId !== expectedUserId) throw new Error("This recovery copy belongs to another account. Sign in with the original account.");
  const sb = getSupabase();
  const { data, error: authError } = await sb.auth.getUser();
  if (authError || data.user?.id !== expectedUserId) throw new Error("Your account changed. Sign in again before saving.");
  stageWork({ ...work, ownerId: expectedUserId });
  // The database enforces ownership and validates the payload again. Never use a service-role key.
  const { error } = await sb.rpc("save_workflow", { work_id: work.id, work_request: work.request, work_result: work.result });
  if (error) throw new Error("We could not save your work. Your recovery copy is still on this device. Please retry.");
  try { localStorage.removeItem(prefix + work.id); } catch { /* Successful database write is authoritative. */ }
}

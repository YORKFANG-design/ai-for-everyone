import { buildWorkflowMessages, parseWorkflowResult, type GuidedTaskId, type WorkflowResult } from "./workflows";
import type { TaskRequest } from "../first-use";

type ProviderUsage = { inputTokens: number | null; outputTokens: number | null };

export type GenerationMeta = {
  traceId: string;
  provider: "openai-compatible";
  model: string;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};

export type GenerationSuccess = { result: WorkflowResult; meta: GenerationMeta };

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("missing_env:" + name);
  return value;
}

function numericEnv(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function estimateCost(usage: ProviderUsage) {
  const inputRate = numericEnv("AI_PROVIDER_INPUT_USD_PER_1M_TOKENS");
  const outputRate = numericEnv("AI_PROVIDER_OUTPUT_USD_PER_1M_TOKENS");
  if (usage.inputTokens === null || usage.outputTokens === null || inputRate === null || outputRate === null) return null;
  return (usage.inputTokens * inputRate + usage.outputTokens * outputRate) / 1000000;
}

function getText(payload: unknown): { text: string; usage: ProviderUsage } | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const choices = root.choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return null;
  const message = (choices[0] as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as Record<string, unknown>).content;
  if (typeof content !== "string" || !content.trim()) return null;
  const rawUsage = root.usage;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  if (rawUsage && typeof rawUsage === "object") {
    const u = rawUsage as Record<string, unknown>;
    inputTokens = typeof u.prompt_tokens === "number" ? u.prompt_tokens : null;
    outputTokens = typeof u.completion_tokens === "number" ? u.completion_tokens : null;
  }
  return { text: content, usage: { inputTokens, outputTokens } };
}

export function generationConfigured() {
  return Boolean(process.env.AI_PROVIDER_API_KEY?.trim() && process.env.AI_PROVIDER_BASE_URL?.trim() && process.env.AI_PROVIDER_MODEL?.trim());
}

export async function generateWorkflow(request: TaskRequest & { task: GuidedTaskId }): Promise<GenerationSuccess> {
  const apiKey = required("AI_PROVIDER_API_KEY");
  const baseUrl = required("AI_PROVIDER_BASE_URL").replace(/\/$/, "");
  const model = required("AI_PROVIDER_MODEL");
  const { spec, messages } = buildWorkflowMessages(request);
  const traceId = crypto.randomUUID();
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: spec.maxOutputTokens, response_format: { type: "json_object" } })
    });
    if (!response.ok) throw new Error("provider_http_" + response.status);
    const parsed = getText(await response.json());
    if (!parsed) throw new Error("provider_shape");
    const result = parseWorkflowResult(request.task, parsed.text);
    if (!result) throw new Error("invalid_workflow_result");
    const meta: GenerationMeta = {
      traceId, provider: "openai-compatible", model, latencyMs: Date.now() - started,
      inputTokens: parsed.usage.inputTokens, outputTokens: parsed.usage.outputTokens, estimatedCostUsd: estimateCost(parsed.usage)
    };
    console.info(JSON.stringify({ event: "ai_generation", workflow: request.task, traceId: meta.traceId, model: meta.model, latencyMs: meta.latencyMs, inputTokens: meta.inputTokens, outputTokens: meta.outputTokens, estimatedCostUsd: meta.estimatedCostUsd, ok: true }));
    return { result, meta };
  } catch (error) {
    console.error(JSON.stringify({ event: "ai_generation", workflow: request.task, traceId, model, latencyMs: Date.now() - started, ok: false, error: error instanceof Error ? error.message : "unknown" }));
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

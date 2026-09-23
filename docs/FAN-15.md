# FAN-15 — Three guided AI workflows

## Scope

Implements the server-side generation path for:

1. Reply to a customer
2. Summarize & extract actions
3. Plan & organize

The result-screen UX and quick actions remain FAN-16. FAN-15 does not add account, billing, analytics UI, external sending, or autonomous execution.

## Contract

`POST /api/generate` accepts the versioned FAN-14 `TaskRequest`.

- Generic requests may return `{status:"clarification_required", question}`.
- Valid guided requests return `{status:"result", workflow, result, meta}`.
- `other` is not a guided MVP workflow and is rejected.
- Missing provider configuration returns 503 without inventing a result.
- Provider/shape failures return 502 and are safe to retry.

## Workflow guardrails

**Reply** returns a concise ready-to-send message and must not invent customer facts, urgency, discounts, promises, dates, or commitments.

**Summary** returns a factual summary, key points, and actions. Owner/deadline are only populated when present in source material.

**Plan** returns the stated goal and ordered next steps without inventing deadlines, budgets, people, approvals, or dependencies.

All workflows require strict JSON. Server-side parsing validates the expected shape before anything is returned to the product.

## Provider boundary

The browser never receives provider secrets. The adapter is server-side and uses an OpenAI-compatible `/chat/completions` endpoint configured with:

- `AI_PROVIDER_API_KEY`
- `AI_PROVIDER_BASE_URL`
- `AI_PROVIDER_MODEL`
- optional input/output USD-per-1M-token rates for cost estimation

No provider is hard-coded into the UI and there is no model picker.

## Observability and cost

Every generation writes one structured server log with workflow, trace ID, model, latency, input tokens, output tokens, estimated USD cost when pricing is configured, and success/failure.

The API response also returns generation metadata so the path is measurable during MVP verification.

## Acceptance boundary

The final branch must pass CI and all three workflows must pass end-to-end protocol, structure, guardrail, and cost-path verification against a controlled provider-compatible endpoint. A real-provider smoke test is still required before production launch if production provider credentials have not yet been connected.

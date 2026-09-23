# FAN-14 — First-use task picker and input flow

## Scope and sources

- [FAN-14 acceptance criteria](https://linear.app/fang-yue-ai/issue/FAN-14/build-first-use-task-picker-and-input-flow)
- [FAN-9 approved flow](https://linear.app/fang-yue-ai/issue/FAN-9/define-onboarding-and-first-use-flow)
- Base main: `3a94dafc4f889c5ea8d57208c15401803fef8959`; PR #2 confirmed merged.
- Searched existing branches and open PRs before creating the dedicated FAN-14 branch. No duplicate found.
- WIP=1. FAN-15 is not implemented or started.

## Implemented

Three primary task cards and Something else lead to an anonymous text/paste form with task-specific examples and a visibly reserved microphone (Coming soon). Draft task, input and clarification are stored locally, restored after reload, and can be cleared. Storage failures do not block use. There are no model controls, account prompts or payment gates.

Submission validates input, prevents duplicate clicks while pending, times out after 15 seconds, and retains context for retries. A conservative rule recognizes generic requests with missing context and asks one focused question. Specific requests pass through immediately. This is not semantic AI assessment; provider-assisted clarification belongs to the generation implementation.

The prepared-request screen explicitly states that result creation is unavailable. It is a handoff boundary, not a generated result or a queued background job.

## Handoff contract

`POST /api/first-use`, JSON:

```json
{"version":1,"task":"reply","input":"Follow up on last week's proposal politely.","clarification":""}
```

Task: `reply | summary | plan | other`. Input: 1–12,000 characters after nonempty validation; clarification: up to 2,000 characters. Body limited to 90,000 bytes. Responses use `Cache-Control: no-store`.

- `200 {status: "clarification_required", question: string}`: ask one question and resubmit with clarification.
- `200 {status: "ready", request: TaskRequest, generationAvailable: false}`: validated context for the next stage. No server persistence, run ID, queue, provider request or result is created.
- `400`: malformed/invalid input. `413`: oversized body.

`lib/first-use.ts` owns the versioned request and response types. A future generation adapter can consume `TaskRequest`; future result routing should only happen after generation exists. Do not mark `first_result_generated` from this endpoint.

## Verification — 2026-09-23

PASS production compilation, TypeScript checking, route generation and optimization. This Windows host restricts child-process pipes, so the successful local build used `NEXT_WORKER_THREADS=1` and `node node_modules/next/dist/bin/next build`. The opt-in config uses worker threads and the TypeScript 5.9.3 library checker. Normal deployment configuration remains the default. The lockfile records installed dependencies; no checks were disabled.

PASS 12 real HTTP cases (`node scripts/verify-first-use.cjs` with production server on 127.0.0.1:3000): four task types, four invalid bodies, clarification then resubmission, malformed JSON, oversized streamed body.

PASS real browser QA against the production build:

- Desktop 1440×1000; mobile 390×844; narrow 320×740.
- All four task choices and dynamic examples; no account needed.
- Empty submission message; text/paste entry; draft restoration after reload.
- Specific customer request submits directly; generic summary asks one question; answer reaches prepared-request screen.
- Chinese planning input preserved through an actual server outage; error displayed; retry succeeded after server restart.
- Edit, change task and clear/start-over controls; cleared draft stays cleared after reload.
- 390px document width equals viewport width (no horizontal overflow).
- No browser warning/error on successful flow. Intentional outage produced the expected failed network request.
- Found mobile card number/arrow wrapping; fixed with nonshrinking, nonwrapping label; rebuilt and visually rechecked at 320px.

Screenshot evidence is retained in the local task workspace under `docs/qa/FAN-14/` (mobile-picker.png, desktop-input.png, desktop-submitting.png). Screenshot publication was withheld by automatic approval review; images are not included in this public repository.

## Limits and review status

Voice is a labeled affordance only. Clarification rules intentionally cover explicit generic requests rather than guessing meaning. The endpoint validates and returns context; it does not generate or persist a result. Actual mobile-device keyboard behavior, provider generation, account, billing and analytics are outside FAN-14.

Implementation and local verification complete; PR review and merge remain outstanding. Do not mark Linear Done before acceptance. No new secrets, paid services or external execution permissions.

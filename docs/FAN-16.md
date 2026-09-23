# FAN-16 — Result experience & quick actions

## Scope

Turns the three FAN-15 workflow outputs into editable, ready-to-use work results.

Implemented:

- Editable result view for reply, summary/actions, and plan output
- Copy / Use this
- Shorter
- Warmer
- More professional
- Another version
- Undo last quick-action result
- Add context / edit original request without restarting
- Save workflow entry point
- Minimal result-action instrumentation without storing user content

## Context preservation

Quick actions send the original FAN-14 request plus the currently edited result. The provider receives an explicit transformation instruction and must return the same workflow schema without inventing facts.

The user can edit the generated result before using a quick action. The edited result becomes the source for that transformation, while the original task context remains attached.

## Instrumentation

`POST /api/events` currently records only whitelisted result-action events in structured server logs:

- `first_result_copied`
- `first_result_regenerated`
- `save_workflow_clicked`

No result text, prompt text, or other user content is included in these event logs. Full product analytics remains a later analytics issue.

## Save workflow boundary

FAN-16 exposes a Save workflow entry point but does not pretend persistence exists before authentication/storage work is implemented. Clicking Save is instrumented and gives an explicit next-step notice rather than silently claiming success.

## Verification

CI must pass:

- Next.js production build
- existing FAN-15 workflow generation verification
- quick-action API verification
- invalid transform rejection
- copy-event endpoint verification
- Chromium browser QA at 390px mobile and 1440px desktop
- editable result interaction
- Shorter regeneration
- Copy / Use this clipboard flow
- Save workflow entry point
- Undo last change
- mobile horizontal-overflow check

## Scope guardrail

No account system, persistent saved workflow storage, subscription prompt, full analytics stack, external sending, or autonomous execution is added here.

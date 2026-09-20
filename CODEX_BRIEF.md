# Codex development brief — AI for Everyone MVP 0.1

## Current source of truth

The current product definition is the Linear backlog, especially:
- FAN-5 through FAN-11 — product definition
- FAN-12 — technical baseline
- FAN-13 onward — MVP build

The previous “daily 3 trends + 1 skill + 1 use case” content-subscription concept is legacy and must not guide new implementation.

## Implementation baseline

Use:
- Next.js
- TypeScript
- Tailwind CSS
- Vercel
- Supabase Auth + Postgres
- Stripe
- lightweight analytics
- server-side AI provider adapter

## MVP build order

1. Repository baseline
2. Landing page
3. Task picker + input flow
4. Three guided AI workflows
5. Result experience
6. Authentication + persistence
7. Membership + checkout
8. Analytics funnel
9. AI/API cost tracking
10. End-to-end QA
11. Test deployment

## Engineering rules

- Read existing files before editing.
- Keep changes issue-scoped.
- Use a dedicated branch and PR.
- Do not commit secrets or personal data.
- Keep AI and payment keys server-side.
- Prefer the simplest production-capable architecture.
- Do not add microservices, Kubernetes, multi-agent orchestration, or custom infrastructure without explicit approval.
- Do not expose model selection to users.
- Do not enable autonomous irreversible actions.
- Any new permission, recurring cost, external tool, or irreversible action requires explicit human approval.

## PR requirements

Every PR should include:
- Linked FAN issue
- User-visible changes
- Verification steps
- Screenshots for UI changes when applicable
- Known limitations
- Whether the change introduces new permissions, recurring cost, or secrets

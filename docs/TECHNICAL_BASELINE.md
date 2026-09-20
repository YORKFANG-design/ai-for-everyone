# Technical Baseline — AI for Everyone MVP 0.1

Status: Approved baseline from FAN-12.

## Architecture

Use a production-capable monolithic web app for fast iteration.

### Web
- Next.js
- TypeScript
- Tailwind CSS

### Hosting
- Vercel
- Preview deployments for PR review
- Production deploy from approved merges to main

### Auth + persistence
Use Supabase only for:
- Auth
- Postgres
- basic user-owned data access

Minimal logical tables:
- workflow_runs
- saved_results
- ai_usage_events
- subscription_status

### Payments
Use Stripe for:
- Founding-member offer
- Checkout
- Success/cancel states
- Subscription status synchronization

Do not add annual plans, enterprise plans, lifetime deals, or token packs in MVP 0.1.

### Analytics
Use a lightweight analytics tool such as PostHog.

Core funnel:
Visitor → CTA → Task selected → Input → First result → Result used → Account → Paid → Second task

### AI layer
Use a server-side provider adapter.

The browser must never receive provider secrets.

Initial adapter inputs:
- workflow type
- user input
- optional context

Initial adapter outputs:
- clarification if needed
- generated result
- latency metadata
- usage metadata
- estimated cost

Do not expose model selection to the user.

## Environment variables

Use `.env.local` for local secrets and deployment environment variables in production.

`.env.example` must contain names only.

Expected categories:
- app URL
- Supabase
- AI provider
- Stripe
- analytics
- optional error monitoring

## Security baseline

- Keep AI/payment secrets server-side.
- Do not store unnecessary sensitive user content.
- Authenticated users may access only their own saved data.
- MVP operates primarily in Draft + Suggest mode.
- External execution actions require explicit confirmation.

## Scope guardrail

A new feature belongs in MVP only if it materially improves:
1. user understanding
2. first-value completion
3. result usefulness
4. payment conversion
5. repeat use
6. cost efficiency

# AI for Everyone · MVP 0.1

AI for Everyone is a guided, outcome-oriented AI work assistant for non-technical solo professionals and small-business operators.

## Product promise

**Tell AI what you need. Get the work done — without learning prompts, switching tools, or becoming an AI expert.**

The MVP is designed to validate whether users will repeatedly use and pay for a simpler way to complete recurring work with AI.

## MVP 0.1 scope

The first release focuses on:
- 3 guided workflows:
  1. Reply to a customer
  2. Summarize & extract actions
  3. Plan & organize
- Natural-language input
- Ready-to-use AI results
- Quick actions such as shorter / warmer / more professional
- First value before registration
- Lightweight authentication
- Founding-member checkout
- Funnel analytics
- AI/API cost tracking

## Product principles

- Value before registration
- Value before payment
- Guidance before complexity
- Draft + Suggest before autonomous execution
- Human approval for important or irreversible actions
- No model-picker UI
- No “unlimited AI” promise
- No multi-agent platform in MVP 0.1

## Technical baseline

Recommended MVP stack:
- Next.js
- TypeScript
- Tailwind CSS
- Vercel
- Supabase Auth + Postgres
- Stripe
- Lightweight product analytics
- Server-side provider-agnostic AI adapter

See [docs/TECHNICAL_BASELINE.md](docs/TECHNICAL_BASELINE.md).

## Development workflow

Linear Issue → dedicated branch → Codex implementation → PR → preview verification → human approval → merge.

Do not commit real secrets. Use environment variables and keep only variable names in `.env.example`.

## Legacy docs

The original content-subscription concept from 2026-09-17 is retained for historical context only. Files marked **LEGACY** are no longer the source of truth for product development.

Current product requirements are tracked in Linear under FAN-5 through FAN-22.

## Implementation records

- [FAN-14: first-use flow, handoff contract and QA](docs/FAN-14.md)
- [FAN-15: guided AI workflows, provider contract and verification](docs/FAN-15.md)
- [FAN-16: editable result experience, quick actions and QA](docs/FAN-16.md)

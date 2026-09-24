# FAN-17 — Authentication and persistence

Issue: https://linear.app/fang-yue-ai/issue/FAN-17/add-lightweight-authentication-and-persistence

## Behavior

Anonymous users still generate and edit any of the three workflows before registration. Save creates a versioned recovery snapshot with a stable UUID before offering Google or Email magic-link authentication. Supabase PKCE returns to `/auth/callback`, verifies an Email token hash once (or exchanges a Google OAuth code once), verifies the user, and saves the original request and exact edited result in one database operation. Failed writes retain the recovery copy and can be retried without consuming the sign-in code again. Repeated saves update the same record. Explicit callback identifiers keep pending saves from different tabs separate.

`/work` lists the current user's latest 50 saved workflows in most-recently-updated order. Opening one restores its request, clarification and edited result at `/start`; the existing edit and quick-action controls remain available. Recent Work is explicitly saved history, not automatic collection of every anonymous generation. `auth.users` provides the basic user record; no redundant profile table or service-role access is needed.

Only the configured public Supabase URL and publishable key are used in the browser. The `save_workflow` function runs with the authenticated caller's privileges and derives ownership from `auth.uid()`. Row-level policies reject anonymous access, cross-user reads/writes and ownership changes. A primary key gives idempotency. Deleting the auth user cascades to saved workflows. Auth state changes clear visible account data; stale history responses are discarded. Saved account requests are not copied into the anonymous draft slot.

## Configuration

1. Create a Supabase project and apply `supabase/migrations/202609240001_fan17.sql` in its SQL Editor. Apply it once to an empty project; do not drop existing data to rerun it.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and the deployment environment. Use the Dashboard Publishable key (`sb_publishable_...`). No service-role or secret key is needed for this feature. Rebuild after changing public environment variables.
3. Authentication → URL Configuration: set the app Site URL and allow the app's `/auth/callback` including its `?save=<uuid>` query. Use the narrow pattern `https://YOUR-APP-HOST/auth/callback**` for each trusted app origin; add the corresponding localhost origin for development. Never allow arbitrary external hosts.
4. Enable Email and keep the default Confirm signup and Magic Link templates (ConfirmationURL). No custom SMTP or template changes are required for the current test account. Supabase verifies the emailed token and redirects to the supplied callback with its save identifier. The callback accepts a PKCE code or complete implicit session fragment, verifies the user remotely, then persists pending work. Optional token_hash/type=email callbacks are also supported but not required. Open a fresh email link directly in the initiating browser; do not paste it into a search engine. Expired/error callbacks keep pending work.
5. Enable Google. Create a Web application OAuth client in Google Cloud / Google Auth Platform, add the app origins, and use the Supabase provider panel's `https://PROJECT.supabase.co/auth/v1/callback` as Google's authorized redirect URI. Store Google's client secret only in the Supabase Google provider settings. Add test users while the Google app is in testing.
6. Configure custom SMTP for email to non-team recipients. Supabase's default mail service is restricted and rate-limited; successful mocked requests do not establish email deliverability.

Official references: [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [redirects](https://supabase.com/docs/guides/auth/redirect-urls), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [API keys](https://supabase.com/docs/guides/api/api-keys).

## Verification — 2026-09-24

Passed locally:
- Production build, TypeScript and static route generation (`NEXT_WORKER_THREADS=1` is the existing restricted-Windows option).
- `node scripts/verify-first-use.cjs`: 12 real HTTP cases.
- `node scripts/verify-save-recovery.cjs`: exact edited-result recovery, invalid result rejection, full browser-storage failure, expired/wrong account denial, failed-write retention and ownership binding, and successful retry cleanup against the real recovery module with a substituted remote client.
- `node scripts/verify-persistence.cjs`: actual migration executed by PostgreSQL/WASM (PGlite), anonymous denial, owner save/update, exact result preservation, idempotency, two-user isolation, ownership-transfer rejection, malformed/null/oversized request rejection, three workflow result shapes and deletion cascade. Only the Supabase auth schema/roles/claims are emulated.

Passed in GitHub CI (run 35954009307 on commit 2dbe867; not run locally):
- `node scripts/verify-fan17-browser.cjs`: desktop Google and mobile Email journeys with mocked auth/provider endpoints, snapshot reload, save failure/retry, return/reuse/update, sign-out and cancelled callback. The test uses the real Supabase SDK; it does not verify live OAuth or email delivery. Requires a build with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test_only`, then `npm start` on port 3000 and Playwright Chromium. `FAN17_CDP` optionally connects to a dedicated test browser.
- Existing FAN-16 browser regression adjusted for the now-implemented sign-in boundary.

Local Windows browser process creation failed with access-denied; the app's browser connector was also unavailable. CI now runs the database and browser tests using the committed dependency lock. The initial PR CI passed all steps: https://github.com/YORKFANG-design/ai-for-everyone/actions/runs/35954009307. Follow-up configuration changes require a fresh CI run.

## Done gates

Not Done. Live public client configuration and hosted migration exist; anonymous table and RPC access correctly return permission denied. Email token-hash callback support is added after a failed live Email acceptance attempt. A fresh live default-template email-to-save journey remains required. Google is not yet enabled. Required before closure: successful browser CI; configured hosted migration and redirect allowlist; actual Google and Email signup/login; exact pre-login result recovery; return in a new session; two real accounts unable to access each other's saved work; desktop/mobile review; human PR approval and merge under the repository workflow. Real AI-provider smoke testing remains the launch gate documented by FAN-15.

No secrets, screenshot uploads, billing, subscription or analytics expansion. No external account configuration has been changed. This change adds one production dependency (`@supabase/supabase-js`) and one development-only database test dependency (`@electric-sql/pglite`).

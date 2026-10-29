# Spec: email OTP is the only sign-in

Status: in progress on `feat/email-otp-auth`. Approved by Faiz on 2026-10-27.

## Goal

A Member signs in or signs up the same way: enter an email, then enter the 6-digit code sent to that inbox.
A new account claims a username once, then lands on the page it came from.
Email + password, Google and GitHub sign-in are removed.

## Behaviour

1. `/user/auth` shows one email field. Submit sends a sign-in OTP.
2. The OTP step shows 6 boxes (shadcn `input-otp`), a resend button with a 60s cooldown, and "use a different email".
3. A correct code creates a session. Existing users keep their user id, profile and username.
4. A user whose `users.username_claimed_at` is null has not claimed a username yet. Every page redirects to `/user/onboarding?redirectTo=...` until the username is claimed.
5. Onboarding asks for a username only. It checks availability live and saves it. Then it redirects to `redirectTo` (safe path) or `/`.

## Rules

| Rule                      | Value                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| OTP length                | 6 digits                                                                                             |
| OTP expiry                | 10 minutes                                                                                           |
| Wrong attempts per code   | 5, then the code is dead                                                                             |
| Resend cooldown           | 60s per email                                                                                        |
| Send limit                | 5 per email per hour, 20 per IP per hour                                                             |
| Verify limit              | 30 per IP per 10 minutes                                                                             |
| OTP storage               | hashed (`storeOTP: "hashed"`)                                                                        |
| Username                  | `^[a-z0-9_]{3,30}$`, lowercased, not in `lib/reserved-profile-slugs.ts`                              |
| New account email domains | gmail.com, googlemail.com, yahoo.com, yahoo.co.id, outlook.com, outlook.co.id, hotmail.com, live.com |

- The domain allowlist applies to new accounts only. An existing user with any domain can still sign in.
- `NEW_ACCOUNT_ALLOWED_EMAILS` (wrangler var, comma-separated) lets exact addresses sign up outside the domain list. It never opens a whole domain.
- Existing usernames that break the new rule stay. The rule applies when a username is claimed or changed.
- The OTP email language follows the `NEXT_LOCALE` cookie (`id` or `en`), default `id`. It is sent with the existing Resend `sendAuthEmail`.
- In production, sending an OTP fails with HTTP 503 when `RESEND_API_KEY` or `EMAIL_FROM` is missing, instead of pretending to send.

## Design

- Better Auth 1.6.20 `emailOTP` plugin. Verified in `node_modules/better-auth/dist/plugins/email-otp`:
  - `sign-in/email-otp` finds the user by lowercased email. If none and `disableSignUp` is false, it creates the user with `emailVerified: true`. If the user exists but is unverified, it sets `emailVerified: true`.
  - Wrong codes bump an attempt counter stored as `<otp>:<n>` in `verification`. At `allowedAttempts` it returns `TOO_MANY_ATTEMPTS`.
  - `sendVerificationOTP` runs through `runInBackgroundOrAwait`, so errors are logged and swallowed. That is why the config check happens in a before hook.
  - Built-in plugin rate limit is per IP in Worker memory. Our limits use `rate_limit_buckets` in Neon (memory fallback when the table is missing).
- `users.username_claimed_at timestamptz`. Migration `09_email_otp_onboarding.sql` adds it and backfills existing rows to `joined_at` only on the run that adds the column, so re-runs never mark new accounts as claimed.
- The profile trigger gives a new account with an empty name a temporary username `u_<10 hex>` and the same display name, so the email local part never shows on a public page.
- The onboarding gate is a pure function in `lib/auth/onboarding-gate.ts`, called from `applyAuthMiddleware`. Exempt: `/user/auth`, `/user/onboarding`, `/api/*`, `/_serverFn/*`, `/terms-of-service`, `/privacy-policy`, non-GET requests.
- `/user/auth/confirm-email` and `/user/auth/reset-password` redirect to `/user/auth`.
- UI: `components/auth/{auth-card,email-step,otp-step,username-claim}.tsx` are view only. State lives in `hooks/use-email-otp-flow.ts` and `hooks/use-username-claim.ts`.

## Legacy account rows

`scripts/cleanup-legacy-auth-accounts.ts` deletes `account` rows with `provider_id` in (credential, google, github). Dry-run is the default and prints counts only. `--apply` also needs `CONFIRM_DATABASE_HOST` equal to the target host. It is idempotent. Run it only after the OTP release is live.

## Rollout

1. Set env vars: `RESEND_API_KEY`, `EMAIL_FROM` (verified Resend domain), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `VITE_BETTER_AUTH_URL`.
2. Apply migration 09 before deploying the code. The new Drizzle column is selected by profile queries. 09 only adds a nullable column and backfills it, so the old app keeps working.
3. Deploy, then apply migration 10 (temporary `u_…` username for new accounts). The old signup form sends the chosen username as `name`, so 10 waits until the old form is gone. Smoke sign-in with an existing account and a new Gmail account.
4. Remove `GOOGLE_*` and `GITHUB_CLIENT_*` secrets from Cloudflare.
5. Run the cleanup script dry-run, then `--apply`.

## Out of scope (follow-ups)

- Supabase leftovers: `VITE_SUPABASE_*` in `vite-env.d.ts`, `scripts/test-db-connection.ts`, `scripts/test-supabase-connection.ts`, comments in a few routes, and 15 avatars hosted on Supabase storage.
- UI polish by the design bot on this branch.

## Tickets

- [x] T1 Verify Better Auth emailOTP API in the installed package
- [x] T2 Investigate why prod `session` has 0 rows (read-only)
- [x] T3 OTP config and email domain modules with tests
- [x] T4 OTP email template (ID/EN) and locale resolver with tests
- [x] T5 OTP send and verify rate limits on `rate_limit_buckets` with tests
- [x] T6 Better Auth server config: emailOTP only, drop password, OAuth, email links
- [x] T7 Migrations 09 (`username_claimed_at`, backfill) and 10 (trigger temp username)
- [x] T8 Username validation module with tests
- [x] T9 Onboarding gate pure function with tests, wired into middleware; drop unverified-user branch
- [x] T10 Username claim and availability server functions
- [x] T11 UI: auth page (EmailStep, OtpStep), onboarding page (UsernameClaim), input-otp, i18n keys
- [x] T12 Remove confirm-email and reset-password pages, add redirects, drop remember-me
- [x] T13 Remove GOOGLE*/GITHUB* OAuth env usage from runtime secrets, wrangler sync, .env.example, docs
- [x] T14 Legacy account cleanup script (dry-run default, idempotent) with tests
- [x] T15 README, lint, typecheck, tests, local smoke with console email (UI smoke only: no dev database was available, so the send and verify round trip against a real DB is still to do)

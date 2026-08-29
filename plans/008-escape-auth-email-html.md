# 008 — Escape auth email HTML

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Security
- **Rule**: react-doctor/dangerous-html-sink
- **Estimated scope**: 2 files, small

## Problem

`lib/auth/server.ts:86` and `:107` interpolate `user.name` (and `url`) into HTML email. Signup sets `name` from the raw username (`lib/auth/credentials.ts:173`). OAuth can set a display name. `sanitizeUsername` in `lib/auth/profile.ts:14` only cleans the profile slug, not `user.name`.

    // lib/auth/server.ts:80 — current
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        ...
        html: `
          <p>Hi ${user.name || "there"},</p>
          <p>Click the link below to reset your VibeDev ID password.</p>
          <p><a href="${url}">Reset password</a></p>
          ...
        `,
      });
    },

Same pattern in `sendVerificationEmail` at line 101.

Canonical recipe: when HTML is unavoidable, sanitize at the trust boundary. Never pass user or request data straight into an HTML sink. Prefer escaped text. This is email HTML, not JSX, but the same sink rule applies.

There is no `escapeHtml` helper in the repo. `app/routes/sitemap[.]xml.ts:25` has `escapeXml` as the closest exemplar.

## Target

Add `escapeHtml` next to auth helpers (prefer `lib/auth/html.ts` so `server.ts` stays focused). Escape name and URL on both email paths.

    // target — lib/auth/html.ts
    export function escapeHtml(value: string): string {
      return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    // target — both html templates
    const safeName = escapeHtml(user.name || "there");
    const safeUrl = escapeHtml(url);
    html: `
      <p>Hi ${safeName},</p>
      ...
      <p><a href="${safeUrl}">Reset password</a></p>
    `

Keep the plain-text `text:` bodies as they are (no HTML).

## Repo conventions to follow

- Imitate `escapeXml` in `app/routes/sitemap[.]xml.ts:25` (five-entity replace, no new dependency).
- Imitate `getSafeRedirectPath` in `lib/auth/credentials.ts:31` (small exported helper, no framework).
- Add `tests/unit/lib/auth-html.spec.ts` in the style of `tests/unit/lib/reserved-profile-slugs.spec.ts`.

## Steps

1. Create `lib/auth/html.ts` with `escapeHtml`.
2. Use it in both HTML strings in `lib/auth/server.ts`.
3. Add a unit test that `"<img src=x>"` becomes escaped text.

## Boundaries

- Do NOT change Better Auth config besides the two HTML strings.
- Do NOT add DOMPurify to emails.
- Do NOT add dependencies.
- STOP if `sendAuthEmail` call sites have drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `vp test` focused on the new spec.
  - `npx react-doctor@latest --scope changed` — score does not drop.
  - `vp check`.
- **Behavior check**: Do not send live mail in CI. Confirm the unit test covers `<`, `>`, `&`, and quotes. If you send one local reset email, confirm the greeting shows the name as text, not markup.
- **Done when**: both HTML paths escape name and URL, and the test pins the helper.

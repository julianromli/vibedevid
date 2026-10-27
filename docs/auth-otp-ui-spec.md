# Email OTP auth: UI spec

Repo `julianromli/vibedevid`, branch `feat/email-otp-auth`. Route `/user/auth`.
Mockups and email previews were made outside the repo and are not committed. The email template lives in `lib/auth/otp-email-template.ts`; copy in `lib/auth/otp-email.ts`.

Implementation notes (resolved open questions): send-OTP returns `sentAt` (ISO); on `OTP_RESEND_COOLDOWN`, `retryAfterSeconds` is the time left; availability returns `{ available, reason?, suggestions? }`; the UI counts attempts left itself; reserved usernames live in `RESERVED_USERNAMES` (`lib/reserved-profile-slugs.ts`).

Flow: **Email → Code** on `/user/auth`, then **Username** on `/user/onboarding` (accounts with `username_claimed_at` null), then `redirectTo` or `/`.
This spec matches Matt's `docs/specs/email-otp-auth.md` and the uncommitted backend in the shared repo (see section 10).
Sign in and sign up share one form. Password, Google, GitHub and the pill toggle are removed.

---

## 1. Shared shell

Keep the current page shell: `bg-grid-pattern`, overlay gradient, centered card.

| Part             | Value                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page             | `min-h-dvh grid place-items-center px-4 py-8`                                                                                                                                                                                                    |
| Card             | `w-full max-w-[400px] rounded-3xl border bg-background/80 backdrop-blur-xl p-6 sm:p-8`. Drop `shadow-2xl`.                                                                                                                                       |
| Top bar          | `flex items-center justify-between -mx-2 -mt-2 mb-4`. Icon buttons `Button variant="ghost" size="icon" className="size-11 rounded-full"` (44px). Left: Back (code step only). Right: `ThemeToggle`, Close (`X`, goes to `/`).                    |
| Logo             | `V` mark, 28px wide, `mb-5`. Email and username steps.                                                                                                                                                                                           |
| H1               | `text-2xl font-semibold tracking-[-0.035em] leading-8`. One H1 per step. Gets focus on step change (`tabIndex={-1}`, `outline-none`) only if no input autofocuses.                                                                               |
| Sub              | `mt-2 text-sm leading-[22px] text-muted-foreground`.                                                                                                                                                                                             |
| Form gap         | `mt-6 space-y-4`. Label to input `space-y-2`.                                                                                                                                                                                                    |
| Label            | shadcn `Label`, `text-sm font-medium`. Always visible. No placeholder-only fields.                                                                                                                                                               |
| Input            | shadcn `Input` + `h-12 rounded-xl bg-muted/30 text-base` (16px stops iOS zoom). Focus keeps the token ring: `ring-2 ring-primary ring-offset-2 ring-offset-background`. Invalid: `aria-invalid` → `border-destructive`, ring `ring-destructive`. |
| Primary button   | shadcn `Button` + `h-12 w-full rounded-xl text-base font-medium`. `active:scale-[0.97]` (transform 160ms ease-out).                                                                                                                              |
| Field message    | `mt-2 flex gap-2 text-sm leading-5`. Error: `text-destructive` + `CircleAlert` 16px. Success: `text-foreground` + `Check` 16px `text-primary`. Hint: `text-muted-foreground`.                                                                    |
| Alert (blocking) | shadcn `Alert variant="destructive"` restyled: `rounded-xl border-destructive/40 bg-destructive/10`. Title `text-sm font-medium`, body `text-sm text-muted-foreground`.                                                                          |
| Footer           | `mt-6 text-center text-xs text-muted-foreground`, link `underline underline-offset-2`.                                                                                                                                                           |

**Buttons are never `disabled` except while loading.** A disabled gold button turns muddy olive and reads like "loading". If the input is not ready, pressing the button shows the field error and focuses the field.

Loading state: `aria-busy="true"`, `disabled`, `Loader2 size-4 animate-spin` + loading label, `opacity-70`. Width does not change (`w-full`).

Tokens only. No `red-500`, `green-700`, `zinc-*`. There is no success token. Use `text-primary` for the check icon and `text-foreground` for the success text. Gold text on dark bg passes; gold text on white does not, so in light mode the check icon uses `text-foreground`.

---

## 2. Step 1: Email

**Layout:** logo → H1 → sub → `Label` "Email" → `Input` → primary button → footer (terms).

| Attr                            | Value                  |
| ------------------------------- | ---------------------- |
| `type`                          | `email`                |
| `autoComplete`                  | `email`                |
| `inputMode`                     | `email`                |
| `autoCapitalize` / `spellCheck` | `none` / `false`       |
| `enterKeyHint`                  | `send`                 |
| `name` / `id`                   | `email`                |
| `aria-describedby`              | id of the message line |

No autofocus on page load (mobile keyboard would cover the page). Desktop autofocus is fine (`matchMedia('(pointer:fine)')`).

**Validation:** trim + lowercase on submit. Client checks format only. **No client domain check**: the allowlist applies to new accounts only (`newAccountEmailError`), and an existing user with any domain can still sign in, which only the server knows. Validate on submit, then live on each change once an error has shown. Never validate while the user is still typing for the first time.

Allowed domains for new accounts (`lib/auth/email-domain.ts`): gmail.com, googlemail.com, yahoo.com, yahoo.co.id, outlook.com, outlook.co.id, hotmail.com, live.com.

| State                                        | UI                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Idle                                         | as above                                                                                           |
| Invalid format                               | field error `auth.errors.emailFormat`                                                              |
| Domain rejected (`EMAIL_DOMAIN_NOT_ALLOWED`) | field error `auth.errors.emailDomain` with `{{domain}}` from the response                          |
| Sending                                      | button loading `auth.email.sending`, input `readOnly` (not disabled, keeps value + focus style)    |
| Cooldown (`OTP_RESEND_COOLDOWN`)             | the code was already sent: go to step 2 with the cooldown running, message `auth.code.alreadySent` |
| Hourly cap (`OTP_SEND_LIMIT`)                | field error `auth.errors.sendLimit`                                                                |
| Email off (`EMAIL_NOT_CONFIGURED`, 503)      | field error `auth.errors.generic`                                                                  |
| Network error                                | field error `auth.errors.network`, button label back to `auth.email.submit`                        |
| Generic error                                | field error `auth.errors.generic`                                                                  |
| Success                                      | go to step 2                                                                                       |

---

## 3. Step 2: Code

**Layout:** top bar with Back → H1 → sub (with email in `font-medium text-foreground`) → OTP field → primary button → resend row.

**Component:** shadcn `InputOTP` (input-otp lib), `maxLength={6}`, `pattern={REGEXP_ONLY_DIGITS}`.

- `InputOTPGroup` ×2 (3 slots each) with `InputOTPSeparator` (a 8px × 2px muted dash).
- Slots: `h-14 w-12` desktop, `h-13 w-11` under 400px. `text-2xl font-medium tabular-nums`. First/last slot of a group `rounded-l-xl` / `rounded-r-xl`.
- Active slot: `ring-2 ring-primary` + blinking caret (caret blink is the lib default; disable under reduced motion).
- Hidden input props: `autoComplete="one-time-code"`, `inputMode="numeric"`, `name="code"`, `aria-label={t('auth.code.label')}`, `aria-describedby` → message id.
- Visible label: H1 doubles as label is not enough. Add `<Label className="sr-only">` with `auth.code.label`.

**Keyboard / input**

- Autofocus on mount (keyboard is already open from step 1).
- Paste anywhere in the field: strip non-digits, take first 6, fill all slots (lib handles; add `pasteTransformer={(t) => t.replace(/\D/g,'')}` so "482 917" or "482-917" works).
- SMS/email autofill (iOS "From Mail") fills via `one-time-code`.
- Backspace on an empty slot moves to the previous slot and clears it (lib default).
- Arrow keys move between slots. Enter submits.
- **Auto-submit** on the 6th digit (`onComplete`). Guard: no double submit while a request is in flight. If auto-submit fails, the user can still press the button.

| State                                   | UI                                                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Idle                                    | empty slots, slot 1 active                                                                                                                                                                                         |
| Partial + submit pressed                | field error `auth.errors.codeIncomplete`, focus first empty slot                                                                                                                                                   |
| Verifying                               | button loading `auth.code.verifying`, field `disabled` (input-otp has no readOnly)                                                                                                                                 |
| Wrong code (`INVALID_OTP`)              | clear all 6 slots, focus slot 1, slots `border-destructive`, active ring `ring-destructive` until the next keystroke. Field error `auth.errors.codeWrong` with `{{count}}` attempts left (plural). Optional shake. |
| Last attempt                            | `auth.errors.codeWrong_one` ("Sisa 1 percobaan.")                                                                                                                                                                  |
| Verify cap (`OTP_VERIFY_LIMIT`, per IP) | keep code, field error `auth.errors.verifyLimit`                                                                                                                                                                   |
| Too many attempts (`TOO_MANY_ATTEMPTS`) | slots disabled, Alert `auth.errors.codeLockedTitle` / `codeLockedBody`. Button label → `auth.code.newCode`, which calls resend. Resend row hidden.                                                                 |
| Expired (`OTP_EXPIRED`)                 | slots disabled, Alert `auth.errors.codeExpiredTitle` / `codeExpiredBody`. Button → `auth.code.newCode`. Resend row hidden.                                                                                         |
| Network error                           | **keep the typed code**, field error `auth.errors.network`, button label `auth.common.retry`                                                                                                                       |
| Generic error                           | keep code, field error `auth.errors.generic`                                                                                                                                                                       |
| New code sent                           | toast-free: message line `auth.code.resent` (polite), slots cleared, focus slot 1                                                                                                                                  |

**Expiry:** static line in the sub ("Kode berlaku 10 menit."). No visible countdown for expiry; it adds pressure for no gain. If the server says expired, show the expired state.

**Resend row:** `mt-4 text-center text-sm text-muted-foreground`. "Belum dapat kode?" + link button (`Button variant="link"`, `min-h-11 px-1 font-medium text-foreground`).

- Cooldown: button `disabled`, label `auth.code.resendIn` with `{{time}}` as `m:ss`, `tabular-nums` so the width does not jump.
- Time is computed from a stored `sentAt` timestamp (`sentAt + OTP_CONFIG.resendCooldownSeconds`), not a decrementing counter, so refresh and tab sleep stay correct. Tick with `setInterval(1000)` and recompute from `Date.now()`. The server does not return a timestamp today (open question). On `OTP_RESEND_COOLDOWN`, `retryAfterSeconds` is the full window, not the time left.
- Resend hits the hourly cap (`OTP_SEND_LIMIT`): message `auth.errors.sendLimit`, resend button hidden.
- Resending: label `auth.code.resending` with spinner.
- Ready: label `auth.code.resend`.

**aria-live**

- Field message: `role="alert"` for errors (assertive), `aria-live="polite"` for info.
- Cooldown: a separate `sr-only` `aria-live="polite"` region that speaks **only** at start ("Kirim ulang tersedia dalam 60 detik.") and at the end ("Kamu bisa kirim ulang kode sekarang."). The visible ticking label sits outside any live region, so it is not read every second.

**Back / change email:** top-bar Back (`aria-label` `auth.code.changeEmail`) + the email in the sub is not a link. Back returns to step 1 with the email prefilled, focus on the input, caret at end. The pending code stays valid on the server; if the user submits the same email again within the cooldown, show the cooldown error instead of sending.

---

## 4. Step 3: Username (`/user/onboarding`)

Blocking. No Back, no Close. Only a "Keluar" (sign out) text button under the primary button (`Button variant="link" min-h-11 text-sm text-muted-foreground`). The onboarding gate (`resolveOnboardingRedirect`) sends every GET page here while `username_claimed_at` is null, so refresh and direct links land here until done. Same card shell as `/user/auth` (reuse `components/auth/auth-card.tsx`).

**Layout:** logo → H1 → sub → `Label` "Username" → input group → message line → optional suggestion chips → primary button → "Keluar".

**Input group:** relative wrapper. `@` prefix `absolute left-4 text-muted-foreground` (`aria-hidden`), input `pl-9 pr-11`, status icon `absolute right-4` (spinner / check / nothing). The input itself:

| Attr                         | Value           |
| ---------------------------- | --------------- |
| `autoComplete`               | `username`      |
| `autoCapitalize`             | `none`          |
| `autoCorrect` / `spellCheck` | `off` / `false` |
| `inputMode`                  | `text`          |
| `maxLength`                  | `30`            |
| `enterKeyHint`               | `done`          |
| `name`                       | `username`      |

**Prefill:** `suggestUsername(email)` from `lib/username.ts`. Never prefill the temporary `u_<hex>` name from the profile trigger. Caret at end. Autofocus on mount (the user arrives from the code step with the keyboard open).

**Rules: `validateUsername` in `lib/username.ts`, shared by this screen, the server and `profile-edit-dialog`.** Error map: `too_short`/`too_long` → `usernameLength`, `invalid_chars` → `usernameFormat`, `reserved` → `usernameReserved`, `required` → `usernameLength`.

- `^[a-z0-9_]{3,30}$`
- Typed uppercase is lowercased as you type (preserve caret). Other characters are **not** silently removed; they show the format error so the user knows why.
- Reserved words: checked on the client from a shared list, no network call.
- Availability: debounced 400ms after the last keystroke, only when format + reserved pass. Abort the previous request (`AbortController`). Ignore stale responses (compare value).
- Re-check on submit (race with other users). Server is the source of truth.

**Message line** (one line, `aria-live="polite"`, errors also `role="alert"`):

| State                      | Icon                                                    | Text                                                                                   |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Idle / untouched           | none                                                    | `auth.username.hint`                                                                   |
| Too short / too long       | alert                                                   | `auth.errors.usernameLength`                                                           |
| Invalid characters         | alert                                                   | `auth.errors.usernameFormat`                                                           |
| Reserved                   | alert                                                   | `auth.errors.usernameReserved` with `{{username}}`                                     |
| Checking                   | spinner (suffix)                                        | `auth.username.checking`                                                               |
| Available                  | check (suffix + line)                                   | `auth.username.available` with `{{url}}` = `vibedeveloper.id/{{username}}`             |
| Taken                      | alert                                                   | `auth.errors.usernameTaken` with `{{username}}` + chips if the API returns suggestions |
| Check failed (network)     | alert                                                   | `auth.errors.usernameCheckFailed`. Submit still allowed; server decides.               |
| Saving                     | button loading `auth.username.saving`, input `readOnly` |
| Save failed: taken in race | back to Taken state, focus input                        |
| Save failed: other         | `auth.errors.generic`                                   |

When to show format errors: on blur, on submit, or after 400ms idle once the user has typed something different from the prefill. Once shown, update live.

**Suggestion chips:** "Saran:" + up to 3 `Button variant="outline" size="sm"` `h-9 rounded-full`, with a pseudo-element hit area expanding to 44px (`relative after:absolute after:-inset-1`). Tap fills the input and triggers a check.

**Submit:** pressing with a non-available state focuses the input and keeps the message. On success: navigate with `replace: true` to `getSafeRedirectPath(redirectTo)` (falls back to `/`).

---

## 5. Motion

All transform/opacity only. Easing `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out).

| What                        | Spec                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Step enter                  | opacity 0→1, `translateY(8px)`→0, 200ms                                                     |
| Step exit                   | opacity 1→0, 120ms, no movement. No height animation on the card.                           |
| Field message appear        | opacity + `translateY(-2px)`→0, 150ms                                                       |
| Button press                | `scale(0.97)`, 160ms ease-out                                                               |
| Wrong code shake (optional) | `translateX` 0 → -4 → 4 → -2 → 0px, 240ms, once                                             |
| Spinner                     | `animate-spin`, kept under reduced motion (it is status, not decoration) but slowed is fine |
| Countdown                   | no animation, digits just change (tabular-nums)                                             |

`prefers-reduced-motion: reduce`: step change = opacity only (150ms), no shake, no translate, OTP caret does not blink.

---

## 6. Focus summary

| Event                   | Focus goes to                            |
| ----------------------- | ---------------------------------------- |
| Page load, step 1       | email input on desktop, nothing on touch |
| Step 1 → 2              | OTP slot 1                               |
| Wrong code              | OTP slot 1 (code cleared)                |
| Network error on verify | stays on OTP (code kept)                 |
| Locked / expired        | primary button ("Kirim kode baru")       |
| New code sent           | OTP slot 1                               |
| Back to step 1          | email input, caret at end                |
| Step 2 → 3              | username input                           |
| Submit with error       | the invalid input                        |

---

## 7. Refresh, back, deep links

- Pending login is kept in `sessionStorage` key `vd-otp-pending`: `{ email, sentAt, wrongAttempts }`. `expiresAt = sentAt + 600s`. `wrongAttempts` resets on every new code. Not in the URL (email is PII and would land in logs and history).
- Step 2 URL: `/user/auth?step=code` (pushed with history, so browser Back returns to step 1). `redirectTo` is kept as is.
- Refresh on step 2: read storage. If missing or `expiresAt` passed → step 1 with email prefilled if known, message `auth.errors.codeExpiredBody`.
- Refresh on step 3: the onboarding gate keeps the user on `/user/onboarding`. Storage is not used.
- Signed-in, claimed user opening `/user/auth` → redirect to `redirectTo` or `/`.
- Clear `vd-otp-pending` on verify success and on "Keluar".

---

## 8. Copy table

i18next default interpolation `{{var}}`. Plurals use i18next `_one` / `_other`. Namespace `auth`.
ID uses "kamu", casual but clear. EN is plain and short.

| Key                                 | ID                                                                             | EN                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `auth.email.title`                  | Masuk ke VibeDev ID                                                            | Sign in to VibeDev ID                                                       |
| `auth.email.subtitle`               | Belum punya akun? Langsung dibuatkan. Kami kirim kode 6 digit ke email kamu.   | No account yet? We'll make one. We'll send a 6-digit code to your email.    |
| `auth.email.label`                  | Email                                                                          | Email                                                                       |
| `auth.email.placeholder`            | nama@gmail.com                                                                 | name@gmail.com                                                              |
| `auth.email.submit`                 | Kirim kode                                                                     | Send code                                                                   |
| `auth.email.sending`                | Mengirim kode…                                                                 | Sending code…                                                               |
| `auth.email.terms`                  | Dengan lanjut, kamu setuju dengan <link>Syarat & Ketentuan</link>.             | By continuing, you agree to the <link>Terms</link>.                         |
| `auth.code.title`                   | Cek email kamu                                                                 | Check your email                                                            |
| `auth.code.subtitle`                | Kami kirim kode ke <b>{{email}}</b>. Kode berlaku {{minutes}} menit.           | We sent a code to <b>{{email}}</b>. It expires in {{minutes}} minutes.      |
| `auth.code.label`                   | Kode 6 digit                                                                   | 6-digit code                                                                |
| `auth.code.submit`                  | Verifikasi                                                                     | Verify                                                                      |
| `auth.code.verifying`               | Memeriksa kode…                                                                | Checking code…                                                              |
| `auth.code.noCode`                  | Belum dapat kode?                                                              | Didn't get it?                                                              |
| `auth.code.resend`                  | Kirim ulang                                                                    | Resend                                                                      |
| `auth.code.resendIn`                | Kirim ulang {{time}}                                                           | Resend in {{time}}                                                          |
| `auth.code.resending`               | Mengirim…                                                                      | Sending…                                                                    |
| `auth.code.resent`                  | Kode baru sudah dikirim.                                                       | New code sent.                                                              |
| `auth.code.alreadySent`             | Kode sudah dikirim tadi. Cek inbox atau folder spam.                           | We already sent a code. Check your inbox or spam folder.                    |
| `auth.code.newCode`                 | Kirim kode baru                                                                | Send a new code                                                             |
| `auth.code.changeEmail`             | Ganti email                                                                    | Change email                                                                |
| `auth.code.cooldownStart` (sr-only) | Kirim ulang tersedia dalam {{seconds}} detik.                                  | You can resend in {{seconds}} seconds.                                      |
| `auth.code.cooldownEnd` (sr-only)   | Kamu bisa kirim ulang kode sekarang.                                           | You can resend the code now.                                                |
| `auth.username.title`               | Pilih username                                                                 | Choose a username                                                           |
| `auth.username.subtitle`            | Ini jadi alamat profil kamu. Bisa diganti nanti di pengaturan profil.          | This is your profile address. You can change it later in profile settings.  |
| `auth.username.label`               | Username                                                                       | Username                                                                    |
| `auth.username.hint`                | 3–30 karakter. Huruf kecil, angka, atau garis bawah (\_).                      | 3–30 characters. Lowercase letters, numbers, or underscores (\_).           |
| `auth.username.checking`            | Mengecek ketersediaan…                                                         | Checking…                                                                   |
| `auth.username.available`           | {{url}} bisa kamu pakai.                                                       | {{url}} is yours if you want it.                                            |
| `auth.username.suggestions`         | Saran:                                                                         | Try:                                                                        |
| `auth.username.submit`              | Simpan dan lanjut                                                              | Save and continue                                                           |
| `auth.username.saving`              | Menyimpan…                                                                     | Saving…                                                                     |
| `auth.username.signOut`             | Keluar                                                                         | Sign out                                                                    |
| `auth.errors.emailFormat`           | Format email belum benar. Contoh: nama@gmail.com                               | That email doesn't look right. Example: name@gmail.com                      |
| `auth.errors.emailDomain`           | Akun baru belum bisa pakai email {{domain}}. Pakai Gmail, Yahoo, atau Outlook. | New accounts can't use {{domain}} emails yet. Use Gmail, Yahoo, or Outlook. |
| `auth.errors.sendLimit`             | Sudah terlalu banyak kode yang dikirim. Coba lagi sejam lagi.                  | Too many codes sent. Try again in an hour.                                  |
| `auth.errors.verifyLimit`           | Terlalu banyak percobaan dari jaringan ini. Tunggu 10 menit, lalu coba lagi.   | Too many tries from this network. Wait 10 minutes, then try again.          |
| `auth.errors.codeIncomplete`        | Masukkan 6 digit kode.                                                         | Enter all 6 digits.                                                         |
| `auth.errors.codeWrong_one`         | Kodenya salah. Sisa {{count}} percobaan.                                       | Wrong code. {{count}} try left.                                             |
| `auth.errors.codeWrong_other`       | Kodenya salah. Sisa {{count}} percobaan.                                       | Wrong code. {{count}} tries left.                                           |
| `auth.errors.codeLockedTitle`       | Terlalu banyak percobaan                                                       | Too many tries                                                              |
| `auth.errors.codeLockedBody`        | Kode ini sudah dikunci. Minta kode baru untuk lanjut.                          | This code is locked. Get a new code to continue.                            |
| `auth.errors.codeExpiredTitle`      | Kodenya sudah kedaluwarsa                                                      | This code has expired                                                       |
| `auth.errors.codeExpiredBody`       | Kode cuma berlaku {{minutes}} menit. Minta kode baru, ya.                      | Codes last {{minutes}} minutes. Get a new one.                              |
| `auth.errors.usernameLength`        | Username harus 3–30 karakter.                                                  | Use 3–30 characters.                                                        |
| `auth.errors.usernameFormat`        | Pakai huruf kecil, angka, atau garis bawah (\_) saja.                          | Use only lowercase letters, numbers, or underscores (\_).                   |
| `auth.errors.usernameReserved`      | @{{username}} dipakai sistem. Coba yang lain.                                  | @{{username}} is reserved. Try another one.                                 |
| `auth.errors.usernameTaken`         | @{{username}} sudah dipakai. Coba yang lain.                                   | @{{username}} is taken. Try another one.                                    |
| `auth.errors.usernameCheckFailed`   | Gagal mengecek username. Kamu tetap bisa simpan.                               | Couldn't check this username. You can still save.                           |
| `auth.errors.network`               | Koneksi terputus. Cek internet kamu, lalu coba lagi.                           | You're offline. Check your connection and try again.                        |
| `auth.errors.generic`               | Ada yang salah di sistem kami. Coba lagi sebentar lagi.                        | Something went wrong on our side. Try again in a moment.                    |
| `auth.common.retry`                 | Coba lagi                                                                      | Try again                                                                   |
| `auth.common.back`                  | Kembali                                                                        | Back                                                                        |
| `auth.common.close`                 | Tutup                                                                          | Close                                                                       |

Notes:

- `{{time}}` is `m:ss` (e.g. `0:42`), formatted in code.
- `<link>` / `<b>` via react-i18next `Trans` components.
- ID plural forms are identical; i18next still needs `_one`/`_other` because EN needs them.

**Old keys to remove** (current `auth.*` in `messages/en.json`): `signIn`, `signUp`, `welcomeBack`, `createAccount`, `password`, `passwordPlaceholder`, `rememberMe`, `forgotPassword`, `resetPassword`, `resetPasswordDescription`, `sendingReset`, `sendResetLink`, `backToSignIn`, `signingIn`, `creatingAccount`, `orContinueWith`, `orSignUpWith`, `google`, `github`, `rememberPassword`, `emailDomainError` (single-brace `{domain}`, unused), `emailFormatError`, `success` (has emoji). Keep or rename `username`, `email`, `termsAgreement`, `termsLink`. Also the hard-coded English strings in `app/user/auth/page.tsx` ("Loading...", "Remember me", "OR CONTINUE WITH", "By signing in…").

### Email copy

Template `email-otp.html`, strings in `email-otp.copy.json` (move into `messages/*.json` under `email.otp.*` or keep server-side). Language = `resolveEmailLocale` (locale cookie, then Accept-Language, then `id`), already in `lib/auth/otp-email.ts`. Proposal: keep that function, replace the `COPY` strings and the `html` string with this template. The subject lines already match.

| Key       | ID                                                                                                     | EN                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| subject   | {{code}} adalah kode masuk VibeDev ID kamu                                                             | {{code}} is your VibeDev ID sign-in code                                              |
| preheader | Berlaku {{minutes}} menit. Jangan bagikan ke siapa pun.                                                | Expires in {{minutes}} minutes. Don't share it with anyone.                           |
| heading   | Kode masuk kamu                                                                                        | Your sign-in code                                                                     |
| intro     | Masukkan kode ini untuk masuk atau membuat akun VibeDev ID sebagai {{email}}.                          | Enter this code to sign in or create your VibeDev ID account as {{email}}.            |
| expiry    | Kode berlaku {{minutes}} menit dan cuma bisa dipakai sekali.                                           | This code expires in {{minutes}} minutes and works once.                              |
| noShare   | Jangan bagikan kode ini. Tim VibeDev ID tidak pernah memintanya.                                       | Don't share this code. The VibeDev ID team will never ask for it.                     |
| ignore    | Bukan kamu yang minta? Abaikan saja email ini. Tanpa kode ini, tidak ada yang bisa masuk ke akun kamu. | Didn't ask for this? You can ignore this email. Nobody can sign in without this code. |
| footer    | Email ini dikirim otomatis. Balasan ke alamat ini tidak dibaca.                                        | This email was sent automatically. Replies to this address are not read.              |

Email build rules: table layout, inline styles, 480px max, light `#f4f4f5` bg, white card, 4px gold `#fdc700` top bar (decoration only; gold text fails contrast on white). Code 36px monospace, `letter-spacing:8px`, one text node (copy/paste stays "482917"). Wordmark is text because SVG does not render in Gmail/Outlook; swap for a hosted PNG if wanted. Escape `{{email}}` with `escapeHtml`. Send both `html` and `text` to Resend (`email-otp.*.txt`).

---

## 9. Accessibility checklist

- Every input has a visible `Label` (OTP: sr-only label + H1).
- All targets ≥44px: icon buttons `size-11`, link buttons `min-h-11`, chips via hit-area pseudo-element.
- Errors: `aria-invalid` on the input, `aria-describedby` → message, message `role="alert"`.
- Status (checking, available, resent, cooldown start/end): `aria-live="polite"`.
- Color is never the only signal: errors have an icon + text, available has a check + text.
- Loading buttons: `aria-busy`, label text changes.
- 16px input text (no iOS zoom). Touch: no hover-only affordances.
- Contrast: muted-foreground `.72` on card `.14` passes AA for 14px.

---

## 10. Backend alignment (read from the uncommitted work in `/workspace/vibedevid`, not changed)

| UI needs                       | Backend today                                                                                                                                                                                                                      | Gap                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Error code per state           | `INVALID_EMAIL`, `EMAIL_DOMAIN_NOT_ALLOWED` (+`domain`), `OTP_RESEND_COOLDOWN`, `OTP_SEND_LIMIT`, `OTP_VERIFY_LIMIT` (+`retryAfterSeconds`), `EMAIL_NOT_CONFIGURED`; Better Auth `INVALID_OTP`, `OTP_EXPIRED`, `TOO_MANY_ATTEMPTS` | none, map them as above                                                                                         |
| "Sisa N percobaan"             | Better Auth keeps the counter but does not return it                                                                                                                                                                               | UI counts wrong tries locally (`5 - wrongAttempts`). Good enough. Off by some if the user verifies in two tabs. |
| Resend countdown after refresh | no timestamp in the send response                                                                                                                                                                                                  | UI stores `sentAt`. Optional: return `retryAfterSeconds` as time left, not window size.                         |
| Username availability          | T10 not written yet                                                                                                                                                                                                                | wants `{ available: boolean, reason?: "taken" \| "reserved" \| "invalid", suggestions?: string[] }`             |
| Prefill                        | `suggestUsername(email)`                                                                                                                                                                                                           | none                                                                                                            |
| Username rule                  | `validateUsername`                                                                                                                                                                                                                 | reuse in `profile-edit-dialog`                                                                                  |
| Email copy                     | `lib/auth/otp-email.ts`                                                                                                                                                                                                            | swap in this template; strings in `email-otp.copy.json`                                                         |

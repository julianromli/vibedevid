# 015 — Favicon fetch without auto-redirect

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Security
- **Rule**: react-doctor/untrusted-redirect-following
- **Estimated scope**: 1 file + 1 test, small

## Problem

`lib/favicon-utils.ts:77` is a server `fetch` of a user website URL (`lib/actions/projects.ts:99`, `:352`, `:482`). Default fetch follows redirects. An attacker can submit a public origin that redirects to a private hop.

    // lib/favicon-utils.ts:71 — current
    for (const faviconUrl of faviconPaths) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(faviconUrl, {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });

Canonical recipe: set `redirect: "manual"` (or `"error"`). Re-validate each `Location` against a host allowlist before you follow. Reject private and link-local IPs. Never pass raw request input into an auto-following fetch.

`extractDomain` already requires a dotted hostname and rejects all-numeric hosts. It does not stop redirect hops. `mode: "no-cors"` is a browser option and hides status on the server.

## Target

1. Remove `mode: "no-cors"`.
2. Set `redirect: "manual"`.
3. Treat 2xx as success. Treat 3xx as “do not follow”; try the next path.
4. Reject private, loopback, and link-local hosts before fetch.

   // target — fetch options
   const response = await fetch(faviconUrl, {
   method: "HEAD",
   redirect: "manual",
   signal: controller.signal,
   });

   if (response.ok) {
   return faviconUrl;
   }

   // target — extra host guard in extractDomain / a new helper
   function isBlockedHostname(hostname: string): boolean {
   const lower = hostname.toLowerCase();
   if (lower === "localhost" || lower.endsWith(".localhost")) return true;
   if (lower === "0.0.0.0" || lower === "::1") return true;
   // block 10/8, 127/8, 169.254/16, 172.16/12, 192.168/16
   ...
   }

If HEAD is not allowed by the remote host, keep the existing catch → next path → Google fallback. Do not follow `Location`.

## Repo conventions to follow

- Keep `DEFAULT_FAVICON` and the Google fallback in `fetchFavicon`.
- Imitate `getSafeRedirectPath` (`lib/auth/credentials.ts:31`) — deny by default, small exported helper.
- Add `tests/unit/lib/favicon-utils.spec.ts` for `isBlockedHostname` / `extractDomain` (do not mock live network if you can test the host guard in isolation). Export the host guard if the test needs it.

## Steps

1. Add a blocked-host helper in `lib/favicon-utils.ts`.
2. Use `redirect: "manual"` and drop `mode: "no-cors"`.
3. Do not follow 3xx.
4. Add unit tests for private hosts.

## Boundaries

- Do NOT change `getFaviconUrl` client preview (it already uses Google).
- Do NOT add dependencies.
- Do NOT follow even one redirect hop in this plan.
- STOP if `_fetchFaviconWithTimeout` has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `untrusted-redirect-following` / related fetch diagnostics on this file. Score does not drop.
  - `vp test` focused on the new spec.
  - `vp check`.
- **Behavior check**: Submit or edit a project with `https://github.com`. Confirm a favicon URL is still stored (GitHub or Google fallback). Confirm `http://127.0.0.1` and `http://192.168.0.1` do not get fetched (unit test is enough).
- **Done when**: server fetch never follows redirects, and private hosts are rejected.

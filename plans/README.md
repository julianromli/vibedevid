# React improvement plans

Plans from the 2026-08-29 `improve-react` audit at commit `c829824`.

Execute in the order below. Plans that share a file must stay sequential.

| #   | Plan                                                                          | Status | Severity | Depends on |
| --- | ----------------------------------------------------------------------------- | ------ | -------- | ---------- |
| 001 | [Always wrap ThemeProvider](001-always-wrap-theme-provider.md)                | DONE   | HIGH     | —          |
| 014 | [Render theme toggle on first paint](014-render-theme-toggle-placeholder.md)  | DONE   | MEDIUM   | 001        |
| 002 | [Sync comments on client navigation](002-sync-comment-section-on-nav.md)      | DONE   | HIGH     | —          |
| 011 | [Reset comment loading flags in finally](011-comment-loading-flag-finally.md) | DONE   | MEDIUM   | 002        |
| 010 | [Label guest comment name](010-label-guest-comment-name.md)                   | DONE   | MEDIUM   | 011        |
| 003 | [Reset blog view tracker per post](003-reset-blog-view-tracker.md)            | DONE   | HIGH     | —          |
| 004 | [Label auth close control](004-label-auth-close-control.md)                   | DONE   | HIGH     | —          |
| 005 | [Navbar transform, not margin](005-navbar-transform-not-margin.md)            | DONE   | HIGH     | —          |
| 006 | [Honor event sort control](006-honor-event-sort-control.md)                   | DONE   | HIGH     | —          |
| 007 | [Reset visible projects on filter](007-reset-visible-projects-on-filter.md)   | DONE   | HIGH     | —          |
| 008 | [Escape auth email HTML](008-escape-auth-email-html.md)                       | DONE   | MEDIUM   | —          |
| 009 | [Lock like-button in-flight toggles](009-like-button-in-flight-lock.md)       | DONE   | MEDIUM   | —          |
| 012 | [Reuse root user on project list](012-reuse-root-user-on-project-list.md)     | DONE   | MEDIUM   | —          |
| 013 | [Parallelize home loader](013-parallelize-home-loader.md)                     | DONE   | MEDIUM   | —          |
| 015 | [Favicon fetch without auto-redirect](015-favicon-manual-redirect.md)         | DONE   | MEDIUM   | —          |
| 016 | [Label cover image file input](016-label-cover-image-file-input.md)           | DONE   | LOW      | —          |
| 017 | [Redirect mock /calendar to events](017-remove-mock-calendar-route.md)        | DONE   | LOW      | —          |

## Recommended batches

1. Theme: `001` then `014`.
2. Comments: `002` then `011` then `010` (same file).
3. Independent HIGH: `003`, `004`, `005`, `006`, `007`.
4. Independent MEDIUM: `008`, `009`, `012`, `013`, `015`.
5. Polish: `016`, `017`.

Do not run `001` and `014` in parallel. Do not run `002`, `010`, and `011` in parallel.

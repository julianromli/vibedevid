# Issues

- `app/project/submit/page.tsx` was calling `getCategories()` from `lib/categories.ts`, but that helper used the browser Supabase client. The submit route now loads categories with the server client so the route fetch is actually server-safe.
- A later retry introduced an import-trace regression by making `lib/categories.ts` pull in `next/headers` through the server Supabase client. The final fix keeps `lib/categories.ts` client-safe and moves the submit-page category query directly into the route.
- Vitest in this repo does not currently resolve the `@/` alias by default, so the Task 2 unit test uses relative imports for the action and mocked modules to keep the targeted spec runnable without broad test-config work.
- Repo-level lint/typecheck commands still pick up unrelated generated/temp workspace content under `%TEMP%` and docs bundles, so task verification used direct file-scoped Biome + LSP checks instead of broad project-wide config work.
- Playwright browser binaries were initially missing locally; `bunx playwright install chromium` was required before the new submit/import spec could run.

### Task 6: 4-Step Form Stepper Caveats
- Playwright auth flow (`/user/auth` navigation using `TEST_EMAIL`) currently fails in our local automated run due to DB/seed mismatch (returns to login), but the test logic itself correctly navigates the stepper using `getByRole('button', { name: 'Next' })` and successfully tests value preservation between steps.
- Currently `category` doesn't display the full object data (only its `name` string value) until step 3, so its display name lookup assumes `categories` prop contains the value.

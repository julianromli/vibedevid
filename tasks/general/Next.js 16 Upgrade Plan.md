---
# 📋 Next.js 16 Upgrade Plan - Final
## Executive Summary
| Aspect | Details |
|--------|---------|
| **Current Version** | Next.js 15.5.2 |
| **Target Version** | Next.js 16.x (latest stable) |
| **Risk Level** | 🟢 Low - codebase is well-prepared |
| **Estimated Time** | ~10-15 minutes |
---
Pre-Upgrade Analysis Results
✅ Already Compatible (No Action Needed)
- React 19 - already compatible
- Node.js v24.11.1 - exceeds v20.9 requirement
- TypeScript ^5 - meets v5.1+ requirement
- No parallel routes - no @ folders found
- No removed APIs - no AMP, serverRuntimeConfig, unstable_noStore, etc.
- Async APIs - pages already use client hooks (useParams, useSearchParams)
- middleware.ts - keeping as-is (deferred until full deprecation)
⚠️ Requires Manual Changes
| File | Change | Reason |
|------|--------|--------|
| next.config.mjs | Remove eslint: { ignoreDuringBuilds: true } (lines 9-11) | ESLint config removed from next.config in v16 |
| package.json | Change "dev": "next dev --turbopack" → "dev": "next dev" | Turbopack is now default in v16 |
---
Execution Steps
Step 1: Pre-flight Commit
git add .
git commit -m "chore: pre-upgrade state before Next.js 16 migration"
Files to commit:
- ai-dev-tasks-main/
- components/ui/motion-wrapper.tsx
- tasks/
---
Step 2: Run Codemod
pnpx @next/codemod@canary upgrade latest
Prompts: Select "yes" for all options
Codemod will automatically:
- Upgrade next to 16.x
- Upgrade react and react-dom if needed
- Upgrade @types/react and @types/react-dom
- Upgrade eslint-config-next to match
- Upgrade @next/bundle-analyzer to match
- Apply async API transformations (if any missed)
---
Step 3: Manual Fix - next.config.mjs
Before (lines 8-14):
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
After:
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
Note: The eslint.ignoreDuringBuilds behavior should be handled in .eslintrc.json or CI/CD pipeline instead. Since your build already has ignoreBuildErrors: true for TypeScript AND the .eslintrc.json is properly configured, removing this won't break anything.
---
Step 4: Manual Fix - package.json
Before (line 7):
dev: next dev --turbopack,
After:
dev: next dev,
Reason: Turbopack is the default bundler in Next.js 16. The --turbopack flag is no longer needed (use --webpack flag if you want the old behavior).
---
Step 5: Verify Build
pnpm run build
Expected outcome: Build should succeed without errors.
---
Step 6: Browser Verification
pnpm run dev
Then test these routes in browser:
- / - Homepage
- /project/[some-slug] - Project detail page
- /user/auth - Auth page
- /@username - User profile page
Check for:
- No console errors
- Pages load correctly
- No hydration warnings
---
Step 7: Final Commit
git add .
git commit -m "chore: upgrade to Next.js 16"
---
Rollback Plan
If upgrade fails:
git reset --hard HEAD~1  # Undo upgrade commit
pnpm install             # Reinstall old dependencies
# Browser E2E / smoke tests (agent-browser)

End-to-end smoke checks use the [agent-browser](https://www.npmjs.com/package/agent-browser) CLI, not Playwright Test. The runner lives in `scripts/smoke-agent-browser.mjs`.

## Prerequisites

1. App running locally (Vite dev server):

   ```bash
   bun run dev
   ```

2. Chromium for agent-browser (one-time):

   ```bash
   npx agent-browser@latest install
   ```

## Commands

| Script | What it runs |
| ------ | ------------ |
| `bun run test:e2e` | Smoke suite (default) |
| `bun run test:smoke` | Same as `test:e2e` |
| `bun run test:e2e:headed` | Smoke with visible browser window |
| `bun run test:all` | Vitest unit tests + smoke |

```bash
# Default (headless)
bun run test:e2e

# Visible browser (debugging)
bun run test:e2e:headed

# Preview / production URL
SMOKE_BASE_URL=https://your-preview.vercel.app bun run test:e2e
```

## What is checked

- `GET /api/health` returns `"status":"ok"`
- Homepage loads (title contains `VibeDev`)
- Anonymous `/admin` redirects to auth
- Unknown username profile → 404 UI (`Page not found`)
- Reserved path `/project` → 404 UI

## Adding checks

Edit `scripts/smoke-agent-browser.mjs`. Use the agent-browser workflow:

1. `open` URL
2. `wait` for load or text
3. `get` / `eval` to assert
4. `close` when done

Example chain:

```bash
npx agent-browser@latest open http://127.0.0.1:5173/blog
npx agent-browser@latest wait --load networkidle
npx agent-browser@latest get title
npx agent-browser@latest close
```

See `npx agent-browser@latest --help` for snapshot refs, screenshots, and session persistence.

## CI

CI runs unit tests only (`bun run test`). Run smoke manually before deploy or against a preview URL with `SMOKE_BASE_URL`. Details: [Vercel deployment guide](../deployment/vercel.md#7-smoke-tests-agent-browser).

## Unit tests

Vitest covers `tests/unit/**` (and `tests/integration/**` when present). Use `bun run test` — separate from browser smoke.

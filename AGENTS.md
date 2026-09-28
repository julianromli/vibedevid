# RULES

- Selalu update `README.md` jika ada perubahan yang relevan setelah mengerjakan task atau membuat perubahan apa pun.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Cursor Cloud specific instructions

- Install Bun `1.3.14` (`packageManager` in `package.json`). Then run `bun install --frozen-lockfile`. `vp` is `node_modules/.bin/vp` after install.
- Start the app with `bun run dev` on port 3000. Sign in at `http://localhost:3000`. Better Auth rejects `http://127.0.0.1:3000` with `Invalid origin`.
- Copy `.env.example` to `.env.local`. If `DATABASE_URL` is unset, Cloud Agent startup creates a temporary Claimable Postgres database (72 hours) and runs `bun run db:setup`.
- If `DATABASE_URL` is already set, startup uses that database and does not run `bun run db:setup`. Do not seed or migrate the production database. `DATABASE_URL_UNPOOLED` must be the direct host. Remove `-pooler` from the hostname.
- Seed login (temporary database only): `seed.admin@gmail.com` / `VibeDevLocal1!`. Admin dashboard: `/dashboard`.
- OAuth, UploadThing, Resend, and OpenRouter are optional. Browse and email login work without them.
- `bun run test` and `bun run build` are the passing checks. `bun run lint:ci` and `bunx tsc --noEmit` still report existing repo diagnostics.

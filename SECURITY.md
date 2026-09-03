# Security Guidelines for VibeDev ID

## Environment Variables

### Best Practices

1. **Never commit sensitive keys to version control**
   - Use `.env.local` for local development (already in `.gitignore`)
   - Use `.env.example` for documentation with placeholder values

2. **Use the current prefixes**
   - `VITE_*` — values Vite inlines into the browser bundle
   - `NEXT_PUBLIC_SITE_URL` — live server/SEO site URL (legacy name, still required)
   - All other variables — server-only. Read them through `getServerRuntimeSecrets()` on Workers.

3. **Sensitive variables (keep secret)**
   - `DATABASE_URL` — Neon pooled connection string
   - `BETTER_AUTH_SECRET` — Better Auth signing secret
   - `GOOGLE_CLIENT_SECRET` / `GITHUB_CLIENT_SECRET` — OAuth secrets
   - `UPLOADTHING_TOKEN` — file upload API access
   - `OPENROUTER_API_KEY` / `RESEND_API_KEY` — optional provider keys

4. **Public variables (safe to expose)**
   - `VITE_SITE_URL` / `NEXT_PUBLIC_SITE_URL` — website URL
   - `VITE_BETTER_AUTH_URL` — public auth callback URL

### Setting Up Environment Variables

#### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your actual values
3. Never commit `.env.local`

#### Cloudflare Workers Deployment

1. Set runtime secrets with Wrangler (never commit them):
   `bunx wrangler secret put <NAME>` or `bun run scripts/sync-wrangler-secrets.ts`
2. Required runtime keys: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, plus OAuth and upload keys
   when those features are enabled
3. Do not put `DATABASE_URL_UNPOOLED` on the Worker. Keep it in local
   `.env.local` for schema tools.
4. `VITE_*` values are inlined at build time. Rebuild before deploy when
   they change.

### Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No real API keys in `.env.example`
- [ ] No `console.log` of sensitive tokens
- [ ] Server-only keys are read via `getServerRuntimeSecrets()`, not `process.env` on Workers
- [ ] Regular key rotation for production environments

### If Keys Are Exposed

1. **Immediately rotate the exposed keys**
   - Neon: rotate the connection string
   - Better Auth: generate a new `BETTER_AUTH_SECRET`
   - UploadThing: Dashboard → regenerate token
   - OAuth: rotate Google/GitHub client secrets

2. **Update all environments**
   - Local `.env.local`
   - Worker secrets
   - Any other deployments

3. **Check for unauthorized usage**
   - Review Neon query logs
   - Check UploadThing usage statistics

## Reporting Security Issues

If you discover a security vulnerability, please email security@vibedev.id instead of using public issue trackers.

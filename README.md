# VibeDev ID

**When the Codes Meet the Vibes** 🚀

VibeDev ID adalah komunitas vibrant developer, AI enthusiasts, dan tech innovators Indonesia yang punya visi dan passion yang sama untuk bikin produk digital yang keren. Kami menghubungkan creator yang sepikiran untuk kolaborasi, belajar, dan berkembang bareng.

_Indonesia's premier community for developers, vibe coders, and AI enthusiasts. Showcase projects, collaborate, network, and level up your skills in web, mobile, and AI development._

## Features

- 🔐 **User Authentication** - Secure login with Better Auth (email + Google/GitHub OAuth)
- 👤 **Developer Profiles** - Customizable profiles with bio, skills, and social links
- 📝 **Project Showcase** - Share dan showcase project keren lo
- 💬 **Community Interaction** - Comments, likes, dan diskusi project
- 🤝 **Networking & Collaboration** - Connect sama developer yang sepikiran
- 📰 **Blog System** - Rich text editor dengan Novel/TipTap untuk artikel teknis
- 📊 **Views Tracking** - Session-based analytics untuk project insights
- 🤖 **AI Leaderboard** - Ranking dan showcase AI tools favorit komunitas
- 🗓️ **Community Calendar** - Event dan activity tracker
- 🎉 **Events System** - Submit dan browse community events dengan approval workflow
- 📈 **User Dashboard** - Personal dashboard untuk manage projects dan activity
- 🛠️ **Admin Dashboard** - Full admin panel dengan moderation tools
- ⌨️ **Command Palette** - Quick navigation dan search (cmdk)
- 🎬 **Vibe Videos** - Video content section untuk tutorial dan highlights
- 🌙 **Dark/Light Mode** - UI theme yang nyaman mata
- 📱 **Responsive Design** - Perfect di semua device
- 🏷️ **Project Categories** - Personal Web, SaaS, Landing Page, dan lainnya
- ❤️ **Like System** - Like project yang lo suka
- 🔍 **Discovery** - Filter dan cari project berdasarkan kategori
- 🖼️ **Progressive Image Loading** - Blur placeholders dengan lazy loading
- 🌍 **Internationalization** - Full support English dan Indonesia (react-i18next)
- 🛡️ **Spam Protection** - Email domain whitelist dan bot protection
- 📊 **Analytics Dashboard** - Charts dan data visualization (recharts)
- ❓ **FAQ System** - Frequently asked questions management
- 🚨 **Content Moderation** - Report dan moderation system
- 🔎 **SEO** - SSR meta/Open Graph, JSON-LD, dynamic sitemap, robots.txt, canonical, dan `noindex` di halaman privat

## Tech Stack

- **Framework**: TanStack Start (Vite + Nitro) with `@tanstack/react-router` file-based routing
- **Build/Dev**: Vite 8 + Nitro server output
- **Language**: TypeScript 5.x
- **Database**: Neon Postgres (Drizzle ORM) — migrated from Supabase. All server data access uses Drizzle via `getDb()` with Better Auth session checks (`requireUser`, `requireAdminOrModeratorUser`). One-time Supabase → Neon scripts live in `scripts/migrate-to-neon.ts`.
- **Authentication**: Better Auth (`/api/auth/*`) with email/password + Google/GitHub OAuth
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui (50+ components)
- **Animations**: Motion (Framer Motion) — shared scroll-reveal primitives in `components/ui/motion-wrapper.tsx` (`ScrollReveal`, `StaggerContainer`/`StaggerItem`, `ScaleIn`) applied across the landing page and the `/project/list`, `/blog`, `/event/list`, and `/[username]` profile pages (header/stats entrance reveal, staggered project/blog card grids, scaled tab-content reveals); Radix dropdown menus (e.g. avatar menu) and the FAQ accordion animate open/close via Framer Motion, all with `prefers-reduced-motion` support
- **Rich Text**: Novel + TipTap
- **Icons**: Lucide React + Tabler Icons + LobeHub Icons
- **Internationalization**: react-i18next
- **Forms**: React Hook Form + Zod
- **AI Integration**: AI SDK + OpenRouter Provider
- **File Uploads**: UploadThing + Better Upload
- **Command Palette**: cmdk
- **Charts**: Recharts
- **Dates**: date-fns + date-fns-tz
- **Testing**: Playwright (E2E) + Vitest (unit)
- **Code Quality**: Biome (linter + formatter)
- **Hosting**: Cloudflare Workers (Nitro `cloudflare_module` preset)
- **Toast**: Sonner

> Note: this app was migrated from Next.js 16 App Router to TanStack Start. Some `app/` subfolders still use Next.js-style names but are now plain view/component modules imported by route files in `app/routes/`.

## Getting Started

### Prerequisites

- Node.js 18+ or **Bun** (recommended)
- [Vite+](https://viteplus.dev/) (`vp` CLI) — this project uses the Vite+ unified toolchain
- A [Neon](https://neon.tech) Postgres database
- Better Auth OAuth apps (Google + GitHub) for social login

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vibedevid_v0.git
cd vibedevid_v0
```

2. Install dependencies:

```bash
vp install
```

> Vite+ ships `vite`/`vitest` in `devDependencies` as npm aliases to `@voidzero-dev/vite-plus-core` / `@voidzero-dev/vite-plus-test`, and the `overrides` field in `package.json` pins both to those same alias specs. The `vitest` override **must match the `devDependencies.vitest` spec exactly** (i.e. the `npm:@voidzero-dev/vite-plus-test@latest` alias, not a plain version like `4.1.9`). Bun tolerates a mismatch, but npm/`npx` (used by `npx wrangler deploy` on Cloudflare) rejects it with `EOVERRIDE: Override for vitest conflicts with direct dependency`. If you upgrade `vite-plus` and `vp install` changes the alias, re-sync `overrides.vitest` to match `devDependencies.vitest`. Do **not** route this pin through a `catalog:` reference.

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Update `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
VITE_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
UPLOADTHING_TOKEN=your-uploadthing-token-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
VITE_SITE_URL=http://localhost:3000
OPENROUTER_API_KEY=sk-or-v1-...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

5. Set up the database:

```bash
bun run migrate:schema   # first-time Neon schema
# Migrating from Supabase (set SUPABASE_DB_URL, SUPABASE_URL, SUPABASE_ANON_KEY in .env.local):
bun run migrate:staging -- --force  # auth.users → staging (destructive staging reset)
bun run migrate:users    # staging → Better Auth
bun run migrate:data -- --force     # public tables (destructive target reset)
bun run migrate:verify -- --fail-on-mismatch
bun run migrate:status  # checkpoints + Neon counts
# Or: bun run migrate:run  # schema → staging → users → data → verify, skipping checkpoints
```

See [docs/migrations/neon-better-auth.md](docs/migrations/neon-better-auth.md) for the full migration guide.

6. Run the development server:

```bash
bun run dev

# or

npm run dev

# or

pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
# Install dependencies
vp install

# Development server (vite dev, port 3000)
bun run dev

# Build for production (vite build — Nitro server output in .output/)
bun run build

# Start the production server
bun run start

# Type checking (required for type safety)
bunx tsc --noEmit

# Linting & Formatting (Biome)
bun run lint        # changed files only
bun run lint:all    # full repo
bun run format

# Unit tests (Vitest)
bun run test
bun run test:watch

# E2E tests (Playwright)
bun run test:e2e
bun run test:e2e:headed   # see browser
bun run test:e2e:debug    # step through

# Run a single Playwright spec / test by name
bunx playwright test tests/views-tracking.spec.ts
bunx playwright test -g "should track views when visiting project page"
```

## Environment Variables

| Variable                                    | Description                                  | Required |
| ------------------------------------------- | -------------------------------------------- | -------- |
| `DATABASE_URL`                              | Neon Postgres connection string (pooled)     | Yes      |
| `BETTER_AUTH_SECRET`                        | Random secret for Better Auth (min 32 chars) | Yes      |
| `BETTER_AUTH_URL`                           | Public app URL for auth callbacks            | Yes      |
| `VITE_BETTER_AUTH_URL`                      | Same URL, exposed to browser                 | Yes      |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth                                 | Yes      |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth                                 | Yes      |
| `UPLOADTHING_TOKEN`                         | UploadThing API token (keep secret!)         | Yes      |
| `NEXT_PUBLIC_SITE_URL`                      | Canonical site URL (server + SEO)            | Yes      |
| `VITE_SITE_URL`                             | Same URL, exposed to browser                 | Yes      |
| `OPENROUTER_API_KEY`                        | AI blog features                             | Yes      |
| `RESEND_API_KEY`                            | Resend API key for auth verification/reset   | Yes      |
| `EMAIL_FROM`                                | Verified sender address for Resend           | Yes      |

## Deployment (Cloudflare Workers)

The app deploys to Cloudflare Workers using the Nitro `cloudflare_module` preset
(configured in `vite.config.ts`) plus `wrangler.jsonc` at the repo root.
Production site: [https://vibedevid.com](https://vibedevid.com).

```bash
# 1. Build with production client URLs baked in (VITE_* are compile-time)
NEXT_PUBLIC_SITE_URL=https://vibedevid.com \
VITE_SITE_URL=https://vibedevid.com \
VITE_BETTER_AUTH_URL=https://vibedevid.com \
bun run build

# 2. Preview locally on Workers runtime (copy .env.local → .dev.vars)
bunx wrangler dev

# 3. Set Worker secrets (runtime — see list below), then deploy
bun run scripts/sync-wrangler-secrets.ts   # reads .env.local → wrangler secret bulk
bunx wrangler deploy
```

Notes:

- `compatibility_flags: ["nodejs_compat"]` and compatibility date `2024-09-19`
  (required for Workers Static Assets) are set in `wrangler.jsonc`.
- Server-only secrets must be read via `getServerRuntimeSecrets()`
  (`lib/server/runtime-secrets.ts`), not `process.env` directly. On Workers,
  bindings are exposed on `globalThis.__env__` per request.
- **`VITE_*` values are inlined at build time** — rebuild before deploy whenever
  `VITE_BETTER_AUTH_URL` or `VITE_SITE_URL` changes.
- Worker secrets (runtime): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`,
  `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_SITE_URL`, `UPLOADTHING_TOKEN`,
  `OPENROUTER_API_KEY`, `RESEND_API_KEY`, and `EMAIL_FROM`.
- For `wrangler dev`, create a gitignored `.dev.vars` file with the same keys.
- Add OAuth redirect URLs in Google/GitHub developer consoles:
  - `https://vibedevid.com/api/auth/callback/google`
  - `https://vibedevid.com/api/auth/callback/github`
- After cutover, remove legacy Supabase secrets from the Worker if still present.

## Database Schema

### Core Tables

**users** - Extended auth profiles with role system (0=admin, 1=moderator, 2=user), social links, bio, and location

**projects** - Project showcase with slug-based URLs for SEO, tags, and category

**comments** - Unified comments system for both Blog and Projects

**likes** - User likes with unique constraint (one like per user per project/post)

**views** - Session-based views tracking with 30-minute timeout, IP + User Agent fingerprinting

**posts** - Blog posts with rich text content (JSON), featured flag, read time

**post_tags** - Blog tag categorization

**blog_post_tags** - Many-to-many relationship between posts and tags

**events** - Community events with approval workflow, status (upcoming/past), location details

**categories** - Project categories with icon and color

**faqs** - FAQ content with sort order and active status

**blog_reports** - Comment/report moderation system

**vibe_videos** - Video content for tutorials and highlights

### Security

- Authorization enforced in application code (Drizzle queries + `requireUser` /
  `requireAdminOrModeratorUser`) — no Supabase RLS on Neon
- Authenticated insert/update untuk data milik user sendiri
- Guest comments diizinkan dengan `author_name` field
- Admin/moderator role diperlukan untuk moderation
- Email domain whitelist untuk registration

## Project Structure

```
├── app/
│   ├── routes/             # TanStack Router file-based routes (source of truth)
│   │   ├── __root.tsx      # Root layout, head/meta, providers
│   │   ├── index.tsx       # Homepage
│   │   ├── $username.tsx   # Dynamic user profile pages
│   │   ├── project.list.tsx / project.$slug.tsx / project.submit.tsx
│   │   ├── blog.tsx (layout) / blog.index.tsx / blog.$slug.tsx / blog.editor*.tsx
│   │   ├── event.list.tsx / event.$slug.tsx
│   │   ├── _admin/         # Protected admin route group (role-gated layout)
│   │   ├── admin.tsx       # Standalone admin page (role-gated via beforeLoad)
│   │   ├── api/            # API route handlers (server.handlers blocks)
│   │   └── auth.callback.ts
│   ├── routeTree.gen.ts    # Generated route tree (do not hand-edit)
│   ├── router.tsx          # Router factory
│   ├── start.ts            # TanStack Start instance + request middleware
│   └── <feature>/          # Legacy Next.js-named folders, now view/component
│                           #   modules imported by routes (blog, project,
│                           #   event, [username], (admin), user/auth, ...)
├── components/
│   ├── ui/                 # 50+ shadcn/ui components
│   ├── sections/           # Page sections (hero, showcase, faq)
│   ├── blog/               # Blog-specific components
│   ├── project/            # Project-specific components
│   ├── admin-panel/        # Admin dashboard components
│   ├── event/              # Event-specific components
│   └── profile/            # Profile-specific components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── actions/            # Server data/mutations + *.functions.ts (createServerFn)
│   ├── db/                 # Drizzle schema + `getDb()` (Neon serverless)
│   ├── auth/               # Better Auth server/client config
│   ├── server/             # Server-only utilities (auth, runtime secrets)
│   ├── routes/             # Route helpers (server locale/translations)
│   ├── uploadthing.ts      # UploadThing server router
│   ├── uploadthing-client.ts   # Client upload helpers
│   ├── uploadthing-router.ts   # Client-safe router types
│   └── ai/                 # AI integration (OpenRouter)
├── i18n/                   # react-i18next config (index.ts, routing.ts)
├── types/                  # TypeScript type definitions
├── scripts/                # Database migrations (20+ SQL files)
├── tests/                  # Vitest unit tests + Playwright E2E tests
├── messages/               # i18n messages (en.json, id.json)
├── docs/                   # Documentation (security, database, deployment)
├── biome.json              # Biome configuration
├── vite.config.ts          # Vite + TanStack Start + Nitro configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Features Deep Dive

### Project Filtering & Sorting

Project list (`/project/list`) dan homepage memakai `fetchProjectsWithSorting`
(`lib/actions.ts`) lewat server function `fetchProjectsWithSortingFn`.

Filter kategori bersifat resilient terhadap dua representasi nilai yang
tersimpan di kolom `projects.category`:

- Project baru menyimpan category `name` (slug, mis. `landing-page`).
- Project lama / seed menyimpan display text (mis. `Landing Page`).

Nilai filter dari UI di-resolve ke kedua bentuk lalu dimatch dengan `in(...)`,
sehingga semua project pada satu kategori tetap muncul.

Sorting tersedia dalam tiga mode:

- `newest` — urut `created_at` desc (limit langsung di SQL). **Default.**
- `top` — all-time best, murni berdasarkan total likes (tiebreak terbaru).
- `trending` — likes diberi bobot recency (`likes / umur-hari`).

Untuk `top`/`trending`, likes dihitung terpisah dan tidak bisa di-`order` di
SQL, jadi query mengambil candidate window yang lebih lebar dulu, lalu sort +
truncate ke `limit` di JS agar project lama dengan banyak likes tidak terpotong.

Pilihan filter & sort di UI **tidak** mengubah URL. Nilai awal tetap di-seed
dari search params saat load pertama (deep link tetap jalan), tapi mengganti
dropdown setelahnya hanya mengubah state lokal tanpa menyentuh query string.

### Comments System

Centralized comments component yang works untuk both Blog dan Project.

```tsx
import { CommentSection } from "@/components/ui/comment-section";

<CommentSection
  entityType="post" // or "project"
  entityId={id}
  initialComments={comments}
  isLoggedIn={!!user}
/>;
```

### Views Tracking

Session-based analytics dengan:

- 30-minute session timeout
- IP + User Agent fingerprinting
- Bot protection (user agent filtering)
- Unique visitor counting

### Progressive Image Loading

- SVG blur placeholders
- Intersection Observer lazy loading
- AVIF/WebP automatic optimization
- Client-safe processing (no sharp in client bundle)

### SEO

Search-engine optimization is handled at the route level:

- **Server-rendered meta** - Per-route `head()` blocks emit title, description, Open Graph, and Twitter Card tags (rendered in SSR HTML, verifiable with a Googlebot user-agent).
- **Structured data** - Organization + WebSite JSON-LD in the root route.
- **Dynamic sitemap** - `app/routes/sitemap[.]xml.ts` queries Neon (Drizzle) for published posts, projects, approved events, and public profiles, plus static routes. Auth-gated pages are excluded; `lastmod` uses real content timestamps with a fallback.
- **robots.txt** - `app/routes/robots[.]txt.ts` serves a single `User-agent: *` group, disallows private/API paths, and references the sitemap. Note: if Cloudflare's managed robots.txt is enabled it will shadow this route — keep only one source of truth.
- **Canonical URLs** - Self-referencing canonicals on content and list pages; the homepage and `/project/list` consolidate `?filter`/`?sort` variants onto their clean URLs.
- **noindex** - Admin, dashboard, blog editor, project submit, and auth routes emit `robots: noindex, nofollow` via the shared `NOINDEX_META` helper in `lib/seo/site-url.ts`.
- **Dynamic OG image** - `app/routes/api/og.ts` renders a branded 1200×630 SVG from a `title` query param (dependency-free, Cloudflare Workers-safe).
- **LCP-friendly images** - Below-the-fold images use `loading="lazy"`; preload is reserved for the hero/logo (above the fold).

### Email Domain Whitelist

Registration dibatasi ke domain terpercaya:

- gmail.com, yahoo.com, outlook.com
- dan 20+ domain edukasi/tech lain

### AI Integration

Built-in AI features using OpenRouter:

- AI-powered content suggestions
- Leaderboard for AI tool rankings
- Integration with Agentic workflow

### Events System

Full-featured events management:

- Event submission with approval workflow
- Status tracking (upcoming, past)
- Location types (online, offline, hybrid)
- Organizer profiles
- Cover image support

### Admin Dashboard

Comprehensive admin tools:

- User management (role: admin, moderator, user)
- Content moderation (comments, reports)
- Event approval workflow
- Analytics dashboard

### Skills System

This project includes AI agent skills for enhanced development:

- **motion-design** - Motion design principles for emotionally-driven, technically sound animations

See `.agents/skills/` for workspace skills.

## Contributing

Kami welcome kontribusi dari semua developer! 🎉

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Biome will auto-format on commit
- Write descriptive commit messages (Conventional Commits)
- Test your changes on both desktop and mobile
- Maintain the informal but professional Indonesian tone in UI copy

### Code Style

- 2-space indentation, no semicolons, single quotes
- Biome enforces unified linting + formatting
- `@/` prefix untuk absolute imports
- Group imports: React → Third-party → Internal

### Security

For detailed security documentation, see:

- [Security Audit Summary](docs/security/SECURITY_AUDIT_SUMMARY.md)
- [RLS Policies](docs/security/RLS_POLICIES.md)
- [Auth Dashboard Settings](docs/security/AUTH_DASHBOARD_SETTINGS.md)

## License

This project is licensed under the MIT License.

---

Built with ❤️ by VibeDev ID Community

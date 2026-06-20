# Migrate from Next.js to TanStack Start (Cloudflare Workers)

**Date:** 2026-06-07
**Status:** Planning
**Scope:** Complete cutover of the root Next.js 16 App Router app to TanStack Start, targeting Cloudflare Workers.

---

## Executive Summary

This plan documents the step-by-step migration of VibeDev ID from Next.js 16 App Router to **TanStack Start**, deployed on **Cloudflare Workers**. The `admin-kit/` package is deleted as part of this migration. Internationalization moves from `next-intl` to `react-i18next` with cookie-based locale (no URL prefix). Image uploads move from Uploadthing to Cloudflare R2 presigned URLs. Image optimization uses Cloudflare Images via `@unpic/react`. OG images become static. This is a full cutover — no incremental or hybrid phase.

---

## 1. Target Architecture

```
traecommunityid/
├── app/
│   ├── client.tsx                    # TanStack Start client entry
│   ├── ssr.tsx                      # TanStack Start SSR entry
│   ├── router.tsx                   # Router configuration
│   ├── routes/                      # All TanStack Router routes
│   │   ├── __root.tsx               # Root layout
│   │   ├── index.tsx                # Home page
│   │   ├── blog.tsx
│   │   ├── blog.$slug.tsx
│   │   ├── project.tsx
│   │   ├── project.$slug.tsx
│   │   ├── project.list.tsx
│   │   ├── project.submit.tsx
│   │   ├── event.$slug.tsx
│   │   ├── event.list.tsx
│   │   ├── dashboard.tsx
│   │   ├── dashboard.posts.tsx
│   │   ├── user.auth.tsx
│   │   ├── user.auth.confirm-email.tsx
│   │   ├── admin.tsx
│   │   ├── (admin)/                  # Admin route group
│   │   │   ├── __admin.layout.tsx
│   │   │   ├── admin.dashboard.tsx
│   │   │   ├── admin.dashboard.boards.overview.tsx
│   │   │   ├── admin.dashboard.boards.analytics.tsx
│   │   │   ├── admin.dashboard.boards.blog.tsx
│   │   │   ├── admin.dashboard.boards.comments.tsx
│   │   │   ├── admin.dashboard.boards.events-approval.tsx
│   │   │   ├── admin.dashboard.boards.projects.tsx
│   │   │   ├── admin.dashboard.boards.users.tsx
│   │   │   └── admin.dashboard.boards.admin-management.tsx
│   │   ├── $username.tsx
│   │   ├── calendar.tsx
│   │   ├── terms.tsx
│   │   ├── terms-of-service.tsx
│   │   ├── privacy-policy.tsx
│   │   ├── api/
│   │   │   ├── ai.completion.ts
│   │   │   ├── ai.enhance-description.ts
│   │   │   ├── auth-check.ts
│   │   │   ├── github-import.ts
│   │   │   ├── upload.ts             # R2 presigned URL endpoint
│   │   │   ├── vibe-videos.ts
│   │   │   └── vibe-videos.$id.ts
│   │   └── auth.callback.ts
│   └── globals.css                   # Tailwind v4 + Fontsource imports
├── src/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   ├── config/
│   └── i18n/
├── config/
│   └── site.ts
├── public/
├── messages/                         # i18n JSON (reused)
├── tests/
├── wrangler.jsonc
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Phase 0: Pre-Migration Foundation

| #   | Task                    | Details                                                                                                                          |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | **Delete `admin-kit/`** | `Remove-Item -Recurse -Force admin-kit`. Remove `admin-kit` from `tsconfig.json` `exclude`.                                      |
| 0.2 | **Create branch**       | `git checkout -b migrate/tanstack-start`.                                                                                        |
| 0.3 | **Capture baselines**   | Run `bunx tsc --noEmit` and `bun run test`. Record output.                                                                       |
| 0.4 | **Inventory env vars**  | List all `NEXT_PUBLIC_*` vars. Client vars will become `VITE_*`. Server vars stay as-is (accessible via `process.env` in Nitro). |

---

## 3. Phase 1: Dependencies & Tooling

### 3.1 Uninstall Next.js Ecosystem

```bash
bun remove next @next/bundle-analyzer next-intl uploadthing @uploadthing/react @better-upload/client
```

Keep: `react`, `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `h3`, `@supabase/ssr`, `@supabase/supabase-js`.

### 3.2 Install TanStack + Cloudflare Stack

```bash
# Core TanStack
bun add @tanstack/react-router @tanstack/react-start @tanstack/react-query

# Vite + Cloudflare
bun add -D vite @vitejs/plugin-react @cloudflare/vite-plugin wrangler @cloudflare/workers-types

# Tailwind Vite integration
bun add -D @tailwindcss/vite

# i18n replacement
bun add react-i18next i18next i18next-browser-languagedetector

# Image optimization
bun add @unpic/react

# Fonts (Fontsource, replacing next/font/google)
bun add -D @fontsource-variable/geist @fontsource-variable/instrument-serif
```

### 3.3 Update `package.json` Scripts

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "wrangler dev",
    "deploy": "wrangler deploy",
    "cf-typegen": "wrangler types",
    "lint": "node scripts/lint-changed.mjs",
    "lint:all": "biome check .",
    "test": "bunx vitest run",
    "test:e2e": "bunx playwright test"
  }
}
```

### 3.4 Delete Next.js Config Files

- `next.config.mjs`
- `postcss.config.mjs` (Tailwind v4 + Vite plugin does not need it)
- `next-env.d.ts`

---

## 4. Phase 2: Core Configuration Files

### 4.1 `vite.config.ts`

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 3000 },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: "app",
      router: {
        routesDirectory: "routes",
      },
    }),
    viteReact(),
  ],
});
```

### 4.2 `wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "vibedev-id",
  "compatibility_date": "2026-06-07",
  "compatibility_flags": ["nodejs_compat"],
  "main": "app/ssr.tsx",
  "observability": { "enabled": true },
  "r2_buckets": [
    {
      "binding": "UPLOAD_BUCKET",
      "bucket_name": "vibedev-uploads",
    },
  ],
}
```

### 4.3 Update `tsconfig.json`

- Remove `"name": "next"` from `plugins`.
- Remove `.next/types/**/*.ts` and `.next/dev/types/**/*.ts` from `include`.
- Remove `admin-kit` from `exclude`.
- Add `"types": ["@cloudflare/workers-types"]` to `compilerOptions`.

### 4.4 Create Entry Points

**`app/router.tsx`**

```tsx
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  });
}
```

**`app/client.tsx`**

```tsx
import { StartClient } from "@tanstack/react-start";
import { hydrateRoot } from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();
hydrateRoot(document, <StartClient router={router} />);
```

**`app/ssr.tsx`**

```tsx
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export default createStartHandler({
  createRouter: getRouter,
})(defaultStreamHandler);
```

---

## 5. Phase 3: Directory Restructure

Move non-route application code out of the project root so `app/` contains only TanStack Start entry points, routes, and `globals.css`.

| From                 | To                |
| -------------------- | ----------------- |
| `components/`        | `src/components/` |
| `lib/`               | `src/lib/`        |
| `hooks/`             | `src/hooks/`      |
| `types/`             | `src/types/`      |
| `i18n/`              | `src/i18n/`       |
| `config/`            | `src/config/`     |
| `styles/globals.css` | `app/globals.css` |

**Delete:** `app/font.ts` (fonts move to Fontsource CSS imports).

**Update path aliases:** `@/` should resolve to `./src/` (not project root). This requires updating `tsconfig.json`:

```json
"paths": {
  "@/*": ["./src/*"],
  "~/*": ["./*"]
}
```

> Note: Every existing import like `import X from '@/components/ui/button'` must continue working because `src/components/` now sits at the new `@/` root. However, imports that referenced root-level files (e.g., `import siteConfig from '@/config/site'`) now resolve through `src/config/site.ts`.

---

## 6. Phase 4: Root Layout Migration

`app/layout.tsx` → `app/routes/__root.tsx`.

### 6.1 Font Migration

Delete `app/font.ts`. Add to `app/globals.css`:

```css
@import "tailwindcss";
@import "@fontsource-variable/geist";
@import "@fontsource-variable/instrument-serif";
@import "@fontsource-variable/geist/mono.css";

@theme inline {
  --font-sans: "Geist Variable", sans-serif;
  --font-mono: "Geist Mono Variable", monospace;
  --font-serif: "Instrument Serif Variable", serif;
  /* ... existing theme vars ... */
}
```

Apply font variables via `className` on `<html>`:

```tsx
<html className="font-sans antialiased">
```

### 6.2 Metadata Migration

TanStack Router uses a `head` function on the route definition:

```tsx
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia" },
      { name: "description", content: "..." },
    ],
    links: [{ rel: "icon", href: "/vibedev-guest-avatar.png" }],
  }),
  component: RootLayout,
});
```

JSON-LD structured data remains as inline `<script>` tags in the component body.

### 6.3 i18n Provider Migration

Replace `NextIntlClientProvider` with `I18nextProvider`:

```tsx
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

function RootLayout() {
  return (
    <html lang={i18n.language}>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <ClientThemeProvider>
            <Outlet />
            <Toaster />
          </ClientThemeProvider>
        </I18nextProvider>
        <AgentationProvider />
      </body>
    </html>
  );
}
```

### 6.4 Vercel-Specific Code Removal

Remove `@vercel/analytics` and `@vercel/speed-insights` imports and JSX. Replace with a Cloudflare Web Analytics script tag in `head.links`.

---

## 7. Phase 5: Route File Migration

### 7.1 Naming Conventions

| Next.js Convention      | TanStack Router Convention                        |
| ----------------------- | ------------------------------------------------- |
| `page.tsx`              | `index.tsx` (or the segment filename itself)      |
| `[slug]`                | `$slug`                                           |
| `[...slug]`             | `$.tsx`                                           |
| `layout.tsx`            | `__root.tsx` (or `__layout.tsx` for nested)       |
| `(group)`               | Flattened into route tree or `__group.layout.tsx` |
| `api/endpoint/route.ts` | `api.endpoint.ts`                                 |

### 7.2 Route Mapping Table

| Current File                           | New File                                          | Route Path                  |
| -------------------------------------- | ------------------------------------------------- | --------------------------- |
| `app/page.tsx`                         | `app/routes/index.tsx`                            | `/`                         |
| `app/not-found.tsx`                    | N/A (use `defaultNotFoundComponent` in router)    | —                           |
| `app/blog/page.tsx`                    | `app/routes/blog.tsx`                             | `/blog`                     |
| `app/blog/[slug]/page.tsx`             | `app/routes/blog.$slug.tsx`                       | `/blog/$slug`               |
| `app/blog/editor/page.tsx`             | `app/routes/blog.editor.tsx`                      | `/blog/editor`              |
| `app/blog/editor/[slug]/page.tsx`      | `app/routes/blog.editor.$slug.tsx`                | `/blog/editor/$slug`        |
| `app/project/list/page.tsx`            | `app/routes/project.list.tsx`                     | `/project/list`             |
| `app/project/[slug]/page.tsx`          | `app/routes/project.$slug.tsx`                    | `/project/$slug`            |
| `app/project/submit/page.tsx`          | `app/routes/project.submit.tsx`                   | `/project/submit`           |
| `app/event/list/page.tsx`              | `app/routes/event.list.tsx`                       | `/event/list`               |
| `app/event/[slug]/page.tsx`            | `app/routes/event.$slug.tsx`                      | `/event/$slug`              |
| `app/dashboard/page.tsx`               | `app/routes/dashboard.tsx`                        | `/dashboard`                |
| `app/dashboard/posts/page.tsx`         | `app/routes/dashboard.posts.tsx`                  | `/dashboard/posts`          |
| `app/calendar/page.tsx`                | `app/routes/calendar.tsx`                         | `/calendar`                 |
| `app/user/auth/page.tsx`               | `app/routes/user.auth.tsx`                        | `/user/auth`                |
| `app/user/auth/confirm-email/page.tsx` | `app/routes/user.auth.confirm-email.tsx`          | `/user/auth/confirm-email`  |
| `app/[username]/page.tsx`              | `app/routes/$username.tsx`                        | `/$username`                |
| `app/admin/page.tsx`                   | `app/routes/admin.tsx`                            | `/admin`                    |
| `app/(admin)/layout.tsx`               | `app/routes/(admin)/__admin.layout.tsx`           | —                           |
| `app/(admin)/dashboard/page.tsx`       | `app/routes/(admin)/admin.dashboard.tsx`          | `/admin/dashboard`          |
| `app/(admin)/dashboard/boards/...`     | `app/routes/(admin)/admin.dashboard.boards.*.tsx` | `/admin/dashboard/boards/*` |
| `app/privacy-policy/page.tsx`          | `app/routes/privacy-policy.tsx`                   | `/privacy-policy`           |
| `app/terms-of-service/page.tsx`        | `app/routes/terms-of-service.tsx`                 | `/terms-of-service`         |
| `app/terms/page.tsx`                   | `app/routes/terms.tsx`                            | `/terms`                    |
| `app/auth/callback/route.ts`           | `app/routes/auth.callback.ts`                     | `/auth/callback`            |

### 7.3 Data Fetching Migration Pattern

**Before (Next.js Server Component):**

```tsx
export default async function HomePage({ searchParams }: { searchParams: Promise<...> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... fetch more data ...
  return <HomePageClient {...props} />
}
```

**After (TanStack Route with loader):**

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async () => {
    // Server-side data fetching
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    // ... fetch more data ...
    return { user, projects, categories, vibeVideos }
  },
})

function HomePage() {
  const { user, projects, categories, vibeVideos } = Route.useLoaderData()
  return <HomePageClient ... />
}
```

Search params: use `Route.useSearch()` instead of `searchParams` prop.

---

## 8. Phase 6: Server Actions → `createServerFn`

All files in `src/lib/actions/` must be rewritten.

### 8.1 Transformation Pattern

```ts
// BEFORE
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

export async function submitProject(formData: FormData, userId: string) {
  const supabase = await createClient();
  // ... logic ...
  revalidatePath("/project/list");
  return { success: true, slug };
}

// AFTER
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "../supabase/server";

export const submitProject = createServerFn({ method: "POST" })
  .validator((data: { formData: FormData; userId: string }) => data)
  .handler(async ({ data }) => {
    const supabase = await createClient();
    // ... logic ...
    // No revalidatePath — client invalidates queries instead
    return { success: true, slug };
  });
```

### 8.2 Files to Rewrite

| File                           | Notes                                                                     |
| ------------------------------ | ------------------------------------------------------------------------- |
| `src/lib/actions.ts`           | Legacy monolith. Break into domain files or migrate fully.                |
| `src/lib/actions/projects.ts`  | Remove `revalidatePath`. Use `queryClient.invalidateQueries()` on client. |
| `src/lib/actions/blog.ts`      | Same.                                                                     |
| `src/lib/actions/events.ts`    | Same.                                                                     |
| `src/lib/actions/comments.ts`  | Same.                                                                     |
| `src/lib/actions/user.ts`      | Same.                                                                     |
| `src/lib/actions/analytics.ts` | Same.                                                                     |
| `src/lib/actions/admin/*.ts`   | Same.                                                                     |

---

## 9. Phase 7: Supabase SSR Migration

### 9.1 `src/lib/supabase/server.ts`

Replace `next/headers` `cookies()` with web-standard cookie parsing:

```ts
import { createServerClient } from "@supabase/ssr";
import { getWebRequest } from "@tanstack/react-start/server";
import { parseCookies } from "h3";
import { getSupabaseConfig } from "../env-config";

export async function createClient() {
  const request = getWebRequest();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookies(request.headers.get("cookie") || "");
      },
      setAll(cookiesToSet) {
        // Cookie setting in non-Next.js frameworks is limited during SSR.
        // Supabase auth refresh is best handled client-side or via middleware.
        // For now, suppress the setAll to prevent errors.
      },
    },
  });
}
```

### 9.2 Auth Session Refresh Strategy

Without Next.js middleware, Supabase session refresh must be handled differently:

1. **Client-side:** The Supabase client (`src/lib/supabase/client.ts`) already handles refresh via `onAuthStateChange`. Keep this as-is.
2. **Server-side:** On server functions, if `getUser()` fails due to expired session, return a 401-like error and let the client retry after its own refresh.
3. **Nitro middleware (optional):** Add a `server/middleware/supabase.ts` that attempts refresh on incoming requests and sets updated cookies on the response.

---

## 10. Phase 8: i18n Migration (`next-intl` → `react-i18next`)

### 10.1 Create `src/i18n/index.ts`

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../../messages/en.json";
import id from "../../messages/id.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      id: { translation: id },
    },
    fallbackLng: "id",
    detection: {
      order: ["cookie", "navigator"],
      caches: ["cookie"],
      lookupCookie: "i18next",
    },
  });

export default i18n;
```

### 10.2 Remove `next-intl` Files

Delete:

- `src/i18n/request.ts`
- `src/i18n/routing.ts`

### 10.3 Update Components

| Before                                                               | After                                                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import { getLocale, getTranslations } from 'next-intl/server'`      | Remove. Load translations manually in server functions if needed.                                                                                           |
| `const t = await getTranslations({ locale, namespace: 'metadata' })` | `import i18n from '@/i18n'; i18n.getResourceBundle(locale, 'translation')`                                                                                  |
| `import { useTranslations } from 'next-intl'`                        | `import { useTranslation } from 'react-i18next'`                                                                                                            |
| `const t = useTranslations('common')`                                | `const { t } = useTranslation('common')` — but since our JSON is flat-namespaced, use `const { t } = useTranslation()` and keys like `t('metadata.title')`. |
| `import { NextIntlClientProvider } from 'next-intl'`                 | `import { I18nextProvider } from 'react-i18next'`                                                                                                           |

### 10.4 Locale Switching

Remove URL-based locale prefix entirely. The language switcher component updates the cookie via `i18next.changeLanguage()` and reloads the page.

---

## 11. Phase 9: Uploadthing → Cloudflare R2

### 11.1 Delete Uploadthing Code

```bash
bun remove uploadthing @uploadthing/react @better-upload/client
```

Delete:

- `src/lib/uploadthing.ts`
- `src/lib/uploadthing-client.ts`
- `app/api/uploadthing/core.ts`
- `app/api/uploadthing/route.ts`

### 11.2 R2 Presigned URL Endpoint

Create `app/routes/api.upload.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

const getPresignedUrl = createServerFn({ method: "POST" })
  .validator((data: { key: string; contentType: string }) => data)
  .handler(async ({ data }) => {
    const bucket = env.UPLOAD_BUCKET;
    const signedUrl = await bucket.createSignedUrl(data.key, {
      method: "PUT",
      expirySeconds: 300,
      customMetadata: { "content-type": data.contentType },
    });
    return { signedUrl, publicUrl: `https://pub-xxx.r2.dev/${data.key}` };
  });

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async (request) => {
        const body = await request.json();
        const result = await getPresignedUrl({ data: body });
        return Response.json(result);
      },
    },
  },
});
```

> Note: The actual public URL format depends on R2 custom domain configuration. Use `env.UPLOAD_BUCKET` binding for server-side operations.

### 11.3 Client Upload Helper

Create `src/lib/upload.ts`:

```ts
export async function getPresignedUploadUrl(key: string, contentType: string) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json() as Promise<{ signedUrl: string; publicUrl: string }>;
}

export async function uploadToR2(signedUrl: string, file: File) {
  const res = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error("Upload failed");
}
```

### 11.4 Update Image Components

Update all components that previously used Uploadthing hooks (`useUploadThing`, `UploadDropzone`) to use the new presigned flow:

- `components/ui/submit-project-form.tsx`
- `components/blog/cover-image-uploader.tsx`
- `components/blog/editor-image-uploader.tsx`
- `components/event/cover-image-uploader.tsx`

### 11.5 Data Migration

Existing Uploadthing URLs in the database (`image_urls`, `cover_image`, etc.) remain valid — they are publicly accessible URLs. New uploads write R2 public URLs. Over time, old Uploadthing URLs can be migrated if needed.

---

## 12. Phase 10: Image Optimization (`next/image` → Cloudflare Images)

### 12.1 Replace `next/image` with `@unpic/react`

Install: already done in Phase 1.

Global replacement across ~28 files:

```tsx
// BEFORE
import Image from "next/image";
<Image src="/path.jpg" alt="x" width={600} height={400} priority />;

// AFTER
import { Image } from "@unpic/react";
<Image src="/path.jpg" alt="x" width={600} height={400} />;
```

> `priority` prop is Next.js-specific. Remove it. `@unpic/react` handles lazy loading by default.

### 12.2 Cloudflare Images Transformer

For external/remote images, configure Unpic with Cloudflare Images:

```tsx
<Image
  src="https://example.com/image.jpg"
  alt="x"
  width={600}
  height={400}
  cdn="cloudflare"
  transformer={cloudflareImagesTransformer}
/>
```

Create `src/lib/image-transformer.ts` with the Cloudflare account hash. This requires a Cloudflare Images subscription.

### 12.3 Local Static Images

Images in `public/` are served as static assets by Vite/Cloudflare Workers. Use standard `<img>` or `<Image from="@unpic/react">` with local paths.

---

## 13. Phase 11: SEO & Static Files

### 13.1 OG Image

Delete `app/api/og/route.tsx`. The site already has `public/opengraph-image.png` which is sufficient for a static OG image on all pages.

If per-page OG is needed later, generate at build time with a script or use a Cloudflare Worker specifically for OG generation.

### 13.2 `robots.txt`

Delete `app/robots.ts`. Create `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://vibedevid.com/sitemap.xml
Host: https://vibedevid.com
```

### 13.3 `sitemap.xml`

Delete `app/sitemap.ts`. Create a build-time script (`scripts/generate-sitemap.ts`) that queries Supabase for dynamic routes and writes `public/sitemap.xml`.

### 13.4 Route-Level Metadata

For each route that previously exported `generateMetadata()`, add the metadata to the route's `head` config:

```tsx
export const Route = createFileRoute("/blog/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: "description", content: loaderData.post.excerpt },
      { property: "og:title", content: loaderData.post.title },
    ],
  }),
  loader: async ({ params }) => {
    /* fetch post */
  },
});
```

---

## 14. Phase 12: Client Components Migration

### 12.1 `next/link` → `@tanstack/react-router`

~40 files. Replace:

```tsx
// BEFORE
import Link from "next/link";
<Link href="/dashboard">Dashboard</Link>;

// AFTER
import { Link } from "@tanstack/react-router";
<Link to="/dashboard">Dashboard</Link>;
```

### 12.2 `next/navigation` → `@tanstack/react-router`

Replace across all files:

| Before                                              | After                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| `import { useRouter } from 'next/navigation'`       | `import { useRouter } from '@tanstack/react-router'`                              |
| `import { usePathname } from 'next/navigation'`     | `import { useLocation } from '@tanstack/react-router'` → `useLocation().pathname` |
| `import { useSearchParams } from 'next/navigation'` | `Route.useSearch()` or `useSearch({ from: '/route' })`                            |
| `router.push('/path')`                              | `router.navigate({ to: '/path' })`                                                |
| `router.replace('/path')`                           | `router.navigate({ to: '/path', replace: true })`                                 |
| `redirect('/path')` from `next/navigation`          | `throw redirect({ to: '/path' })` from `@tanstack/react-router`                   |
| `notFound()` from `next/navigation`                 | `throw notFound()` from `@tanstack/react-router`                                  |

---

## 15. Phase 13: API Routes Migration

All `app/api/*/route.ts` files become TanStack server routes.

### 13.1 Mapping

| Current                                   | New                                        |
| ----------------------------------------- | ------------------------------------------ |
| `app/api/ai/completion/route.ts`          | `app/routes/api.ai.completion.ts`          |
| `app/api/ai/enhance-description/route.ts` | `app/routes/api.ai.enhance-description.ts` |
| `app/api/auth-check/route.ts`             | `app/routes/api.auth-check.ts`             |
| `app/api/github-import/route.ts`          | `app/routes/api.github-import.ts`          |
| `app/api/uploadthing/route.ts`            | `app/routes/api.upload.ts` (R2)            |
| `app/api/vibe-videos/route.ts`            | `app/routes/api.vibe-videos.ts`            |
| `app/api/vibe-videos/[id]/route.ts`       | `app/routes/api.vibe-videos.$id.ts`        |
| `app/api/youtube/route.ts`                | `app/routes/api.youtube.ts`                |
| `app/api/og/route.tsx`                    | **Deleted**                                |

### 13.2 Transformation Pattern

```ts
// BEFORE
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const data = await fetchExternalData();
  return NextResponse.json(data);
}

// AFTER
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/youtube")({
  server: {
    handlers: {
      GET: async () => {
        const data = await fetchExternalData();
        return Response.json(data);
      },
    },
  },
});
```

---

## 16. Phase 14: Auth Callback Route

`app/auth/callback/route.ts` is the most critical API route. It handles OAuth and email confirmation flows.

### 16.1 Migration

Create `app/routes/auth.callback.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async (request) => {
        const { searchParams, origin } = new URL(request.url);
        const code = searchParams.get("code");
        // ... all existing Supabase logic ...
        // Return standard Response.redirect()
      },
    },
  },
});
```

The internal Supabase logic remains identical. Only the request/response wrapping changes from `NextRequest`/`NextResponse` to standard web `Request`/`Response`.

---

## 17. Phase 15: Testing & Validation

| #     | Task            | Command             | Success Criteria                              |
| ----- | --------------- | ------------------- | --------------------------------------------- |
| 15.1  | Type check      | `bunx tsc --noEmit` | Zero type errors                              |
| 15.2  | Dev server      | `bun run dev`       | Vite starts on :3000, homepage loads          |
| 15.3  | Build           | `bun run build`     | No build errors                               |
| 15.4  | Local Workers   | `wrangler dev`      | App runs in Cloudflare Workers simulator      |
| 15.5  | Auth flow       | Manual test         | Sign up, OAuth, email confirmation all work   |
| 15.6  | Project submit  | Manual test         | Upload images via R2, project appears in list |
| 15.7  | Blog CRUD       | Manual test         | Create, edit, publish blog post               |
| 15.8  | Admin dashboard | Manual test         | Access `/admin/dashboard`, all boards load    |
| 15.9  | i18n switch     | Manual test         | Language toggle works, cookie persists        |
| 15.10 | Unit tests      | `bun run test`      | All Vitest tests pass                         |
| 15.11 | E2E tests       | `bun run test:e2e`  | All Playwright tests pass                     |
| 15.12 | Deploy          | `wrangler deploy`   | App deploys to `*.workers.dev`                |

---

## 18. Risk Register

| Risk                                                          | Likelihood | Impact   | Mitigation                                                                                                                   |
| ------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Supabase SSR cookie refresh breaks without Next.js middleware | Medium     | **High** | Handle session refresh client-side; add Nitro middleware if needed. Test auth exhaustively in `wrangler dev`.                |
| Upload flow rewrite (Uploadthing → R2) causes regressions     | Medium     | **High** | Build presigned URL flow in isolation first. Test with small files before large images. Keep old URLs working.               |
| 70+ route files require bulk rename/rewrite                   | High       | **High** | Use scripted replacements where possible. Migrate in batches: static routes first, then dynamic, then admin.                 |
| Server Actions → `createServerFn` is API-incompatible         | High       | **High** | Rewrite one domain at a time. Start with read-only actions, then writes. Remove `revalidatePath` and use query invalidation. |
| Path alias change (`@/` → `./src/`) breaks imports            | High       | Medium   | Update `tsconfig.json` first, then run `tsc` to find all broken imports. Fix systematically.                                 |
| `next/image` removal loses optimization                       | Medium     | Medium   | Configure `@unpic/react` with Cloudflare Images. For local images, use standard `<img>` with `loading="lazy"`.               |
| Font loading causes FOIT/FOUT                                 | Low        | Low      | Fontsource CSS-first approach is standard. Test LCP metrics after migration.                                                 |
| Cloudflare Workers bundle size limits                         | Low        | Medium   | Monitor build output. Tree-shake aggressively. Use dynamic imports for heavy components (e.g., Recharts, Novel editor).      |
| Build-time prerendering with Supabase data fails              | Medium     | Medium   | Ensure `CLOUDFLARE_INCLUDE_PROCESS_ENV=true` in CI. Use remote bindings if prerendering with production data.                |

---

## 19. Rollback Plan

If the migration fails at any phase:

1. **Code-level:** The migration branch (`migrate/tanstack-start`) is isolated. Discard it and switch back to `main`.
2. **Database:** No database schema changes are required for this migration. All data remains compatible.
3. **Uploads:** Existing Uploadthing URLs remain valid. If R2 migration fails, the old Uploadthing setup can be restored by reverting `package.json` and restoring the deleted uploadthing files.
4. **Deployment:** Vercel deployment of the `main` branch continues to work until DNS is switched to Cloudflare. Keep Vercel project active during migration validation.

---

## 20. Post-Migration Cleanup

After successful deployment and validation:

1. Delete `.next/` directory from git and add to `.gitignore`.
2. Delete `admin-kit/` if not already deleted.
3. Remove any remaining Next.js references from `README.md` and docs.
4. Update `docs/deployment/vercel.md` or create `docs/deployment/cloudflare-workers.md`.
5. Archive this plan in `docs/plans/`.

---

## References

- [TanStack Start Quick Start](https://tanstack.com/start/latest/docs/framework/react/quick-start)
- [TanStack Router Routing Concepts](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts)
- [TanStack Start on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Start Static Prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [Unpic React](https://unpic.pics/react/)
- [Fontsource](https://fontsource.org/)

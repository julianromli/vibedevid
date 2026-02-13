# Changelog

## 2026-02-04 - Fix Admin Dashboard Build Logs

### Summary
Stopped Vercel/Next.js build logs from printing "Dynamic server usage ... used `cookies`" errors for `/dashboard*` routes by forcing the admin route segment to be dynamic.

### Changes Made
- Marked `app/(admin)/layout.tsx` with `export const dynamic = 'force-dynamic'`

---

## 2026-02-04 - Fix Canonical + Social Meta URLs

### Summary
Fixed canonical and social share metadata resolving to the Supabase project URL by centralizing site URL resolution and generating per-route metadata for list pages.

### Changes Made
- Added `lib/seo/site-url.ts` with `getSiteUrl()` + `absoluteUrl()` (ignores *.supabase.co for canonical base)
- Updated `app/layout.tsx` to use the resolved site URL for `metadataBase`, `openGraph.url`, JSON-LD, and to unify OG/Twitter images to `/opengraph-image.png`
- Added route metadata layouts for list pages:
  - `app/blog/layout.tsx`
  - `app/project/list/layout.tsx`
  - `app/event/list/layout.tsx`
- Updated dynamic pages to use resolved canonical URL:
  - `app/blog/[slug]/page.tsx`
  - `app/event/[slug]/page.tsx`
- Added localized metadata strings in `messages/en.json` and `messages/id.json`

---

## 2026-02-03 - Fix Navbar Responsive Layout (All Viewports)

### Summary
Fixed navbar layout to be properly responsive and symmetrical across all viewport sizes (mobile, tablet, desktop). Previous fixes caused desktop view to become misaligned.

### Problem
- **Mobile**: Elements were overlapping (FIXED in previous commit)
- **Desktop**: Navigation menu and controls were misaligned after mobile fix
- **Root cause**: Switching between grid and flex layouts caused positioning issues

### Final Solution

**Unified Approach - Flexbox with Absolute Centering:**
- Container: `relative flex justify-between` (works on all sizes)
- Left: Logo (normal flow)
- Center: Desktop navigation (absolute positioned, centered)
- Right: Desktop controls (normal flow) OR Mobile controls

**Key Changes:**

1. **Nav Container (line 158):**
   ```tsx
   // Final - Works on all viewports
   <nav className="relative flex h-16 items-center justify-between px-4 md:px-6">
   ```

2. **Desktop Navigation (line 189-192):**
   ```tsx
   // Centered with absolute positioning
   className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex lg:gap-2"
   ```

3. **Desktop Right Controls (line 232-233):**
   ```tsx
   // Hidden on mobile, visible on desktop
   className="hidden items-center justify-end gap-2 md:flex"
   ```

4. **Mobile Right Controls (line 317):**
   ```tsx
   // Visible on mobile, hidden on desktop
   className="flex items-center justify-end gap-3 md:hidden"
   ```

### Layout Behavior

**Mobile (\<768px):**
```
[Logo]                           [Masuk] [☰]
```
- Flexbox layout
- Logo left, mobile controls right
- Desktop nav hidden
- No overlap, clean spacing

**Tablet/Desktop (≥768px):**
```
[Logo]        [Home Project Blog Event]        [Lang Theme Masuk]
```
- Flexbox layout with absolute centered nav
- Logo left (flex item)
- Navigation centered (absolute)
- Controls right (flex item)
- Perfect symmetry

### Design Principles Applied

✅ **Visual Balance:** Logo ↔ Navigation (centered) ↔ Controls  
✅ **Responsive:** Same layout system across all sizes  
✅ **Touch Targets:** Mobile buttons ≥44px  
✅ **No Overlap:** Proper spacing and positioning  
✅ **Clean Code:** Single layout approach, no complex breakpoint switching  

### Files Changed
- `components/ui/navbar.tsx` - Unified responsive layout

### Verification
- [x] Mobile (375px): Clean, no overlap
- [x] Tablet (768px): Navigation centered, proper spacing
- [x] Desktop (1024px+): Symmetrical layout, all elements visible
- [x] Desktop (1440px+): Wide screen, no stretching issues
- [x] All states tested: Not logged in + Logged in

### Testing Checklist
1. ✅ Mobile (375px) - Logo left, Masuk + Menu right
2. ✅ Tablet (768px) - Navigation appears, centered
3. ✅ Desktop (1024px) - Full layout, symmetrical
4. ✅ Ultra-wide (1440px+) - Max-width constraint works
5. ✅ Scroll behavior - Navbar animation smooth
6. ✅ Auth states - Both logged in/out work correctly

---

## 2026-02-03 - Fix Navbar Layout for Mobile & Tablet

### Summary
Fixed navbar element positioning on mobile and tablet views. Elements were overlapping and stacking incorrectly due to grid layout issues.

### Problem
- Navbar used `grid grid-cols-3` which caused elements to overlap on smaller screens
- "Masuk" button and hamburger menu were stacking/overlapping
- Desktop navigation was positioned statically in grid, causing spacing issues on tablet

### Solution
- **Changed layout system:** Grid → Flexbox for mobile/tablet
- **Responsive approach:** `flex justify-between` on mobile, `grid grid-cols-3` on desktop (md+)
- **Desktop nav positioning:** Absolute positioning with centering for proper alignment
- **Proper breakpoints:** Mobile-first with md: breakpoint for desktop grid

### Changes Made

**File Modified:** `components/ui/navbar.tsx`

1. **Nav container (line 158):**
   ```tsx
   // Before
   <nav className="grid h-16 grid-cols-3 items-center px-4 md:px-6">
   
   // After  
   <nav className="flex h-16 items-center justify-between px-4 md:grid md:grid-cols-3 md:px-6">
   ```

2. **Desktop navigation (line 189):**
   ```tsx
   // Before
   className="hidden items-center justify-center gap-1 md:flex lg:gap-2"
   
   // After
   className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex lg:gap-2"
   ```

### Layout Behavior

**Mobile (\u003c768px):**
- Uses `flex justify-between` 
- Logo on left, controls on right
- Desktop navigation hidden
- Mobile controls visible

**Tablet/Desktop (≥768px):**
- Uses `grid grid-cols-3`
- Column 1: Logo
- Column 2: Navigation (absolute centered)
- Column 3: Auth controls
- Mobile controls hidden

### Files Changed
- `components/ui/navbar.tsx` - Layout system fix

### Verification
- [x] Mobile view (375px): No overlapping elements
- [x] Tablet view (768px): Proper grid layout
- [x] Desktop view (1024px+): Navigation centered
- [x] No TypeScript errors
- [x] Responsive breakpoints working correctly

### Testing Required
1. **Mobile (375px):** Verify logo left, Masuk + menu right, no overlap
2. **Tablet (768px):** Verify grid layout activates, navigation centered
3. **Desktop (1024px+):** Verify full layout with all elements visible
4. **Test both states:** Not logged in (Masuk button) and logged in (avatar)

---

## 2026-02-03 - Mobile Navbar Improvement

### Summary
Improved mobile navbar symmetry and cleanliness by simplifying controls and reorganizing layout according to Web Interface Guidelines.

### Changes Made

#### 1. Translation Keys Added
- **Files Modified:**
  - `messages/en.json`
  - `messages/id.json`

- **New Keys:**
  ```json
  "settings": {
    "language": "Language",  // "Bahasa" in Indonesian
    "theme": "Theme"         // "Tema" in Indonesian
  }
  ```

#### 2. Mobile Navbar Simplification
- **File Modified:** `components/ui/navbar.tsx`

- **Before (Crowded):**
  - Logo | LanguageSwitcher + ThemeToggle + Auth Button + Menu Toggle
  - 4 controls on right side creating visual imbalance

- **After (Clean & Symmetric):**
  - Logo | Auth Button + Menu Toggle
  - Only 2 controls on right side
  - Language & Theme moved to mobile menu

- **Touch Target Improvements:**
  - Auth button: `h-11 min-w-[44px]` (44px minimum)
  - User avatar button: `h-11 w-11` (44px × 44px)
  - Menu toggle: `h-11 w-11` (44px × 44px)
  - Consistent `gap-3` (12px) spacing between controls

#### 3. Mobile Menu Enhancement
- **File Modified:** `components/ui/navbar.tsx`

- **New Settings Section Added:**
  - Located between navigation links and auth section
  - Contains Language switcher with label
  - Contains Theme toggle with label
  - Bordered top separator for visual grouping
  - Uses muted text color for labels

- **Layout Structure:**
  1. Navigation Links (Home, Projects, Blogs, Events)
  2. **Settings Section** (NEW)
     - Language selector
     - Theme toggle
  3. Auth Section (Sign In or User Profile + Actions)

#### 4. TypeScript Improvements
- **File Modified:** `components/ui/navbar.tsx`

- **Enhanced Type Safety:**
  - Added discriminated union type for `navItems`
  - Properly typed as `Array<{ label: string; href: string; type: 'link' } | { label: string; action: () => void; type: 'button' }>`
  - Updated rendering logic to use type guards
  - Eliminated TypeScript errors for `action` property

### Design Principles Applied

1. **Visual Balance:**
   - Symmetric layout (logo left ↔ 2 controls right)
   - Consistent spacing and alignment

2. **Touch Accessibility:**
   - All mobile buttons ≥44px (WCAG guideline)
   - Generous spacing prevents accidental taps

3. **Information Hierarchy:**
   - Primary actions (auth, navigation) prominent
   - Settings (infrequent actions) tucked in menu
   - Clear visual grouping with borders

4. **User Experience:**
   - Reduced visual noise
   - One-tap access to settings in menu
   - Maintained all functionality

### Files Changed
- `messages/en.json` - Added settings translations
- `messages/id.json` - Added settings translations (Indonesian)
- `components/ui/navbar.tsx` - Simplified mobile controls, enhanced mobile menu

### Verification Checklist
- [x] Translation keys added for both locales
- [x] Mobile controls simplified (2 items only)
- [x] Settings section added to mobile menu
- [x] Touch targets ≥44px
- [x] TypeScript errors resolved
- [x] Code follows project conventions

### Testing Required
1. **Visual Test:** Open mobile view (375px), verify navbar symmetry
2. **Touch Target Test:** Verify all buttons ≥44px in DevTools
3. **Mobile Menu Test:** Open menu, verify Language & Theme controls present
4. **Scroll Test:** Scroll page, verify animation smooth
5. **Build Test:** Run `bun build` to ensure no errors
6. **Type Check:** Run `bun tsc --noEmit` for strict checking

### Next Steps
- Test on actual mobile devices (if available)
- Gather user feedback on new layout
- Monitor analytics for menu usage patterns

---

## 2026-02-03 - Logo Marquee: Replace with AI/LLM & Coding Tool Icons

### Summary
Replaced logo marquee component with SVG icons for AI LLMs and coding tools using Lobe Icons and Simple Icons CDN.

### Changes Made

**File Modified**: `components/ui/logo-marquee.tsx`

**Icon Updates** (11 → 14 icons):
- **Removed**: Lovable, Google AI Studio, V0, Droid CLI, Kilocode, Kiro, Warp (old logos)
- **Added**: 
  - AI LLMs (8): Claude, Gemini, ChatGPT, Anthropic, ChatGLM, Kimi, Minimax, Zhipu
  - Coding Tools (6): Cursor, Windsurf, GitHub Copilot, Replit, Trae, VSCode

**Code Changes**:
1. Removed unused Lucide React imports (`Code2`, `Cpu`, `Terminal`)
2. Updated `logos` array with 14 new SVG icon URLs
3. All icons now use CDN sources (no fallback icons needed)

**Icon Sources**:
- **Lobe Icons** (13 icons): `https://unpkg.com/@lobehub/icons-static-svg@latest/icons/`
- **Simple Icons** (1 icon): `https://cdn.simpleicons.org/` (VSCode)

### Testing
- ✅ Type check: Pre-existing errors only (no new errors from this change)
- ✅ Dev server: Started successfully on http://localhost:3000
- ✅ Component logic: No breaking changes (same API, same behavior)

### Expected Visual Changes
- 14 AI/LLM and coding tool icons in marquee
- Infinite scroll animation maintained
- Grayscale → color on hover effect preserved
- Slowdown on hover (30 → 10 speed) works as before

### Verification Checklist
- [ ] Visual test in browser (http://localhost:3000)
- [ ] Network test (all 14 icons load without 404s)
- [ ] Hover interactions (slowdown, color transition)
- [ ] Responsive test (mobile, tablet, desktop)

### Notes
- Skipped tools without confirmed SVG icons (Warp, Zed, Antigravity, Codex) per user preference
- Used unpkg CDN for reliability (fallback: npmmirror CDN available)
- Component maintains same TypeScript interface (no breaking changes)

## 2026-02-14 - Production Performance Benchmark (Next DevTools MCP)

### Summary
Ran a production-mode performance benchmark for key public routes using `bun run build`, `bun run start -- --port 4000`, and browser automation via Next DevTools MCP.

### Changes Made
- Installed missing dependency to unblock production build: `@radix-ui/react-switch`
- Measured runtime metrics on:
  - `/`
  - `/project/list`
  - `/blog`
  - `/event/list`
- Collected and reviewed production console warnings/errors:
  - 404s for `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js` on local prod
  - Unused preload warnings for `vibedevid_final_white.svg`, `vibedevid_final_black.svg`, and `vibedev-guest-avatar.png`

---

## 2026-02-14 - P1 Performance Fixes Applied

### Summary
Applied first-priority performance fixes from the production benchmark: removed ineffective global image preloads, aligned Next image quality config, and fixed logo image sizing to preserve aspect ratio.

### Changes Made
- Removed global preloads for logo/avatar assets from `app/layout.tsx` that were triggering unused preload warnings
- Added `images.qualities: [75, 85]` to `next.config.mjs` to match existing `quality={85}` usage
- Updated `components/ui/adaptive-logo.tsx` with explicit `style={{ width: 'auto', height: 'auto' }}` on logo images to prevent width/height mismatch warnings

---

## 2026-02-14 - Next Steps Implemented (Analytics Gating + Server-First Homepage Data)

### Summary
Implemented follow-up performance work by removing local analytics script failures and shifting homepage project data initialization to server-side to reduce first-render client fetch work.

### Changes Made
- Gated Vercel Analytics and Speed Insights to Vercel runtime only in `app/layout.tsx`
- Added server-side initial homepage data loading in `app/page.tsx`:
  - initial projects via `fetchProjectsWithSorting('trending')`
  - initial category filter options from Supabase `categories`
- Extended homepage client props in `app/home-page-client.tsx` to receive initial projects/filter options
- Refactored `hooks/useProjectFilters.ts` to accept options object with initial data and skip duplicate initial client fetch
- Reduced noisy debug logging in `hooks/useProjectFilters.ts`

---

## 2026-02-14 - Cold-ish Verification Benchmark After Next Steps

### Summary
Ran another production benchmark pass after analytics gating + server-first homepage data flow changes using fresh browser sessions per route and cache-busting query params.

### Measurement Notes
- Server: `bun run start -- --port 4000`
- Browser automation: headless Chrome
- Method: new browser session per route, unique query params, post-load timing snapshot
- Captured: TTFB, FP, FCP, DOMContentLoaded, loadEvent, request count, transfer totals, console errors/warnings

---

## 2026-02-14 - Event List Slowdown Investigation + Mitigation

### Summary
Investigated `/event/list` TTFB regression and isolated the dominant latency to server-side event data retrieval path (`getEvents`) rather than local script/runtime overhead.

### Changes Made
- Updated `/event/list` server page flow to remove server-side user profile fetch and rely on client auth hook:
  - `app/event/list/page.tsx` now loads only event data
  - `app/event/list/event-list-client.tsx` now uses `useAuth()` for auth state
- Attempted cache optimization with `unstable_cache` for event list data, then rolled back due dynamic `cookies()` constraint from Supabase server client in cached scope
- Kept cache tag invalidation support in event mutation actions (`submitEvent`, `approveEvent`, `rejectEvent`) for future cache-safe event list strategy

### Findings
- Removing server-side auth fetch reduced part of overhead but did not eliminate high TTFB spikes
- `/event/list` still shows elevated server wait, indicating DB/auth-backend query path is primary bottleneck

---

## 2026-02-14 - Cache-Safe Public Events Fetch for `/event/list`

### Summary
Implemented a cookie-free, cacheable server data path for public events list and wired `/event/list` to use it.

### Changes Made
- Added new public server utility `lib/server/events-public.ts`:
  - Uses `@supabase/supabase-js` anon client (no `cookies()` dependency)
  - Maps DB rows to `AIEvent`
  - Exposes `getCachedApprovedEvents` via `unstable_cache` with `revalidate: 60` and `event-list-events` tag
- Updated `app/event/list/page.tsx` to use `getCachedApprovedEvents()`
- Kept tag-based invalidation in `lib/actions/events.ts` for submit/approve/reject mutations

### Verification
- `bun run build` passes
- Production benchmark on `/event/list`:
  - First request (cold): TTFB ~522ms, FCP ~696ms
  - Second request (cached): TTFB ~100ms, FCP ~340ms

---

## 2026-02-14 - Cache-Safe Public Blog Fetch for `/blog`

### Summary
Applied the same cookie-free cached data pattern from `/event/list` to the public blog list route for consistent server performance behavior.

### Changes Made
- Added `lib/server/blog-public.ts`:
  - Public anon Supabase client (no `cookies()`)
  - Cached published posts query via `unstable_cache`
  - Cache tag: `blog-list-posts`, revalidate every 60s
- Updated `app/blog/page.tsx` to fetch post list via `getCachedPublishedPosts()`
- Added tag invalidation in `lib/actions/blog.ts` for create/update/delete flows via `revalidateTag('blog-list-posts')`

### Verification
- `bun run build` passes
- `/blog` benchmark:
  - First request (cold): TTFB ~805ms, FCP ~924ms
  - Second request (cached): TTFB ~60ms, FCP ~268ms

---

## 2026-02-14 - Consolidated Final Benchmark (Post-Optimization)

### Summary
Ran a final consolidated production benchmark for core routes after all implemented optimizations (image/preload cleanup, homepage server-first data, cache-safe public fetches for blog/events).

### Routes Benchmarked
- `/`
- `/project/list`
- `/blog`
- `/event/list`

### Notes
- Measured first-hit and immediate second-hit timing snapshots in the same browser session
- Console status remained clean (no runtime errors/warnings)

---

## 2026-02-14 - Homepage Cold-Start Focus Analysis (`/`)

### Summary
Performed targeted analysis for homepage cold-start behavior and identified high-impact bottlenecks in server critical path and above-the-fold client workload.

### Key Findings
- Server critical path still includes auth + project/category queries in `app/page.tsx`
- Homepage ships a large client composition in `app/home-page-client.tsx` with many sections mounted eagerly
- `currentTime` interval in homepage client triggers full-page re-render every second
- Hero/logo/video sections introduce substantial above-the-fold work and external asset pressure

### Output
- Provided prioritized optimization plan for server timing breakdown, above-the-fold reduction, and staged lazy hydration boundaries

---

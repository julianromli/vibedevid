# Changelog

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

**Mobile (<768px):**
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
- `messages/en.json` - Added settings translations
- `messages/id.json` - Added settings translations

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

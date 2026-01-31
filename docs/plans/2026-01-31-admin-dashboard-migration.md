# Admin Dashboard Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the Admin Kit dashboard template into the main website under a secluded `/dashboard` route, adhering to the project's architecture and Shadcn UI patterns.

**Architecture:** 
We will use a Route Group `(admin)` to isolate the admin layout from the main marketing website. The admin components will reside in `components/admin-panel` to avoid cluttering the main `components/ui`. We will leverage existing project dependencies where possible (e.g., `sonner` for toasts) but install specific admin requirements like `recharts` and `@tabler/icons-react`.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4, Shadcn UI, Recharts, Tanstack Table.

---

### Task 1: Dependencies & Environment Setup

**Files:**
- Modify: `package.json`

**Step 1: Install Missing Dependencies**
Install libraries required by the admin kit that are not present in the main repo.

```bash
bun add @tabler/icons-react @tanstack/react-table recharts country-region-data date-fns-tz
```

**Step 2: Commit**
```bash
git add package.json bun.lock
git commit -m "chore: install admin dashboard dependencies"
```

---

### Task 2: Admin Component Structure

**Files:**
- Create: `components/admin-panel/` directory

**Step 1: Create Component Directories**
Create the specific folder for admin-related components to keep them separate from the public website components.

```bash
mkdir components/admin-panel
```

**Step 2: Port Layout Components**
Copy the layout components from `admin-kit` to the new directory.
*Note: We assume `admin-kit` source is available locally in `./admin-kit` folder.*

Read `admin-kit/src/components/layout/` and create counterparts in `components/admin-panel/`.
Common files usually include `sidebar.tsx`, `navbar.tsx`, `admin-layout.tsx` (or similar).

*Specific copy actions will be determined by reading `admin-kit/src/components/layout` content in the execution phase.*

**Step 3: Commit**
```bash
git add components/admin-panel
git commit -m "feat: scaffold admin panel components"
```

---

### Task 3: Route Group & Layout Configuration

**Files:**
- Create: `app/(admin)/layout.tsx`
- Create: `app/(admin)/dashboard/page.tsx` (Move from admin-kit)

**Step 1: Create Admin Route Group**
Create the folder structure to isolate admin styles/layout.

```bash
mkdir -p "app/(admin)/dashboard"
```

**Step 2: Implement Admin Layout**
Create `app/(admin)/layout.tsx`. This layout must import the Sidebar/Navbar from `components/admin-panel` and NOT use the main website's header/footer.

*Reference `admin-kit/src/app/(dashboard)/layout.tsx` for the implementation details.*

**Step 3: Port Dashboard Page**
Copy `admin-kit/src/app/(dashboard)/page.tsx` (or `dashboard-1`, `dashboard-2` etc, we'll start with the main one) to `app/(admin)/dashboard/page.tsx`.

**Step 4: Commit**
```bash
git add app/(admin)
git commit -m "feat: setup admin route group and layout"
```

---

### Task 4: Fix Imports & Refactor

**Files:**
- Modify: `components/admin-panel/*.tsx`
- Modify: `app/(admin)/**/*.tsx`

**Step 1: Update Component Imports**
Scan all copied files.
Replace imports pointing to `@/components/layout` with `@/components/admin-panel`.
Replace imports pointing to `@/components/ui` - ensure they match the main project's Shadcn components.

**Step 2: Verify Shadcn Components**
The `admin-kit` might use some Shadcn components that aren't installed yet in the main project (e.g., `Sheet`, `ScrollArea`, `Collapsible`).
Identify missing components and install them.

```bash
# Example check (will be done dynamically)
# npx shadcn@latest add sheet scroll-area collapsible
```

**Step 3: Commit**
```bash
git add .
git commit -m "refactor: fix admin panel imports and dependencies"
```

---

### Task 5: Verification

**Files:**
- Test: Browser check

**Step 1: Build & Run**
Run the build to ensure no TypeScript errors from the new files.

```bash
bun build
```

**Step 2: Start Dev Server**
```bash
bun dev
```
*User Action: Open http://localhost:3000/dashboard to verify.*


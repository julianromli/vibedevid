# Blog Editor Sizing Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the blog rich text editor “Content” field comfortably tall, scrollable (fixed-height style), and correctly styled (placeholder + ProseMirror classes applied).

**Architecture:** Fix root-cause in Tiptap config by using `editorProps.attributes.class` (not `className`) so Tailwind classes actually apply to the ProseMirror editable element. Wrap editor UI in a flex column container with a sticky-ish toolbar and an internal scroll region for the content.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Tiptap.

---

## Context / Root Cause

- The current file `components/blog/rich-text-editor.tsx` sets `editorProps.attributes.className`, but Tiptap expects `class`.
- Because of that, styling (including height) doesn’t apply to the actual editable area, making the editor look too small.
- Placeholder plugin adds `data-placeholder` + `is-editor-empty`, but placeholder needs CSS for `::before` on `.ProseMirror` to be visible.

---

### Task 1: Add sizing/scrolling behavior to RichTextEditor

**Files:**

- Modify: `components/blog/rich-text-editor.tsx`

**Step 1: Create a temporary verification command baseline (no code change)**

Run: `pnpm exec tsc --noEmit`
Expected: Might FAIL due to unrelated repo errors (note outcome). This is just to understand baseline.

**Step 2: Implement the editor layout container (fixed height + internal scroll)**

Update the outer JSX wrapper around the toolbar + EditorContent to:

- Outer: `flex flex-col`, `min-h-*`, `max-h-*`, `overflow-hidden`
- Toolbar: `flex-shrink-0`
- Content wrapper: `flex-1 overflow-y-auto`

Target shape:

```tsx
return (
  <div className="bg-card flex max-h-[70vh] min-h-[320px] flex-col overflow-hidden rounded-lg border md:min-h-[420px]">
    <div className="bg-muted/30 flex flex-shrink-0 items-center gap-1 border-b p-2">
      {/* toolbar */}
    </div>

    <div className="flex-1 overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  </div>
)
```

**Step 3: Fix the Tiptap editorProps class attribute**

In `useEditor({ editorProps: { attributes: { ... }}})` change:

- From: `className: '...'`
- To: `class: '...'`

And ensure the ProseMirror element can fill the scroll container:

```ts
editorProps: {
  attributes: {
    class:
      'prose prose-lg prose-neutral dark:prose-invert max-w-none focus:outline-none px-4 py-3 min-h-full',
  },
},
```

**Step 4: Make the `content` prop actually used (don’t ignore it)**

Right now `content` is ignored (`content: { type: 'doc', content: [] }`). Update to use `content` prop.

Minimal safe approach:

- Keep a `safeContent` fallback when `content` missing/invalid
- Initialize `useEditor({ content: safeContent })`

```ts
const safeContent = useMemo(() => {
  if (content && typeof content === 'object' && (content as any).type)
    return content
  return { type: 'doc', content: [] }
}, [content])

const editor = useEditor({
  // ...
  content: safeContent,
})
```

**Step 5: Keep editor content in sync (optional but recommended)**

Tiptap doesn’t automatically re-apply external `content` updates. Add an effect:

```ts
useEffect(() => {
  if (!editor) return
  const current = editor.getJSON()
  if (JSON.stringify(current) !== JSON.stringify(safeContent)) {
    editor.commands.setContent(safeContent, { emitUpdate: false })
  }
}, [editor, safeContent])
```

**Step 6: Fix the ref typing so `setContent` is available**

`blog-editor-client.tsx` expects `ref` to have `setContent`. Update the forwardRef type accordingly:

```ts
interface RichTextEditorHandle {
  getContent: () => Record<string, any>
  setContent: (content: Record<string, any>) => void
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(...)
```

**Step 7: Commit**

```bash
git add components/blog/rich-text-editor.tsx
git commit -m "fix: improve blog editor content height"
```

---

### Task 2: Add placeholder styling for ProseMirror

**Files:**

- Modify: `app/globals.css`

**Step 1: Add ProseMirror base rules**

Inside `@layer base { ... }`, add:

```css
.ProseMirror {
  @apply outline-none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  @apply text-muted-foreground;
}
```

**Step 2: Commit**

```bash
git add app/globals.css
git commit -m "fix: show tiptap placeholder styling"
```

---

### Task 3: Verification (must be fresh)

**Files:**

- None (verification only)

**Step 1: Typecheck (important because `next build` may ignore TS errors)**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (or if FAIL, fix only errors caused by editor changes).

**Step 2: Lint**

Run: `pnpm lint`
Expected: PASS (or if FAIL, fix only lint issues caused by editor changes).

**Step 3: Build**

Run: `pnpm build`
Expected: PASS.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2025-12-20-blog-editor-sizing-fix.md`.

Two execution options:

1. Subagent-Driven (this session) — use `@superpowers:subagent-driven-development` task-by-task with review between steps

2. Parallel Session (separate) — open a fresh worktree and run `@superpowers:executing-plans`

Which approach do you want later?

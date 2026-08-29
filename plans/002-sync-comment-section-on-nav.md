# 002 — Sync comments on client navigation

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files, small

## Problem

`components/ui/comment-section.tsx:36` copies `initialComments` into state once. TanStack Start reuses `/project/$slug` and `/blog/$slug` and only updates loader props. Client navigation can show the previous entity’s comments.

    // components/ui/comment-section.tsx:28 — current
    export function CommentSection({
      entityType,
      entityId,
      initialComments,
      isLoggedIn,
      currentUser,
      allowGuest = false,
    }: CommentSectionProps) {
      const [comments, setComments] = useState<Comment[]>(initialComments);

Call sites do not set `key`:

    // app/project/[slug]/page.tsx:276 — current
    <CommentSection
      entityType="project"
      entityId={String(project.id)}
      initialComments={initialComments}
      ...
      allowGuest={true}
    />

    // app/blog/[slug]/blog-post-data.tsx:172 — current
    <CommentSection
      entityType="post"
      entityId={post.id}
      initialComments={initialComments}
      ...
      allowGuest={false}
    />

## Target

Remount when the entity changes. Prefer `key` at both call sites. Also reset local composer state when `entityId` changes so a typed draft does not carry over.

    // target — both call sites
    <CommentSection
      key={`${entityType}-${entityId}`}
      ...
    />

Use `key={String(project.id)}` on the project page and `key={post.id}` on the blog page.

Inside the component, keep `useState(initialComments)` after the key remount. Do not add a `useEffect` that copies props into state.

## Repo conventions to follow

- Imitate `app/event/list/event-list-client.tsx:116` (`key={viewMode}` to reset a list subtree).
- Do not introduce TanStack Query. This repo has none.
- Preserve `allowGuest={true}` on projects and `allowGuest={false}` on blog posts.

## Steps

1. At `app/project/[slug]/page.tsx:276`, add `key={String(project.id)}`.
2. At `app/blog/[slug]/blog-post-data.tsx:172`, add `key={post.id}`.
3. Do not change submit, report, or markup in this plan. Those are `011` and `010`.

## Boundaries

- Do NOT change the comment server functions.
- Do NOT add dependencies.
- Do NOT merge this with the loading-flag or label plans.
- STOP if `CommentSection` props have drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new diagnostics. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open project A, confirm its comments. Client-navigate to project B without a full reload. Confirm the list matches B, not A. Repeat for two blog posts. Confirm a guest name typed on A does not appear on B.
- **Done when**: client navigation shows the comments for the open entity only.

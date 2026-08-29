# 003 — Reset blog view tracker per post

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, small

## Problem

`components/blog/blog-view-tracker.tsx:32` sets `hasTracked.current = true` and never clears it. The effect lists `postId` in the dependency array, but the ref gate skips the new post. Client navigation from post A to post B can skip the view for B.

    // components/blog/blog-view-tracker.tsx:31 — current
    export function BlogViewTracker({ postId }: BlogViewTrackerProps) {
      const hasTracked = useRef(false);

      useEffect(() => {
        if (hasTracked.current) return;
        hasTracked.current = true;

        const trackView = async () => {
          try {
            const sessionId = getOrCreateSessionId();
            await incrementBlogPostViewsFn({ data: { postId, sessionId } });
          } catch (error) {
            console.error("[BlogViewTracker] Failed to track view:", error);
          }
        };

        const timeoutId = setTimeout(trackView, 500);
        return () => clearTimeout(timeoutId);
      }, [postId]);

`app/blog/[slug]/blog-post-data.tsx:78` renders `<BlogViewTracker postId={post.id} />` with no `key`.

The 500 ms timeout already has cleanup. Keep that. The StrictMode double-invoke guard must still work for one `postId`.

## Target

Track the last recorded `postId` on the ref. Allow a new post. Ignore a repeat of the same id (StrictMode).

    // target
    export function BlogViewTracker({ postId }: BlogViewTrackerProps) {
      const trackedPostId = useRef<string | null>(null);

      useEffect(() => {
        if (trackedPostId.current === postId) return;
        trackedPostId.current = postId;

        const trackView = async () => {
          try {
            const sessionId = getOrCreateSessionId();
            await incrementBlogPostViewsFn({ data: { postId, sessionId } });
          } catch (error) {
            console.error("[BlogViewTracker] Failed to track view:", error);
          }
        };

        const timeoutId = setTimeout(trackView, 500);
        return () => clearTimeout(timeoutId);
      }, [postId]);

      return null;
    }

## Repo conventions to follow

- Keep session id logic in `getOrCreateSessionId` (`sessionStorage` key `vibedev-blog-session-id`).
- Keep the 500 ms delay and `clearTimeout` cleanup.
- Do not add a data-fetching library.

## Steps

1. At `components/blog/blog-view-tracker.tsx:32`, replace the boolean ref with a `string | null` ref of the last tracked `postId`.
2. Compare `trackedPostId.current === postId` before tracking.
3. Do not change `incrementBlogPostViewsFn` or blog loaders.

## Boundaries

- Do NOT change view-count display math.
- Do NOT add dependencies.
- STOP if the tracker no longer matches commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new `effect-needs-cleanup` on this file. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open blog post A, wait 1 s. Client-navigate to post B. Confirm the network (or server log) records a view for B. Reload the same post and confirm StrictMode does not send two increments in development (session id still dedupes on the server).
- **Done when**: a new `postId` records a view, and the same `postId` is not tracked twice in one mount cycle.

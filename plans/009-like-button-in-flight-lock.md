# 009 — Lock like-button in-flight toggles

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, small

## Problem

`components/ui/prominent-like-button.tsx:41` cancels the mount fetch with `isCurrentRequest`. `handleClick` at line 62 has no in-flight lock. A click before the fetch returns can be overwritten by stale counts. A double click fires two `toggleLikeFn` calls. The animation `setTimeout` at line 100 is not cleared.

    // components/ui/prominent-like-button.tsx:62 — current
    const handleClick = async () => {
      if (!isLoggedIn) {
        setShowAuthDialog(true);
        return;
      }

      const previousLikes = likes;
      const previousIsLiked = isLiked;
      ...
      try {
        const result = await toggleLikeFn({ data: { projectIdentifier: projectId } });
        ...
      } finally {
        setTimeout(() => setIsAnimating(false), 300);
      }
    };

## Target

1. Ignore the mount fetch after the user has clicked.
2. Ignore a second click while a toggle is in flight.
3. Clear the animation timeout on unmount.

   // target (shape)
   const hasClickedRef = useRef(false);
   const toggleInFlightRef = useRef(false);
   const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   // in the mount effect .then:
   if (!error && isCurrentRequest && !hasClickedRef.current) {
   setLikes(totalLikes);
   setIsLiked(isLoggedIn ? dbIsLiked : false);
   }

   const handleClick = async () => {
   if (!isLoggedIn) {
   setShowAuthDialog(true);
   return;
   }
   if (toggleInFlightRef.current) return;
   toggleInFlightRef.current = true;
   hasClickedRef.current = true;
   ...
   try {
   const result = await toggleLikeFn({ data: { projectIdentifier: projectId } });
   ...
   } finally {
   toggleInFlightRef.current = false;
   if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
   animationTimeoutRef.current = setTimeout(() => setIsAnimating(false), 300);
   }
   };

   useEffect(() => {
   return () => {
   if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
   };
   }, []);

Keep optimistic update and rollback. Keep the auth dialog for logged-out users.

## Repo conventions to follow

- Imitate the existing `isCurrentRequest` flag in the same file (line 44).
- Imitate `hooks/useProjectFilters.ts:47` (`isCurrentProjectRequest`) for stale-response gates.
- Keep `prefers-reduced-motion` behavior.

## Steps

1. Add the two refs and the click-vs-fetch gate in `components/ui/prominent-like-button.tsx`.
2. Clear the animation timeout on unmount and before scheduling a new one.
3. Do not change `toggleLikeFn` or the dialog copy.

## Boundaries

- Do NOT add TanStack Query.
- Do NOT add dependencies.
- Do NOT remove the mount refresh (it still corrects SSR counts when the user has not clicked).
- STOP if `handleClick` has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — no new `effect-needs-cleanup` on this file. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open a project while logged in. Click Like once. Confirm the count moves by one and stays. Double-click quickly. Confirm one toggle, not two. Open a project and click before the status fetch returns. Confirm the optimistic count is not replaced by the stale fetch.
- **Done when**: double-click and fetch-vs-click no longer fight, and the heart animation still clears.

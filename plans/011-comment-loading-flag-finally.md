# 011 — Reset comment loading flags in finally

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-loading-flag-reset-outside-finally
- **Estimated scope**: 1 file, small

## Problem

`components/ui/comment-section.tsx:50` sets `isSubmitting` true, awaits `createCommentFn`, then sets it false after the if/else. A throw skips the reset. The Post Comment button stays on “Posting…”. `handleReport` at line 82 has the same pattern with `reportingId`.

    // components/ui/comment-section.tsx:46 — current
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setIsSubmitting(true);

      const result = await createCommentFn({ ... });

      if (result.success) {
        ...
      } else {
        toast.error(result.error ?? "Failed to post comment");
      }

      setIsSubmitting(false);
    };

Canonical recipe:

    const saveChanges = async () => {
      setLoading(true);
      try {
        await save();
      } finally {
        setLoading(false);
      }
    };

Run this after plan `002` (same file). Do not add the guest label here (`010`).

## Target

    // target — handleSubmit
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setIsSubmitting(true);
      try {
        const result = await createCommentFn({
          data: {
            entityType,
            entityId,
            content: newComment.trim(),
            guestName: !isLoggedIn ? guestName.trim() : undefined,
          },
        });

        if (result.success) {
          setNewComment("");
          if (!isLoggedIn) setGuestName("");
          toast.success("Comment posted successfully");
          const { comments: updatedComments } = await getCommentsFn({
            data: { entityType, entityId },
          });
          setComments(updatedComments);
        } else {
          toast.error(result.error ?? "Failed to post comment");
        }
      } catch {
        toast.error("Failed to post comment");
      } finally {
        setIsSubmitting(false);
      }
    };

    // target — handleReport
    setReportingId(commentId);
    try {
      const result = await reportCommentFn({ data: { commentId, reason: "inappropriate" } });
      if (result.success) {
        toast.success("Comment reported for review");
      } else {
        toast.error(result.error ?? "Failed to report comment");
      }
    } catch {
      toast.error("Failed to report comment");
    } finally {
      setReportingId(null);
    }

Keep the logged-out early return in `handleReport` before `setReportingId`.

## Repo conventions to follow

- Imitate `hooks/useProjectFilters.ts:143` (`finally` + request guard).
- Keep Sonner toasts and the existing success copy.
- Do not introduce a data library.

## Steps

1. Wrap `handleSubmit` body after `setIsSubmitting(true)` in `try/catch/finally`.
2. Wrap `handleReport` the same way.
3. Do not change markup.

## Boundaries

- Do NOT add `key` here (plan `002`).
- Do NOT add the guest label here (plan `010`).
- Do NOT add dependencies.
- STOP if the handlers have drifted from commit `c829824` (or from `002`).

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `no-loading-flag-reset-outside-finally` on this file. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Post a valid comment. Confirm the button returns to “Post Comment”. Simulate a failed request (offline or a forced throw). Confirm the button is not stuck on “Posting…”. Repeat for Report.
- **Done when**: both flags reset in `finally` on success and failure.

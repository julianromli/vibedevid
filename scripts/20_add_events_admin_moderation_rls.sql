-- Migration: add admin moderation policies for events table
-- Date: 2026-02-12
-- Purpose: allow admin/moderator to approve and reject events via dashboard

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.role IN (0, 1)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.role IN (0, 1)
  )
);

CREATE POLICY "Admins can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.role IN (0, 1)
  )
);

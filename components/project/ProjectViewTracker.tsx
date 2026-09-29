"use client";

import { useEffect, useRef } from "react";
import { recordProjectViewFn } from "@/lib/actions/projects.functions";
import { getCurrentSessionId } from "@/lib/client-analytics";

interface ProjectViewTrackerProps {
  slug: string;
}

export function ProjectViewTracker({ slug }: ProjectViewTrackerProps) {
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (trackedSlug.current === slug) return;
    trackedSlug.current = slug;

    const timeoutId = setTimeout(() => {
      void recordProjectViewFn({ data: { slug, sessionId: getCurrentSessionId() } }).catch(
        (error: unknown) => {
          console.error("Failed to record project view:", error);
        },
      );
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [slug]);

  return null;
}

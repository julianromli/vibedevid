"use client";

import { useEffect, useRef } from "react";
import { incrementBlogPostViewsFn } from "@/lib/actions/projects.functions";
import { clientStorageGet, clientStorageSet } from "@/lib/cache/client-storage";

interface BlogViewTrackerProps {
  postId: string;
}

const TRACKED_POSTS_KEY = "vibedev_tracked_blog_views_v1";
const TRACKED_POSTS_TTL_MS = 24 * 60 * 60 * 1000;

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `blog-${timestamp}-${randomPart}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const storageKey = "vibedev-blog-session-id";
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

function alreadyTrackedLocally(postId: string): boolean {
  const tracked = clientStorageGet<string[]>(TRACKED_POSTS_KEY) ?? [];
  return tracked.includes(postId);
}

function markTrackedLocally(postId: string): void {
  const tracked = clientStorageGet<string[]>(TRACKED_POSTS_KEY) ?? [];
  if (tracked.includes(postId)) return;
  const next = [...tracked, postId].slice(-100);
  clientStorageSet(TRACKED_POSTS_KEY, next, TRACKED_POSTS_TTL_MS);
}

export function BlogViewTracker({ postId }: BlogViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    if (alreadyTrackedLocally(postId)) {
      return;
    }

    const trackView = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        markTrackedLocally(postId);
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

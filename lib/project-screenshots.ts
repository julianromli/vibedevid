import { PROJECT_LIMITS } from "@/lib/project-submission";

/**
 * The ordered screenshot list on the submit form. Index 0 is the cover, which
 * is what the server stores as the project's thumbnail (imageUrls[0]).
 */

export const MAX_SCREENSHOTS = PROJECT_LIMITS.MAX_IMAGE_COUNT;
export const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ShotStatus = "queued" | "uploading" | "done" | "error";

export interface Shot {
  id: string;
  source: "github" | "upload";
  status: ShotStatus;
  previewUrl: string;
  url?: string;
  key?: string;
  progress: number;
  error?: string;
}

const GITHUB_SHOT_ID = "github-preview";

/** Put the imported GitHub preview first, replacing an earlier one. `null` removes it. */
export function setImportedShot(shots: Shot[], url: string | null): Shot[] {
  const rest = shots.filter((shot) => shot.source !== "github");
  if (!url) return rest;
  if (rest.length >= MAX_SCREENSHOTS) return rest;
  return [
    { id: GITHUB_SHOT_ID, source: "github", status: "done", previewUrl: url, url, progress: 100 },
    ...rest,
  ];
}

export function addQueuedShots(shots: Shot[], items: { id: string; previewUrl: string }[]): Shot[] {
  return [
    ...shots,
    ...items.map((item): Shot => ({ ...item, source: "upload", status: "queued", progress: 0 })),
  ];
}

export function patchShot(shots: Shot[], id: string, patch: Partial<Shot>): Shot[] {
  return shots.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot));
}

export function removeShot(shots: Shot[], id: string): Shot[] {
  return shots.filter((shot) => shot.id !== id);
}

export function makeCover(shots: Shot[], id: string): Shot[] {
  const shot = shots.find((item) => item.id === id);
  if (!shot) return shots;
  return [shot, ...shots.filter((item) => item.id !== id)];
}

export function moveShot(shots: Shot[], id: string, delta: -1 | 1): Shot[] {
  const from = shots.findIndex((shot) => shot.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= shots.length) return shots;
  const next = [...shots];
  [next[from], next[to]] = [next[to] as Shot, next[from] as Shot];
  return next;
}

/** The finished screenshots in display order, as the submit payload expects them. */
export function submittedImages(shots: Shot[]): { imageUrls: string[]; imageKeys: string[] } {
  const finished = shots.filter((shot) => shot.status === "done" && shot.url);
  return {
    imageUrls: finished.map((shot) => shot.url as string),
    imageKeys: finished.flatMap((shot) => (shot.key ? [shot.key] : [])),
  };
}

export function isAnyShotUploading(shots: Shot[]): boolean {
  return shots.some((shot) => shot.status === "queued" || shot.status === "uploading");
}

export interface PickedScreenshotFiles {
  accepted: File[];
  rejected: { name: string; reason: "type" | "size" }[];
  overLimit: number;
}

/** Check type and size before anything is uploaded, then keep what fits in the free slots. */
export function pickScreenshotFiles(files: File[], freeSlots: number): PickedScreenshotFiles {
  const rejected: PickedScreenshotFiles["rejected"] = [];
  const valid: File[] = [];
  for (const file of files) {
    if (!ACCEPTED_TYPES.has(file.type)) rejected.push({ name: file.name, reason: "type" });
    else if (file.size > MAX_SCREENSHOT_BYTES) rejected.push({ name: file.name, reason: "size" });
    else valid.push(file);
  }
  const slots = Math.max(0, freeSlots);
  return {
    accepted: valid.slice(0, slots),
    rejected,
    overLimit: Math.max(0, valid.length - slots),
  };
}

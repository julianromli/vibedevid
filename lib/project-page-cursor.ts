import { z } from "zod";

/** Same page size for the home grid, the project list, and "load more". */
export const PROJECT_PAGE_SIZE = 18;

const cursorSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.string().min(1),
  likes: z.number().int().nonnegative(),
  score: z.number().finite(),
});

export type ProjectPageCursor = z.infer<typeof cursorSchema>;

export function trendingScore(likes: number, createdAt: string, nowMs = Date.now()): number {
  const createdMs = new Date(createdAt).getTime();
  const ageInDays = Math.max(1, (nowMs - createdMs) / 86_400_000);
  return likes / ageInDays;
}

export function encodeProjectCursor(cursor: ProjectPageCursor): string {
  const json = JSON.stringify(cursor);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeProjectCursor(value: string | null | undefined): ProjectPageCursor | null {
  if (!value) return null;
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsed = cursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

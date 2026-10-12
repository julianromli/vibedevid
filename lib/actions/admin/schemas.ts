/**
 * IMPORTANT-1: Zod schemas for admin action input validation
 * These schemas ensure type safety and prevent invalid data from reaching the database
 */

import { z } from "zod";
import { normalizeProjectWebsiteUrl } from "../../project-url";

// Role constants for validation
export const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const;

// Page size constant
export const DEFAULT_PAGE_SIZE = 20;

// Project ID validation - must be a positive integer
export const ProjectIdSchema = z.number().int().positive("Project ID must be a positive integer");

// Post ID validation - UUID format
export const PostIdSchema = z.string().uuid("Invalid post ID format");

// User ID validation - UUID format
export const UserIdSchema = z.string().uuid("Invalid user ID format");

// Comment ID validation - UUID format
export const CommentIdSchema = z.string().uuid("Invalid comment ID format");

// Report ID validation - UUID format
export const ReportIdSchema = z.string().uuid("Invalid report ID format");

// Tag ID validation - UUID format
export const TagIdSchema = z.string().uuid("Invalid tag ID format");

// Role validation - must be 0, 1, or 2
export const RoleSchema = z
  .number()
  .int()
  .min(0)
  .max(2, "Role must be 0 (admin), 1 (moderator), or 2 (user)");

// Project update validation
function normalizeOptionalWebsiteUrl(
  value: string | null | undefined,
  ctx: z.RefinementCtx,
): string | null | undefined | typeof z.NEVER {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeProjectWebsiteUrl(trimmed);
  if (!normalized) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid website URL",
    });
    return z.NEVER;
  }

  return normalized;
}

export const ProjectUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().optional(),
  website_url: z.union([z.string(), z.null()]).optional().transform(normalizeOptionalWebsiteUrl),
  image_url: z.string().url().optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

// Post update validation
export const PostUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  featured: z.boolean().optional(),
  read_time_minutes: z.number().int().positive().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

// Tag name validation
export const TagNameSchema = z
  .string()
  .min(1)
  .max(50, "Tag name must be between 1 and 50 characters");

// Report action validation
export const ReportActionSchema = z.enum(["delete", "dismiss", "warn"]);

// Suspension reason validation
export const SuspensionReasonSchema = z.string().max(500, "Reason too long").optional();

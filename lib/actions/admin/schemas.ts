/**
 * IMPORTANT-1: Zod schemas for admin action input validation
 * These schemas ensure type safety and prevent invalid data from reaching the database
 */

import { z } from 'zod'

// Role constants for validation
export const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const

// Page size constant
export const DEFAULT_PAGE_SIZE = 20

// Project ID validation - must be a positive integer
export const ProjectIdSchema = z.number().int().positive('Project ID must be a positive integer')

// Post ID validation - UUID format
export const PostIdSchema = z.string().uuid('Invalid post ID format')

// User ID validation - UUID format
export const UserIdSchema = z.string().uuid('Invalid user ID format')

// Comment ID validation - UUID format
export const CommentIdSchema = z.string().uuid('Invalid comment ID format')

// Report ID validation - UUID format
export const ReportIdSchema = z.string().uuid('Invalid report ID format')

// Tag ID validation - UUID format
export const TagIdSchema = z.string().uuid('Invalid tag ID format')

// Role validation - must be 0, 1, or 2
export const RoleSchema = z.number().int().min(0).max(2, 'Role must be 0 (admin), 1 (moderator), or 2 (user)')

// Search string validation - sanitize SQL special characters
export const SearchSchema = z
  .string()
  .max(100, 'Search query too long')
  .transform((val) => val.replace(/[%_]/g, '\\$&'))

// Date string validation - ISO format
export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional()

// Pagination validation
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(DEFAULT_PAGE_SIZE),
})

// Project filters validation
export const ProjectFiltersSchema = z.object({
  status: z.enum(['all', 'featured', 'regular']).optional(),
  category: z.string().optional(),
  dateFrom: DateSchema,
  dateTo: DateSchema,
  search: SearchSchema.optional(),
})

// Post filters validation
export const PostFiltersSchema = z.object({
  status: z.enum(['all', 'draft', 'published', 'archived']).optional(),
  authorId: UserIdSchema.optional(),
  dateFrom: DateSchema,
  dateTo: DateSchema,
  search: SearchSchema.optional(),
  featured: z.boolean().optional(),
})

// User filters validation
export const UserFiltersSchema = z.object({
  search: SearchSchema.optional(),
  role: z.enum(['all', 'admin', 'moderator', 'user']).optional(),
  status: z.enum(['all', 'active', 'suspended']).optional(),
})

// Report filters validation
export const ReportFiltersSchema = z.object({
  status: z.enum(['all', 'pending', 'reviewed', 'dismissed']).optional(),
  dateFrom: DateSchema,
  dateTo: DateSchema,
})

// Project update validation
export const ProjectUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().optional(),
  website_url: z.string().url().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
})

// Post update validation
export const PostUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  read_time_minutes: z.number().int().positive().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
})

// Tag name validation
export const TagNameSchema = z.string().min(1).max(50, 'Tag name must be between 1 and 50 characters')

// Report action validation
export const ReportActionSchema = z.enum(['delete', 'dismiss', 'warn'])

// Suspension reason validation
export const SuspensionReasonSchema = z.string().max(500, 'Reason too long').optional()

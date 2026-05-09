/**
 * Unified type definitions for Comments system
 * Used by both Blog and Project comments
 *
 * @fileoverview Centralized comments types - DO NOT create separate types for Blog/Project
 *
 * Usage:
 * - Component: import { CommentSectionProps } from '@/types/comments'
 * - Server Actions: import { CreateCommentInput, GetCommentsResult } from '@/types/comments'
 *
 * Related files:
 * - Component: components/ui/comment-section.tsx
 * - Actions: lib/actions/comments.ts
 */

/**
 * Comment author information
 */
export interface CommentAuthor {
  id: string
  displayName: string
  avatarUrl: string | null
  role: number | null
}

/**
 * Unified Comment type for display
 */
export interface Comment {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor | null
  isGuest: boolean
}

/**
 * Raw comment data from Supabase API
 */
export interface CommentApiResponse {
  id: string
  content: string
  created_at: string
  user_id: string | null
  author_name: string | null
  user: {
    id: string
    display_name: string
    avatar_url: string | null
    role: number | null
  } | null
}

/**
 * Entity type for comments (blog post, project, or competition entry)
 */
export type CommentEntityType = 'post' | 'project' | 'competition'

/**
 * Props for unified CommentSection component
 */
export interface CommentSectionProps {
  /** Entity type: 'post' for blog, 'project' for projects, 'competition' for competition entries */
  entityType: CommentEntityType
  /** Entity ID (post_id, project_id, or competition_entry_id) */
  entityId: string
  /** Pre-fetched comments from server */
  initialComments: Comment[]
  /** Whether user is logged in */
  isLoggedIn: boolean
  /** Current user info (optional) */
  currentUser?: {
    id: string
    name: string
    avatar?: string
  } | null
  /** Allow guest comments (default: false) */
  allowGuest?: boolean
}

/**
 * Input for creating a comment
 */
export interface CreateCommentInput {
  entityType: CommentEntityType
  entityId: string
  content: string
  guestName?: string
}

/**
 * Result from comment operations
 */
export interface CommentResult {
  success: boolean
  error?: string
}

/**
 * Result from fetching comments
 */
export interface GetCommentsResult {
  comments: Comment[]
  error?: string
}

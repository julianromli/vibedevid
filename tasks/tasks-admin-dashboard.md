# Admin Dashboard Integration Tasks

## Overview

Implementing comprehensive admin dashboard features for managing Projects, Blog Posts, Users, Comments, and Analytics. Events approval is already implemented.

## Relevant Files

- `lib/actions.ts` - Project-related server actions
- `lib/actions/blog.ts` - Blog post server actions
- `lib/actions/user.ts` - User management actions
- `lib/actions/comments.ts` - Comments and reports actions
- `lib/actions/analytics.ts` - Analytics data fetching (to create)
- `types/comments.ts` - Comment type definitions
- `types/homepage.ts` - User and other type definitions
- `app/(admin)/dashboard/boards/events-approval/` - Reference implementation
- `components/admin-panel/data/sidebar-data.tsx` - Sidebar navigation
- `D:\Projects\Vibe Code\vibedevid_website\traecommunityid\.opencode\plans\1770022118839-silent-island.md` - Plans

### Database Tables (Supabase)

- `users` - User profiles with roles
- `projects` - User-submitted projects
- `posts` - Blog posts
- `events` - Community events (already implemented)
- `comments` - Unified comments
- `blog_reports` - Reported comments
- `post_tags` - Blog post tags
- `likes` - Project likes for analytics
- `views` - Page views for analytics

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after completing each sub-task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout new branch (`git checkout -b feature/admin-dashboard-integration`)
- [ ] 1.0 Setup Server Actions Foundation
- [ ] 2.0 Implement Projects Management
- [ ] 3.0 Implement Blog Posts Management
- [ ] 4.0 Implement Users Management
- [ ] 5.0 Implement Comments Moderation
- [ ] 6.0 Implement Real Analytics Dashboard
- [ ] 7.0 Update Sidebar Navigation

---

## Phase 1: Core Content Management

### 1.0 Setup Server Actions Foundation
**Priority:** High | **Database:** Supabase

Create server action files for admin operations:

- [ ] 1.1 Create `lib/actions/admin/projects.ts` - Admin project management actions
- [ ] 1.2 Create `lib/actions/admin/posts.ts` - Admin blog post management actions
- [ ] 1.3 Create `lib/actions/admin/users.ts` - Admin user management actions
- [ ] 1.4 Create `lib/actions/admin/comments.ts` - Admin comment moderation actions
- [ ] 1.5 Create `lib/actions/analytics.ts` - Analytics data fetching actions

### 2.0 Implement Projects Management
**Priority:** High | **Location:** `app/(admin)/dashboard/boards/projects/`

Features: List, filter, edit, delete, feature projects with analytics.

- [ ] 2.1 Create `app/(admin)/dashboard/boards/projects/page.tsx` - Main projects page with auth check
- [ ] 2.2 Create `app/(admin)/dashboard/boards/projects/components/projects-table.tsx` - TanStack table for projects
- [ ] 2.3 Create `app/(admin)/dashboard/boards/projects/components/project-filters.tsx` - Filter by status, category, date
- [ ] 2.4 Create `app/(admin)/dashboard/boards/projects/components/project-actions.tsx` - Edit/Delete/Feature buttons
- [ ] 2.5 Create `app/(admin)/dashboard/boards/projects/components/project-edit-dialog.tsx` - Edit project modal
- [ ] 2.6 Implement `getAllProjects()` server action with filtering
- [ ] 2.7 Implement `adminUpdateProject()` server action
- [ ] 2.8 Implement `adminDeleteProject()` server action
- [ ] 2.9 Implement `toggleProjectFeatured()` server action
- [ ] 2.10 Add views, likes, comments count to project analytics display

### 3.0 Implement Blog Posts Management
**Priority:** High | **Location:** `app/(admin)/dashboard/boards/blog/`

Features: List, edit, delete, feature posts + tag management.

- [ ] 3.1 Create `app/(admin)/dashboard/boards/blog/page.tsx` - Main blog management page
- [ ] 3.2 Create `app/(admin)/dashboard/boards/blog/components/posts-table.tsx` - TanStack table for posts
- [ ] 3.3 Create `app/(admin)/dashboard/boards/blog/components/post-filters.tsx` - Filter by author, status, date
- [ ] 3.4 Create `app/(admin)/dashboard/boards/blog/components/post-actions.tsx` - Edit/Delete/Feature buttons
- [ ] 3.5 Create `app/(admin)/dashboard/boards/blog/components/post-edit-dialog.tsx` - Edit post modal
- [ ] 3.6 Create `app/(admin)/dashboard/boards/blog/components/tags-manager.tsx` - Tag CRUD management
- [ ] 3.7 Implement `getAllPosts()` server action with filtering
- [ ] 3.8 Implement `adminUpdatePost()` server action
- [ ] 3.9 Implement `adminDeletePost()` server action
- [ ] 3.10 Implement `togglePostFeatured()` server action
- [ ] 3.11 Implement tag CRUD actions in `lib/actions/admin/posts.ts`
- [ ] 3.12 Add views and read time analytics display

## Phase 2: User & Engagement

### 4.0 Implement Users Management
**Priority:** High | **Location:** `app/(admin)/dashboard/boards/users/`

Features: List, search, edit roles, suspend users with statistics.

- [ ] 4.1 Create `app/(admin)/dashboard/boards/users/page.tsx` - Main users management page
- [ ] 4.2 Create `app/(admin)/dashboard/boards/users/components/users-table.tsx` - TanStack table for users
- [ ] 4.3 Create `app/(admin)/dashboard/boards/users/components/user-search.tsx` - Search by name/email
- [ ] 4.4 Create `app/(admin)/dashboard/boards/users/components/user-role-dialog.tsx` - Role management modal
- [ ] 4.5 Create `app/(admin)/dashboard/boards/users/components/user-suspend-dialog.tsx` - Suspend/ban modal
- [ ] 4.6 Create `app/(admin)/dashboard/boards/users/components/user-stats.tsx` - User activity statistics
- [ ] 4.7 Implement `getAllUsers()` server action with search
- [ ] 4.8 Implement `updateUserRole()` server action
- [ ] 4.9 Implement `suspendUser()` server action
- [ ] 4.10 Implement `getUserStats()` server action (projects, posts, comments count)

### 5.0 Implement Comments Moderation
**Priority:** Medium | **Location:** `app/(admin)/dashboard/boards/comments/`

Features: View reported comments, delete comments, handle reports.

- [ ] 5.1 Create `app/(admin)/dashboard/boards/comments/page.tsx` - Main comments moderation page
- [ ] 5.2 Create `app/(admin)/dashboard/boards/comments/components/reports-table.tsx` - TanStack table for reports
- [ ] 5.3 Create `app/(admin)/dashboard/boards/comments/components/report-actions.tsx` - Dismiss/Delete actions
- [ ] 5.4 Create `app/(admin)/dashboard/boards/comments/components/comment-preview.tsx` - View reported comment
- [ ] 5.5 Implement `getReportedComments()` server action
- [ ] 5.6 Implement `adminDeleteComment()` server action
- [ ] 5.7 Implement `dismissReport()` server action
- [ ] 5.8 Implement `takeActionOnReport()` server action

## Phase 3: Analytics

### 6.0 Implement Real Analytics Dashboard
**Priority:** Medium | **Location:** `app/(admin)/dashboard/boards/overview/`

Replace static placeholder data with real statistics.

- [ ] 6.1 Create `lib/actions/analytics.ts` with analytics queries
- [ ] 6.2 Implement `getPlatformStats()` - Total users, projects, posts, comments
- [ ] 6.3 Implement `getMostViewedProjects()` server action
- [ ] 6.4 Implement `getMostViewedPosts()` server action
- [ ] 6.5 Update `app/(admin)/dashboard/boards/overview/index.tsx` to use real data
- [ ] 6.6 Add charts/visualizations for key metrics (recharts or similar)
- [ ] 6.7 Add date range filtering for analytics

## Phase 4: Navigation & Integration

### 7.0 Update Sidebar Navigation
**Priority:** High | **Location:** `components/admin-panel/data/sidebar-data.tsx`

Update navigation to include new admin sections.

- [ ] 7.1 Add "Content" section with Projects, Blog Posts, Events links
- [ ] 7.2 Add "Community" section with Users, Comments links
- [ ] 7.3 Ensure proper icons for each menu item
- [ ] 7.4 Test navigation flow between sections

## Testing Checklist

- [ ] 8.1 Test Projects management (CRUD, filtering, featuring)
- [ ] 8.2 Test Blog Posts management (CRUD, tags, featuring)
- [ ] 8.3 Test Users management (search, role change, suspend)
- [ ] 8.4 Test Comments moderation (reports, delete, dismiss)
- [ ] 8.5 Test Analytics dashboard (real data loading)
- [ ] 8.6 Verify admin-only access (role=0 required)
- [ ] 8.7 Run TypeScript check (`bun tsc --noEmit`)
- [ ] 8.8 Run Biome lint (`bun lint`)
- [ ] 8.9 Run Biome format (`bun format`)

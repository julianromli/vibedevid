# Admin Analytics Tab — Real Data Plan

## Current state

| Area | Status |
|------|--------|
| **Overview tab** | Real data via `lib/actions/analytics.ts` (totals, engagement time series, top projects/posts) |
| **Analytics tab** | Demo admin-kit widgets (Sales, Visitors, Traffic Source, Customers, Buyers Profile) with hardcoded chart data |
| **Server actions** | `getPlatformStats`, `getAnalyticsTimeSeries`, `getMostViewedProjects`, `getMostViewedPosts` already query Supabase |

## Goal

Replace the Analytics tab demo with **VibeDev-specific insights** from existing tables, without duplicating Overview’s “headline + top 10” layout.

## Data sources (already in DB)

| Table | Metrics |
|-------|---------|
| `users` | `joined_at`, `role` (0/1/2), `is_suspended` |
| `projects` | `category`, `featured`, `created_at` |
| `posts` | `status` (draft/published/archived), `featured`, `created_at`, `view_count` |
| `events` | `approved` (pending vs live) |
| `blog_reports` | `status` (pending moderation) |
| `views`, `likes`, `comments` | Engagement time series (reuse existing action) |

## Tab differentiation

| Overview | Analytics |
|----------|-----------|
| Platform totals + “new today” | Growth & composition over selected range |
| Views/likes/comments trend | **Content creation** trend (users, projects, posts) |
| Top projects/posts tables | **Breakdown charts** (category, role, post status) |
| — | **Community health** strip (pending events/reports) |

## New server actions (`lib/actions/analytics.ts`)

1. **`getContentGrowthTimeSeries(days)`** — per day: new users, projects, posts  
2. **`getProjectsByCategory()`** — `{ category, count }[]` (top N categories)  
3. **`getUsersByRole()`** — admin / moderator / user counts (+ suspended if column exists)  
4. **`getPostsByStatus()`** — draft / published / archived counts  
5. **`getCommunityHealthCounts()`** — pending events, approved events, pending blog reports, featured projects/posts  

All reuse existing `checkAdminAccess()` (admin-only).

## UI layout (replace `boards/analytics/index.tsx`)

Client component (pattern matches Overview):

```
[ Date range: 7d | 30d | 90d ]

[ Stat row: signups | new projects | new posts | engagement events in range ]

[ Chart: Content growth — 3 lines/areas ]

[ Chart: Engagement — views / likes / comments (reuse time series) ]

[ Row: Projects by category (bar) | Users by role (bar) | Posts by status (bar) ]

[ Community health cards → deep-link ?tab=events-approval | comments | projects | blog ]
```

## Files to change

| Action | Path |
|--------|------|
| Extend | `lib/actions/analytics.ts` |
| Replace | `app/(admin)/dashboard/boards/analytics/index.tsx` |
| Add | `boards/analytics/components/*.tsx` (real charts only) |
| Delete | Demo: `sales-card`, `visitors-card`, `traffic-source-card`, `customers-card`, `buyers-profile-card`, `stats-card` |

## Out of scope

- External traffic sources (no referrer tracking in DB)
- Revenue / sales metrics (not applicable)
- Separate Analytics vs Overview merge (keep both tabs with distinct focus)

## Verification

- Open `/dashboard?tab=analytics` as admin
- Confirm charts reflect DB counts (change test data or compare with Overview totals)
- Date range switch refetches all series
- No hardcoded `chartData` arrays remain under `boards/analytics/`

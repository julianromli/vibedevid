# Sharing Leaderboard Feature Design

**Date**: January 24, 2026  
**Goal**: Grow community through social sharing incentives via status/recognition  
**Status**: Design validated, ready for implementation

---

## Overview

The Sharing Leaderboard incentivizes users to share blog posts and projects on social media (Twitter, LinkedIn) by tracking verified shares and displaying top sharers on a public leaderboard. Users earn badges for milestones and gain profile prestige.

**Primary Goal**: Increase community growth via social media amplification  
**Success Metric**: Track share volume, new user signups from shared links, leaderboard engagement

---

## Core Concept & Data Model

### Data Structure

**`shares` table**:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to users)
- `platform` (enum: 'twitter' | 'linkedin')
- `content_type` (enum: 'post' | 'project')
- `content_id` (uuid, references posts or projects)
- `content_url` (text, URL to VibeDev content)
- `shared_url` (text, tracking link user shares)
- `verified_at` (timestamp, null until verified)
- `created_at` (timestamp)

**`share_stats` table**:
- `user_id` (uuid, primary key)
- `total_shares` (integer, all-time count)
- `monthly_shares` (integer, resets monthly)
- `current_month` (date, tracks reset)
- `badges_earned` (jsonb array: ['bronze', 'silver', 'gold', 'platinum'])
- `updated_at` (timestamp)

### Points & Badges

**Points System**: 1 point = 1 verified share

**Badge Milestones**:
- Bronze: 5 shares
- Silver: 25 shares
- Gold: 50 shares
- Platinum: 100+ shares

**Leaderboard Views**:
- Monthly: Top 10 users by `monthly_shares` (resets on 1st of month)
- All-Time: Top 10 users by `total_shares`

---

## UI & User Experience

### Leaderboard Page (`/leaderboard`)

**Layout**:
- Tab switcher: "This Month" | "All Time"
- Top 10 list with columns: Rank | Avatar | Name | Share Count | Badge | Action (View Profile)
- Responsive: Stack on mobile, table on desktop
- Empty state if user hasn't shared yet

**Design**: Clean, scannable. Use existing design system (Tailwind v4, colors from `docs/design-system.md`)

### Share Button Integration

**Placement**: Blog posts and project pages (near existing like/comment buttons)

**Share Modal**:
1. Title: "Share this [post/project]"
2. Copy link button (copies VibeDev URL)
3. Twitter button (opens Twitter intent with pre-filled text)
4. LinkedIn button (opens LinkedIn share dialog)
5. After sharing, display tracking link: "Paste this link in your post to earn points"
6. Toast notification on verification: "Your share was verified! +1 point"

**Pre-filled Text**:
- Twitter: "Check out this [post/project] on VibeDev ID 🚀 [link]"
- LinkedIn: "Sharing from VibeDev ID community: [title] [link]"

### Profile Enhancement

**User Profile Page**:
- Display share badge prominently (if earned)
- Show total shares count
- Show monthly rank (if in top 10)
- Link to user's shares (optional: `/profile/[username]/shares`)

### Notifications

- Toast on share verification: "Your share was verified! +1 point"
- Optional: Email digest of monthly leaderboard standings

---

## Implementation Strategy

### Phase 1: MVP (Database + Share Tracking)

**Tasks**:
1. Create `shares` and `share_stats` tables in Supabase
2. Build share modal component (`components/ui/share-modal.tsx`)
3. Add share button to blog posts and projects
4. Create server action to log share intent (no verification yet)
5. Add feature flag: `NEXT_PUBLIC_SHARING_LEADERBOARD_ENABLED`

**Deliverables**:
- Share button appears on posts/projects
- Modal opens with Twitter/LinkedIn options
- Share logged to database (unverified)

**Timeline**: 2-3 days

### Phase 2: Verification & Stats

**Tasks**:
1. Integrate URL shortener (bit.ly API or custom tracking)
2. Generate tracking links for each share
3. Build verification job (cron or manual check)
4. Update `share_stats` on verification
5. Add badge calculation logic

**Deliverables**:
- Shares marked as verified when confirmed
- Badges awarded automatically
- Stats updated in real-time

**Timeline**: 3-4 days

### Phase 3: Leaderboard & Profile Display

**Tasks**:
1. Create `/leaderboard` page
2. Build leaderboard component with tabs
3. Add badge display to user profiles
4. Add share count to profile stats
5. Add monthly rank display

**Deliverables**:
- Public leaderboard page
- Badges visible on profiles
- Share stats visible on profiles

**Timeline**: 2-3 days

---

## Technical Details

### Server Actions

**`logShare(contentType, contentId, platform)`**:
- Validates user is logged in
- Creates entry in `shares` table
- Generates tracking link
- Returns tracking link to client
- Returns `{ success: boolean, trackingLink?: string, error?: string }`

**`verifyShare(shareId)`**:
- Checks if tracking link exists on user's social profile
- Updates `verified_at` timestamp
- Recalculates badges in `share_stats`
- Returns `{ success: boolean, verified: boolean }`

**`getLeaderboard(period: 'month' | 'allTime')`**:
- Queries top 10 from `share_stats`
- Returns user data + badges
- Returns `{ users: LeaderboardUser[], period: string }`

### Components

**`ShareModal.tsx`**:
- Props: `contentType`, `contentId`, `contentUrl`, `title`
- State: Loading, tracking link, verification status
- Handles Twitter/LinkedIn intent URLs
- Shows toast on verification

**`LeaderboardPage.tsx`**:
- Tabs for "This Month" / "All Time"
- Renders leaderboard table
- Responsive design

**`ShareBadge.tsx`**:
- Props: `badge` (bronze | silver | gold | platinum)
- Displays badge icon + label
- Used on profiles and leaderboard

---

## Testing Strategy

### E2E Tests (Playwright)

- Share button appears on blog post
- Share modal opens on click
- Twitter/LinkedIn buttons generate correct intent URLs
- Tracking link displays after share
- Leaderboard page loads and displays top users
- User profile shows badges and share count

### Manual Testing

- Verify social share intent URLs work
- Test badge calculation at milestones
- Verify leaderboard sorting (monthly vs all-time)
- Test on mobile and desktop

---

## Rollout & Risk Mitigation

### Feature Flag

```env
NEXT_PUBLIC_SHARING_LEADERBOARD_ENABLED=true
```

Allows safe testing in production before full rollout.

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Social API rate limits | Start with manual verification, automate later |
| False negatives (user deletes post) | Allow manual verification requests |
| Gaming (fake shares) | Require actual social post, periodic audits |
| Privacy concerns | Only track public shares, no DM/private content |

### Monitoring

- Track share volume daily
- Monitor verification success rate
- Track new user signups from shared links
- Monitor leaderboard engagement (page views, clicks)

---

## Success Criteria

- [ ] Share button visible on 100% of posts/projects
- [ ] 20%+ of active users attempt a share in first month
- [ ] 10%+ increase in new user signups from social referrals
- [ ] Leaderboard page gets 100+ views/week
- [ ] Top 10 sharers earn badges and show on profiles

---

## Future Enhancements

- Referral rewards (points for bringing new users)
- Share analytics (see who shared your content)
- Social proof notifications (show when content is shared)
- Monthly rewards (top sharer gets featured)
- Integration with Discord/Slack for announcements

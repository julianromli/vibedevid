# Sharing Leaderboard - Implementation Plan

**Design Document**: `docs/plans/2026-01-24-sharing-leaderboard-design.md`

---

## Phase 1: MVP (Database + Share Tracking)

### Task 1.1: Database Schema

**File**: `scripts/16_add_sharing_leaderboard_tables.sql`

```sql
-- Create shares table
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin')),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'project')),
  content_id UUID NOT NULL,
  content_url TEXT NOT NULL,
  shared_url TEXT NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create share_stats table
CREATE TABLE share_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_shares INTEGER DEFAULT 0,
  monthly_shares INTEGER DEFAULT 0,
  current_month DATE DEFAULT CURRENT_DATE,
  badges_earned JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_verified_at ON shares(verified_at);
CREATE INDEX idx_shares_created_at ON shares(created_at);
CREATE INDEX idx_share_stats_total_shares ON share_stats(total_shares DESC);
CREATE INDEX idx_share_stats_monthly_shares ON share_stats(monthly_shares DESC);

-- RLS Policies
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_stats ENABLE ROW LEVEL SECURITY;

-- Users can view all shares (public leaderboard)
CREATE POLICY "shares_select_public" ON shares FOR SELECT USING (true);

-- Users can only insert their own shares
CREATE POLICY "shares_insert_own" ON shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view all share_stats (public leaderboard)
CREATE POLICY "share_stats_select_public" ON share_stats FOR SELECT USING (true);

-- System can update share_stats (via service role)
CREATE POLICY "share_stats_update_system" ON share_stats FOR UPDATE USING (true);
```

**Steps**:
1. Create SQL file in `scripts/`
2. Run migration in Supabase dashboard
3. Verify tables created with correct indexes

### Task 1.2: Types

**File**: `types/sharing.ts`

```typescript
export interface Share {
  id: string
  userId: string
  platform: 'twitter' | 'linkedin'
  contentType: 'post' | 'project'
  contentId: string
  contentUrl: string
  sharedUrl: string
  verifiedAt: string | null
  createdAt: string
}

export interface ShareStats {
  userId: string
  totalShares: number
  monthlyShares: number
  currentMonth: string
  badgesEarned: Badge[]
  updatedAt: string
}

export type Badge = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface LeaderboardUser {
  userId: string
  name: string
  avatar: string | null
  shareCount: number
  badge: Badge | null
  rank: number
}
```

### Task 1.3: Server Actions

**File**: `lib/actions/sharing.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { Share, ShareStats } from '@/types/sharing'

export async function logShare(
  contentType: 'post' | 'project',
  contentId: string,
  contentUrl: string,
  platform: 'twitter' | 'linkedin'
): Promise<{ success: boolean; trackingLink?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Generate tracking link (simple: use share ID as token)
    const trackingToken = crypto.randomUUID()
    const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL}/share/${trackingToken}`

    // Insert share record
    const { data, error } = await supabase
      .from('shares')
      .insert({
        user_id: user.id,
        platform,
        content_type: contentType,
        content_id: contentId,
        content_url: contentUrl,
        shared_url: trackingLink,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, trackingLink }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getLeaderboard(
  period: 'month' | 'allTime'
): Promise<{ success: boolean; users?: any[]; error?: string }> {
  try {
    const supabase = await createClient()

    const column = period === 'month' ? 'monthly_shares' : 'total_shares'

    const { data, error } = await supabase
      .from('share_stats')
      .select('*, users(id, name, avatar_url)')
      .order(column, { ascending: false })
      .limit(10)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, users: data }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

### Task 1.4: Share Modal Component

**File**: `components/ui/share-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { logShare } from '@/lib/actions/sharing'
import { toast } from 'sonner'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: 'post' | 'project'
  contentId: string
  contentUrl: string
  title: string
}

export function ShareModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentUrl,
  title,
}: ShareModalProps) {
  const [loading, setLoading] = useState(false)
  const [trackingLink, setTrackingLink] = useState<string | null>(null)

  const handleShare = async (platform: 'twitter' | 'linkedin') => {
    setLoading(true)
    try {
      const result = await logShare(contentType, contentId, contentUrl, platform)

      if (!result.success) {
        toast.error(result.error || 'Failed to log share')
        return
      }

      setTrackingLink(result.trackingLink || null)

      const text = `Check out this ${contentType} on VibeDev ID: ${title}`
      const url = encodeURIComponent(result.trackingLink || contentUrl)

      if (platform === 'twitter') {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`,
          '_blank'
        )
      } else {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
          '_blank'
        )
      }

      toast.success('Share logged! Paste the tracking link in your post to earn points.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this {contentType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share on social media to earn points and climb the leaderboard!
          </p>

          {trackingLink && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium mb-2">Tracking Link:</p>
              <code className="text-xs break-all">{trackingLink}</code>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  navigator.clipboard.writeText(trackingLink)
                  toast.success('Copied!')
                }}
              >
                Copy Link
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleShare('twitter')}
              disabled={loading}
              className="flex-1"
            >
              Share on Twitter
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              disabled={loading}
              className="flex-1"
            >
              Share on LinkedIn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Task 1.5: Add Share Button to Posts & Projects

**Files to modify**:
- `components/blog/post-content.tsx` - Add share button
- `components/project/ProjectActionsClient.tsx` - Add share button

**Pattern**:
```typescript
const [shareOpen, setShareOpen] = useState(false)

return (
  <>
    <Button onClick={() => setShareOpen(true)}>Share</Button>
    <ShareModal
      open={shareOpen}
      onOpenChange={setShareOpen}
      contentType="post"
      contentId={id}
      contentUrl={`${process.env.NEXT_PUBLIC_APP_URL}/blog/${slug}`}
      title={title}
    />
  </>
)
```

### Task 1.6: Feature Flag

**File**: `.env.example`

Add:
```
NEXT_PUBLIC_SHARING_LEADERBOARD_ENABLED=true
```

**Usage in components**:
```typescript
if (process.env.NEXT_PUBLIC_SHARING_LEADERBOARD_ENABLED !== 'true') {
  return null
}
```

---

## Phase 2: Verification & Stats

### Task 2.1: Badge Calculation

**File**: `lib/sharing-utils.ts`

```typescript
import { Badge } from '@/types/sharing'

export function calculateBadges(totalShares: number): Badge[] {
  const badges: Badge[] = []
  if (totalShares >= 5) badges.push('bronze')
  if (totalShares >= 25) badges.push('silver')
  if (totalShares >= 50) badges.push('gold')
  if (totalShares >= 100) badges.push('platinum')
  return badges
}

export function getHighestBadge(badges: Badge[]): Badge | null {
  const order: Badge[] = ['platinum', 'gold', 'silver', 'bronze']
  for (const badge of order) {
    if (badges.includes(badge)) return badge
  }
  return null
}
```

### Task 2.2: Verification Job (Manual for MVP)

**File**: `lib/actions/sharing.ts` - Add function:

```typescript
export async function verifyShare(shareId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Mark as verified (manual for MVP)
    const { error: updateError } = await supabase
      .from('shares')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', shareId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Update stats
    const { data: share } = await supabase
      .from('shares')
      .select('user_id')
      .eq('id', shareId)
      .single()

    if (share) {
      const { data: stats } = await supabase
        .from('share_stats')
        .select('*')
        .eq('user_id', share.user_id)
        .single()

      const newTotal = (stats?.total_shares || 0) + 1
      const newMonthly = (stats?.monthly_shares || 0) + 1
      const badges = calculateBadges(newTotal)

      await supabase
        .from('share_stats')
        .upsert({
          user_id: share.user_id,
          total_shares: newTotal,
          monthly_shares: newMonthly,
          badges_earned: badges,
          updated_at: new Date().toISOString(),
        })
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
```

---

## Phase 3: Leaderboard & Profile Display

### Task 3.1: Leaderboard Page

**File**: `app/leaderboard/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getLeaderboard } from '@/lib/actions/sharing'
import { LeaderboardUser } from '@/types/sharing'

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'month' | 'allTime'>('month')
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      const result = await getLeaderboard(period)
      if (result.success && result.users) {
        setUsers(result.users)
      }
      setLoading(false)
    }

    fetchLeaderboard()
  }, [period])

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Sharing Leaderboard</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded ${period === 'month' ? 'bg-primary text-white' : 'bg-muted'}`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod('allTime')}
          className={`px-4 py-2 rounded ${period === 'allTime' ? 'bg-primary text-white' : 'bg-muted'}`}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {users.map((user, idx) => (
            <div key={user.userId} className="flex items-center gap-4 p-4 border rounded-lg">
              <span className="text-2xl font-bold text-muted-foreground w-8">{idx + 1}</span>
              <img src={user.avatar || '/placeholder.jpg'} alt={user.name} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="font-medium">{user.name}</p>
              </div>
              <span className="text-lg font-bold">{user.shareCount} shares</span>
              {user.badge && <span className="px-3 py-1 bg-yellow-100 rounded-full text-sm">{user.badge}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Task 3.2: Share Badge Component

**File**: `components/ui/share-badge.tsx`

```typescript
import { Badge } from '@/types/sharing'

interface ShareBadgeProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
}

const badgeStyles = {
  bronze: 'bg-amber-100 text-amber-900',
  silver: 'bg-slate-100 text-slate-900',
  gold: 'bg-yellow-100 text-yellow-900',
  platinum: 'bg-purple-100 text-purple-900',
}

const badgeLabels = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  platinum: '👑 Platinum',
}

export function ShareBadge({ badge, size = 'md' }: ShareBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-sm'

  return (
    <span className={`rounded-full font-medium ${badgeStyles[badge]} ${sizeClass}`}>
      {badgeLabels[badge]}
    </span>
  )
}
```

### Task 3.3: Update User Profile

**File**: `components/profile/profile-header.tsx` - Add share stats display

```typescript
{user.shareStats && (
  <div className="flex gap-4 mt-4">
    <div>
      <p className="text-sm text-muted-foreground">Total Shares</p>
      <p className="text-2xl font-bold">{user.shareStats.totalShares}</p>
    </div>
    {user.shareStats.badgesEarned.length > 0 && (
      <div>
        <p className="text-sm text-muted-foreground">Badges</p>
        <div className="flex gap-2">
          {user.shareStats.badgesEarned.map(badge => (
            <ShareBadge key={badge} badge={badge} size="sm" />
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

---

## Checklist

### Phase 1
- [ ] SQL migration created and applied
- [ ] Types defined in `types/sharing.ts`
- [ ] Server actions implemented
- [ ] Share modal component built
- [ ] Share button added to posts
- [ ] Share button added to projects
- [ ] Feature flag added to `.env.example`
- [ ] Test: Share button appears
- [ ] Test: Modal opens and closes
- [ ] Test: Share logged to database

### Phase 2
- [ ] Badge calculation logic implemented
- [ ] Verification function created
- [ ] Stats update on verification
- [ ] Test: Badges awarded at milestones
- [ ] Test: Stats update correctly

### Phase 3
- [ ] Leaderboard page created
- [ ] Share badge component built
- [ ] Profile updated with share stats
- [ ] Test: Leaderboard displays top 10
- [ ] Test: Badges visible on profiles
- [ ] Test: Share count visible on profiles

---

## Git Commits

```bash
# Phase 1
git commit -m "feat: add sharing leaderboard database schema"
git commit -m "feat: add sharing types and server actions"
git commit -m "feat: add share modal component"
git commit -m "feat: add share button to posts and projects"

# Phase 2
git commit -m "feat: add badge calculation and verification"

# Phase 3
git commit -m "feat: add leaderboard page and profile display"
```

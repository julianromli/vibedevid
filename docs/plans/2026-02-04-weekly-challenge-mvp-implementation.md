# Weekly Challenge MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the weekly challenge hub with prompts, submissions, voting, and leaderboard for authenticated users.

**Architecture:** Use dedicated Supabase tables (`challenges`, `challenge_submissions`, `challenge_votes`) with RLS. Server components fetch list/detail data; client components handle submission and voting via server actions.

**Tech Stack:** Next.js App Router (RSC), TypeScript, Supabase Postgres + RLS, Tailwind + shadcn/ui, Playwright.

---

### Task 1: Create Challenge Tables + RLS

**Files:**
- Create: `scripts/20_add_challenges_tables.sql`

**Step 1: Write the failing test**

Create a quick SQL verification snippet (to run after migration) so failure is explicit:

```sql
-- verify_challenges.sql (scratch)
select to_regclass('public.challenges');
select to_regclass('public.challenge_submissions');
select to_regclass('public.challenge_votes');
```

**Step 2: Run test to verify it fails**

Run in Supabase SQL Editor (before migration):

```sql
select to_regclass('public.challenges');
```

Expected: `null`

**Step 3: Write minimal implementation**

```sql
-- scripts/20_add_challenges_tables.sql
-- Challenge tables + constraints + indexes + RLS

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  prompt text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  prize_text text,
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_time_check check (starts_at < ends_at),
  constraint challenges_status_check check (status in ('draft', 'active', 'closed', 'archived'))
);

create index if not exists idx_challenges_status on public.challenges(status);
create index if not exists idx_challenges_starts_at on public.challenges(starts_at);
create index if not exists idx_challenges_ends_at on public.challenges(ends_at);

create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  project_url text not null,
  writeup text not null,
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_submissions_unique unique (challenge_id, user_id),
  constraint challenge_submissions_url_check check (project_url ~ '^https://'),
  constraint challenge_submissions_writeup_check check (char_length(writeup) between 100 and 1200),
  constraint challenge_submissions_status_check check (status in ('visible', 'hidden'))
);

create index if not exists idx_challenge_submissions_challenge on public.challenge_submissions(challenge_id);
create index if not exists idx_challenge_submissions_user on public.challenge_submissions(user_id);
create index if not exists idx_challenge_submissions_visible
  on public.challenge_submissions(challenge_id, created_at)
  where status = 'visible';

create table if not exists public.challenge_votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.challenge_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint challenge_votes_unique unique (submission_id, user_id)
);

create index if not exists idx_challenge_votes_submission on public.challenge_votes(submission_id);
create index if not exists idx_challenge_votes_user on public.challenge_votes(user_id);

alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.challenge_votes enable row level security;

-- challenges: public read, admin-only write (enforce via role in actions)
create policy "challenges_public_read" on public.challenges
  for select using (true);

-- challenge_submissions: visible read or owner
create policy "challenge_submissions_read" on public.challenge_submissions
  for select using (status = 'visible' or user_id = auth.uid());

create policy "challenge_submissions_insert" on public.challenge_submissions
  for insert with check (user_id = auth.uid());

create policy "challenge_submissions_update" on public.challenge_submissions
  for update using (user_id = auth.uid());

-- challenge_votes: public read
create policy "challenge_votes_read" on public.challenge_votes
  for select using (true);

create policy "challenge_votes_insert" on public.challenge_votes
  for insert with check (user_id = auth.uid());

create policy "challenge_votes_delete" on public.challenge_votes
  for delete using (user_id = auth.uid());
```

**Step 4: Run test to verify it passes**

Run in Supabase SQL Editor:

```sql
-- apply scripts/20_add_challenges_tables.sql, then
select to_regclass('public.challenges');
```

Expected: `public.challenges`

**Step 5: Commit**

```bash
git add scripts/20_add_challenges_tables.sql
git commit -m "feat: add weekly challenge tables and rls"
```

---

### Task 2: Seed One Active Challenge

**Files:**
- Create: `scripts/21_seed_challenges.sql`

**Step 1: Write the failing test**

Use a quick SQL check:

```sql
select count(*) from public.challenges where status = 'active';
```

**Step 2: Run test to verify it fails**

Expected: `0`

**Step 3: Write minimal implementation**

```sql
-- scripts/21_seed_challenges.sql
insert into public.challenges (slug, title, prompt, starts_at, ends_at, prize_text, status)
values (
  'weekly-ai-build-1',
  'Weekly Challenge #1: Build with AI',
  'Bangun fitur sederhana dengan bantuan AI. Jelaskan proses, kendala, dan hasilnya.',
  now() - interval '1 day',
  now() + interval '6 days',
  'Hadiah: 1 tahun akses komunitas premium + swag',
  'active'
)
on conflict (slug) do nothing;
```

**Step 4: Run test to verify it passes**

```sql
-- apply scripts/21_seed_challenges.sql, then
select count(*) from public.challenges where status = 'active';
```

Expected: `>= 1`

**Step 5: Commit**

```bash
git add scripts/21_seed_challenges.sql
git commit -m "feat: seed weekly challenge"
```

---

### Task 3: Add Types and Server Actions

**Files:**
- Create: `types/challenges.ts`
- Create: `lib/actions/challenges.ts`

**Step 1: Write the failing test**

Add a small action validation test in `tests/unit/challenge-actions.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validateChallengeSubmission } from '@/lib/actions/challenges'

describe('challenge actions', () => {
  it('rejects non-https urls', () => {
    const result = validateChallengeSubmission({
      title: 'Demo',
      projectUrl: 'http://example.com',
      writeup: 'a'.repeat(200),
    })
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
bunx vitest tests/unit/challenge-actions.spec.ts
```

Expected: FAIL with "validateChallengeSubmission is not a function"

**Step 3: Write minimal implementation**

```ts
// types/challenges.ts
export interface Challenge {
  id: string
  slug: string
  title: string
  prompt: string
  starts_at: string
  ends_at: string
  prize_text: string | null
  status: 'draft' | 'active' | 'closed' | 'archived'
}

export interface ChallengeSubmission {
  id: string
  challenge_id: string
  user_id: string
  title: string
  project_url: string
  writeup: string
  status: 'visible' | 'hidden'
  created_at: string
}

export interface ChallengeLeaderboardEntry extends ChallengeSubmission {
  vote_count: number
  author?: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
  }
}
```

```ts
// lib/actions/challenges.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export function validateChallengeSubmission(input: {
  title: string
  projectUrl: string
  writeup: string
}) {
  if (!input.title.trim()) return { success: false, error: 'Title required' }
  if (!/^https:/.test(input.projectUrl)) return { success: false, error: 'URL must be https' }
  if (input.writeup.trim().length < 100) return { success: false, error: 'Writeup too short' }
  if (input.writeup.trim().length > 1200) return { success: false, error: 'Writeup too long' }
  return { success: true }
}

export async function getActiveChallenges() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('starts_at', { ascending: false })
  return { challenges: data ?? [], error: error?.message }
}

export async function getChallengeBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('slug', slug)
    .single()
  return { challenge: data, error: error?.message }
}

export async function getChallengeLeaderboard(challengeId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('*, users(id, display_name, username, avatar_url), challenge_votes(count)')
    .eq('challenge_id', challengeId)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })

  const entries = (data ?? []).map((row: any) => ({
    ...row,
    vote_count: row.challenge_votes?.[0]?.count ?? 0,
    author: row.users,
  }))

  return { entries, error: error?.message }
}

export async function submitChallengeEntry(challengeId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const title = String(formData.get('title') || '')
    const projectUrl = String(formData.get('project_url') || '')
    const writeup = String(formData.get('writeup') || '')

    const validation = validateChallengeSubmission({ title, projectUrl, writeup })
    if (!validation.success) return validation

    const { error } = await supabase.from('challenge_submissions').insert({
      challenge_id: challengeId,
      user_id: user.id,
      title: title.trim(),
      project_url: projectUrl.trim(),
      writeup: writeup.trim(),
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/challenges/${challengeId}`)
    return { success: true }
  } catch (_error) {
    return { success: false, error: 'Failed to submit challenge' }
  }
}

export async function toggleChallengeVote(submissionId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: existing } = await supabase
      .from('challenge_votes')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.id) {
      await supabase.from('challenge_votes').delete().eq('id', existing.id)
      return { success: true, voted: false }
    }

    const { error } = await supabase.from('challenge_votes').insert({
      submission_id: submissionId,
      user_id: user.id,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/challenges')
    return { success: true, voted: true }
  } catch (_error) {
    return { success: false, error: 'Failed to vote' }
  }
}
```

**Step 4: Run test to verify it passes**

```bash
bunx vitest tests/unit/challenge-actions.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add types/challenges.ts lib/actions/challenges.ts tests/unit/challenge-actions.spec.ts
git commit -m "feat: add challenge actions and types"
```

---

### Task 4: Challenge UI Components (Card, Leaderboard, Vote Button, Form)

**Files:**
- Create: `components/challenges/challenge-card.tsx`
- Create: `components/challenges/challenge-leaderboard.tsx`
- Create: `components/challenges/challenge-vote-button.tsx`
- Create: `components/challenges/challenge-submission-form.tsx`

**Step 1: Write the failing test**

Add an E2E test skeleton that expects a leaderboard list and vote button:

```ts
// tests/challenges.spec.ts
import { expect, test } from '@playwright/test'

test('shows leaderboard and vote buttons', async ({ page }) => {
  await page.goto('/challenges/weekly-ai-build-1')
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('challenge-leaderboard')).toBeVisible()
})
```

**Step 2: Run test to verify it fails**

```bash
bunx playwright test tests/challenges.spec.ts -g "leaderboard"
```

Expected: FAIL (404 or missing test id)

**Step 3: Write minimal implementation**

```tsx
// components/challenges/challenge-card.tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Challenge } from '@/types/challenges'

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Card className="bg-background/60">
      <CardHeader>
        <CardTitle>{challenge.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-muted-foreground text-sm">{challenge.prompt}</p>
        <Link className="text-primary text-sm" href={`/challenges/${challenge.slug}`}>
          Lihat detail
        </Link>
      </CardContent>
    </Card>
  )
}
```

```tsx
// components/challenges/challenge-vote-button.tsx
'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toggleChallengeVote } from '@/lib/actions/challenges'

export function ChallengeVoteButton({ submissionId }: { submissionId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      data-testid="vote-button"
      onClick={() => startTransition(async () => {
        await toggleChallengeVote(submissionId)
      })}
    >
      Vote
    </Button>
  )
}
```

```tsx
// components/challenges/challenge-leaderboard.tsx
import { ChallengeVoteButton } from './challenge-vote-button'
import type { ChallengeLeaderboardEntry } from '@/types/challenges'

export function ChallengeLeaderboard({ entries }: { entries: ChallengeLeaderboardEntry[] }) {
  return (
    <div data-testid="challenge-leaderboard" className="space-y-3">
      {entries.map((entry, index) => (
        <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm text-muted-foreground">#{index + 1}</div>
            <div className="font-medium">{entry.title}</div>
            <div className="text-muted-foreground text-sm">{entry.vote_count} votes</div>
          </div>
          <ChallengeVoteButton submissionId={entry.id} />
        </div>
      ))}
    </div>
  )
}
```

```tsx
// components/challenges/challenge-submission-form.tsx
'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitChallengeEntry } from '@/lib/actions/challenges'

export function ChallengeSubmissionForm({ challengeId }: { challengeId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await submitChallengeEntry(challengeId, formData)
        })
      }}
      className="space-y-4"
    >
      <Input name="title" placeholder="Judul submission" required />
      <Input name="project_url" placeholder="https://project.url" required />
      <Textarea name="writeup" placeholder="Tulis proses kamu..." rows={6} required />
      <Button type="submit" disabled={pending} data-testid="challenge-submit-button">
        Submit
      </Button>
    </form>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
bunx playwright test tests/challenges.spec.ts -g "leaderboard"
```

Expected: PASS (leaderboard container exists)

**Step 5: Commit**

```bash
git add components/challenges tests/challenges.spec.ts
git commit -m "feat: add challenge ui components"
```

---

### Task 5: Challenges List Page

**Files:**
- Create: `app/challenges/page.tsx`

**Step 1: Write the failing test**

Add list page test:

```ts
test('shows weekly challenge list', async ({ page }) => {
  await page.goto('/challenges')
  await expect(page.getByRole('heading', { name: /weekly challenge/i })).toBeVisible()
})
```

**Step 2: Run test to verify it fails**

```bash
bunx playwright test tests/challenges.spec.ts -g "challenge list"
```

Expected: FAIL (404)

**Step 3: Write minimal implementation**

```tsx
// app/challenges/page.tsx
import { ChallengeCard } from '@/components/challenges/challenge-card'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { getActiveChallenges } from '@/lib/actions/challenges'
import { getCurrentUser } from '@/lib/server/auth'

export default async function ChallengesPage() {
  const user = await getCurrentUser()
  const { challenges } = await getActiveChallenges()

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <Navbar showNavigation={true} isLoggedIn={!!user} user={user ?? undefined} />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-foreground text-3xl font-bold">Weekly Challenge</h1>
        <div className="mt-6 grid gap-4">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
bunx playwright test tests/challenges.spec.ts -g "challenge list"
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/challenges/page.tsx
git commit -m "feat: add challenges list page"
```

---

### Task 6: Challenge Detail Page + Leaderboard Data

**Files:**
- Create: `app/challenges/[slug]/page.tsx`

**Step 1: Write the failing test**

```ts
test('shows challenge prompt and leaderboard', async ({ page }) => {
  await page.goto('/challenges/weekly-ai-build-1')
  await expect(page.getByText(/bangun fitur sederhana/i)).toBeVisible()
  await expect(page.getByTestId('challenge-leaderboard')).toBeVisible()
})
```

**Step 2: Run test to verify it fails**

```bash
bunx playwright test tests/challenges.spec.ts -g "challenge prompt"
```

Expected: FAIL (404)

**Step 3: Write minimal implementation**

```tsx
// app/challenges/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { ChallengeLeaderboard } from '@/components/challenges/challenge-leaderboard'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { getChallengeBySlug, getChallengeLeaderboard } from '@/lib/actions/challenges'
import { getCurrentUser } from '@/lib/server/auth'

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await getCurrentUser()
  const { challenge } = await getChallengeBySlug(slug)
  if (!challenge) notFound()

  const { entries } = await getChallengeLeaderboard(challenge.id)

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <Navbar showNavigation={true} isLoggedIn={!!user} user={user ?? undefined} />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-foreground text-3xl font-bold">{challenge.title}</h1>
        <p className="text-muted-foreground mt-3">{challenge.prompt}</p>
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
          <div className="mt-3">
            <ChallengeLeaderboard entries={entries} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
bunx playwright test tests/challenges.spec.ts -g "challenge prompt"
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/challenges/[slug]/page.tsx
git commit -m "feat: add challenge detail page"
```

---

### Task 7: Submission Page (Auth Required)

**Files:**
- Create: `app/challenges/[slug]/submit/page.tsx`

**Step 1: Write the failing test**

```ts
test('allows authenticated submission', async ({ page }) => {
  await page.goto('/user/auth')
  await page.fill('input[name="email"]', '123@gmail.com')
  await page.fill('input[name="password"]', '123456')
  await page.click('button[type="submit"]')

  await page.goto('/challenges/weekly-ai-build-1/submit')
  await page.getByTestId('challenge-submit-button').click()
  await expect(page.getByText(/success/i)).toBeVisible()
})
```

**Step 2: Run test to verify it fails**

```bash
bunx playwright test tests/challenges.spec.ts -g "authenticated submission"
```

Expected: FAIL (page missing or no form)

**Step 3: Write minimal implementation**

```tsx
// app/challenges/[slug]/submit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChallengeSubmissionForm } from '@/components/challenges/challenge-submission-form'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { createClient } from '@/lib/supabase/client'

export default function ChallengeSubmitPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push('/user/auth')
        return
      }
      setIsLoggedIn(true)
      const { data: profile } = await supabase.from('users').select('*').eq('id', auth.user.id).single()
      setUser({
        id: profile?.id,
        name: profile?.display_name,
        email: auth.user.email || '',
        avatar_url: profile?.avatar_url,
        username: profile?.username,
        role: profile?.role,
      })

      const { data: challenge } = await supabase.from('challenges').select('id').eq('slug', params.slug).single()
      if (challenge?.id) setChallengeId(challenge.id)
    }

    load()
  }, [params.slug, router])

  if (!challengeId) return null

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <Navbar showNavigation={true} isLoggedIn={isLoggedIn} user={user ?? undefined} />
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <h1 className="text-foreground text-3xl font-bold">Submit Challenge</h1>
        <div className="mt-6">
          <ChallengeSubmissionForm challengeId={challengeId} />
        </div>
      </div>
      <Footer />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
bunx playwright test tests/challenges.spec.ts -g "authenticated submission"
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/challenges/[slug]/submit/page.tsx
git commit -m "feat: add challenge submission page"
```

---

### Task 8: Update Sitemap + Translations

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `messages/en.json`
- Modify: `messages/id.json`

**Step 1: Write the failing test**

Add a small unit check in `tests/unit/challenge-sitemap.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import sitemap from '@/app/sitemap'

test('sitemap includes challenges route', async () => {
  const entries = await sitemap()
  const urls = entries.map((entry) => entry.url)
  expect(urls.some((url) => url.endsWith('/challenges'))).toBe(true)
})
```

**Step 2: Run test to verify it fails**

```bash
bunx playwright test tests/unit/challenge-sitemap.spec.ts
```

Expected: FAIL (route missing)

**Step 3: Write minimal implementation**

```ts
// app/sitemap.ts
const routes = ['', '/project/list', '/project/submit', '/user/auth', '/terms', '/calendar', '/ai/ranking', '/challenges']
```

Add translation keys:

```json
// messages/en.json
"challenges": {
  "title": "Weekly Challenge",
  "leaderboard": "Leaderboard",
  "submit": "Submit Challenge"
}
```

```json
// messages/id.json
"challenges": {
  "title": "Weekly Challenge",
  "leaderboard": "Leaderboard",
  "submit": "Submit Challenge"
}
```

**Step 4: Run test to verify it passes**

```bash
bunx playwright test tests/unit/challenge-sitemap.spec.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/sitemap.ts messages/en.json messages/id.json tests/unit/challenge-sitemap.spec.ts
git commit -m "feat: add challenge route to sitemap"
```

---

### Task 9: Full E2E Coverage

**Files:**
- Modify: `tests/challenges.spec.ts`

**Step 1: Write the failing test**

Add full flow:

```ts
test('submit and vote flow', async ({ page }) => {
  await page.goto('/user/auth')
  await page.fill('input[name="email"]', '123@gmail.com')
  await page.fill('input[name="password"]', '123456')
  await page.click('button[type="submit"]')

  await page.goto('/challenges/weekly-ai-build-1/submit')
  await page.fill('input[name="title"]', 'AI Note App')
  await page.fill('input[name="project_url"]', 'https://example.com')
  await page.fill('textarea[name="writeup"]', 'a'.repeat(200))
  await page.getByTestId('challenge-submit-button').click()

  await page.goto('/challenges/weekly-ai-build-1')
  await page.getByTestId('vote-button').first().click()
})
```

**Step 2: Run test to verify it fails**

```bash
bunx playwright test tests/challenges.spec.ts -g "submit and vote"
```

Expected: FAIL before all earlier tasks are complete

**Step 3: Write minimal implementation**

No new code; this validates integration after tasks 1-8.

**Step 4: Run test to verify it passes**

```bash
bunx playwright test tests/challenges.spec.ts -g "submit and vote"
```

Expected: PASS

**Step 5: Commit**

```bash
git add tests/challenges.spec.ts
git commit -m "test: add weekly challenge e2e"
```

---

## Docs to Review Before Coding
- `WARP.md` (background pattern + navbar/footer rules)
- `docs/design-system.md` (typography, spacing, components)
- `docs/security/RLS_POLICIES.md` (RLS conventions)

## Verification Checklist
- `bun tsc --noEmit`
- `bun lint`
- `bun format`
- `bunx playwright test tests/challenges.spec.ts`

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { getSupabaseConfig } from '@/lib/env-config'
import type {
  Competition,
  CompetitionCategory,
  CompetitionEntriesResult,
  CompetitionEntryAuthor,
  CompetitionEntryDetail,
  CompetitionEntrySummary,
  CompetitionFaqItem,
  CompetitionSort,
  CompetitionStatus,
  CompetitionTimelineItem,
} from '@/types/competition'

interface CompetitionRow {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  prize_text: string
  starts_at: string
  ends_at: string
  status: CompetitionStatus
  rules_markdown: string
  judging_criteria_markdown: string
  faq_items: unknown
  timeline_items: unknown
  hero_primary_cta_label: string | null
  hero_secondary_cta_label: string | null
  judging_vote_weight: number | string | null
  judging_judge_weight: number | string | null
  created_at: string
  updated_at: string
}

interface CompetitionCategoryRow {
  id: string
  competition_id: string
  slug: string
  label: string
  description: string | null
  sort_order: number | null
  is_active: boolean | null
}

interface CompetitionEntryAuthorRow {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  role: number | null
}

interface CompetitionEntryRow {
  id: string
  competition_id: string
  category_id: string
  user_id: string
  slug: string
  title: string
  tagline: string
  description: string
  process_summary: string
  ai_tools_used: string[] | null
  tech_stacks: string[] | null
  demo_url: string
  repo_url: string
  thumbnail_url: string
  thumbnail_key: string | null
  gallery_urls: string[] | null
  gallery_keys: string[] | null
  video_url: string | null
  comment_count: number | null
  vote_count: number | null
  status: CompetitionEntrySummary['status']
  is_featured: boolean | null
  is_finalist: boolean | null
  is_winner: boolean | null
  comments_locked: boolean | null
  submitted_at: string
  created_at: string
  competition?: CompetitionRow | CompetitionRow[] | null
  author?: CompetitionEntryAuthorRow | CompetitionEntryAuthorRow[] | null
  category?: CompetitionCategoryRow | CompetitionCategoryRow[] | null
}

function createPublicClient() {
  const { url, anonKey } = getSupabaseConfig()

  return createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizeFaqItems(value: unknown): CompetitionFaqItem[] {
  return asArray<Record<string, unknown>>(value)
    .map((item) => ({
      question: typeof item.question === 'string' ? item.question : '',
      answer: typeof item.answer === 'string' ? item.answer : '',
    }))
    .filter((item) => item.question && item.answer)
}

function normalizeTimelineItems(value: unknown): CompetitionTimelineItem[] {
  return asArray<Record<string, unknown>>(value)
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label : '',
      description: typeof item.description === 'string' ? item.description : '',
      date: typeof item.date === 'string' ? item.date : '',
    }))
    .filter((item) => item.label && item.date)
}

function mapCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    prizeText: row.prize_text,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    rulesMarkdown: row.rules_markdown,
    judgingCriteriaMarkdown: row.judging_criteria_markdown,
    faqItems: normalizeFaqItems(row.faq_items),
    timelineItems: normalizeTimelineItems(row.timeline_items),
    heroPrimaryCtaLabel: row.hero_primary_cta_label,
    heroSecondaryCtaLabel: row.hero_secondary_cta_label,
    judgingVoteWeight: Number(row.judging_vote_weight ?? 0.3),
    judgingJudgeWeight: Number(row.judging_judge_weight ?? 0.7),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCompetitionCategory(row: CompetitionCategoryRow): CompetitionCategory {
  return {
    id: row.id,
    competitionId: row.competition_id,
    slug: row.slug,
    label: row.label,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  }
}

function mapCompetitionAuthor(row: CompetitionEntryAuthorRow | null): CompetitionEntryAuthor | null {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    displayName: row.display_name || row.username || 'Peserta',
    username: row.username || 'user',
    avatarUrl: row.avatar_url,
    role: row.role,
  }
}

function mapCompetitionEntrySummary(row: CompetitionEntryRow, commentCountOverride?: number): CompetitionEntrySummary {
  const category = asSingle(row.category)

  return {
    id: row.id,
    competitionId: row.competition_id,
    categoryId: row.category_id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    thumbnailUrl: row.thumbnail_url,
    voteCount: row.vote_count ?? 0,
    commentCount: commentCountOverride ?? row.comment_count ?? 0,
    status: row.status,
    isFeatured: row.is_featured ?? false,
    isFinalist: row.is_finalist ?? false,
    isWinner: row.is_winner ?? false,
    commentsLocked: row.comments_locked ?? false,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    category: category ? mapCompetitionCategory(category) : null,
    author: mapCompetitionAuthor(asSingle(row.author)),
  }
}

async function fetchActiveCompetition(): Promise<Competition | null> {
  const supabase = createPublicClient()
  const nowIso = new Date().toISOString()
  const { data } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'active')
    .lte('starts_at', nowIso)
    .gt('ends_at', nowIso)
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ? mapCompetition(data as CompetitionRow) : null
}

export const getActiveCompetition = unstable_cache(fetchActiveCompetition, ['competition-active'], {
  revalidate: 60,
  tags: ['competition:active'],
})

export async function getCompetitionLandingData(slugOrActive?: string): Promise<Competition | null> {
  if (!slugOrActive) {
    return getActiveCompetition()
  }

  const supabase = createPublicClient()
  const { data } = await supabase.from('competitions').select('*').eq('slug', slugOrActive).maybeSingle()
  return data ? mapCompetition(data as CompetitionRow) : null
}

export async function getCompetitionCategories(competitionId: string): Promise<CompetitionCategory[]> {
  if (!competitionId) {
    return []
  }

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('competition_categories')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (data as CompetitionCategoryRow[] | null)?.map(mapCompetitionCategory) ?? []
}

export async function getCompetitionEntryVoteState(
  entryIds: string[],
  userId?: string,
): Promise<Record<string, boolean>> {
  if (!userId || entryIds.length === 0) {
    return {}
  }

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('competition_votes')
    .select('competition_entry_id')
    .eq('user_id', userId)
    .in('competition_entry_id', entryIds)

  return (data ?? []).reduce<Record<string, boolean>>((accumulator, row) => {
    const entryId = typeof row.competition_entry_id === 'string' ? row.competition_entry_id : null
    if (entryId) {
      accumulator[entryId] = true
    }
    return accumulator
  }, {})
}

export async function getCompetitionEntryCommentsCount(entryIds: string[]): Promise<Record<string, number>> {
  if (entryIds.length === 0) {
    return {}
  }

  const supabase = createPublicClient()
  const { data } = await supabase.from('comments').select('competition_entry_id').in('competition_entry_id', entryIds)

  return (data ?? []).reduce<Record<string, number>>((accumulator, row) => {
    const entryId = typeof row.competition_entry_id === 'string' ? row.competition_entry_id : null
    if (entryId) {
      accumulator[entryId] = (accumulator[entryId] ?? 0) + 1
    }
    return accumulator
  }, {})
}

interface GetCompetitionEntriesOptions {
  competitionId: string
  sort?: CompetitionSort
  categorySlug?: string
  limit?: number
  userId?: string
}

export async function getCompetitionEntries({
  competitionId,
  sort = 'newest',
  categorySlug,
  limit = 50,
  userId,
}: GetCompetitionEntriesOptions): Promise<CompetitionEntriesResult | null> {
  if (!competitionId) {
    return null
  }

  void userId

  const supabase = createPublicClient()
  const { data: competitionData } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .maybeSingle()
  const competition = competitionData ? mapCompetition(competitionData as CompetitionRow) : null

  if (!competition) {
    return null
  }

  let query = supabase
    .from('competition_entries')
    .select(
      `
      id,
      competition_id,
      category_id,
      user_id,
      slug,
      title,
      tagline,
      description,
      process_summary,
      ai_tools_used,
      tech_stacks,
      demo_url,
      repo_url,
      thumbnail_url,
      thumbnail_key,
      gallery_urls,
      gallery_keys,
      video_url,
      comment_count,
      vote_count,
      status,
      is_featured,
      is_finalist,
      is_winner,
      comments_locked,
      submitted_at,
      created_at,
      author:users(id, display_name, username, avatar_url, role),
      category:competition_categories(id, competition_id, slug, label, description, sort_order, is_active)
    `,
    )
    .eq('competition_id', competitionId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .limit(limit)

  if (categorySlug) {
    query = query.eq('category.slug', categorySlug)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'top':
      query = query.order('vote_count', { ascending: false }).order('submitted_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data } = await query
  const rows = (data as CompetitionEntryRow[] | null) ?? []
  const commentCounts = await getCompetitionEntryCommentsCount(rows.map((entry) => entry.id))

  return {
    competition,
    entries: rows.map((row) => mapCompetitionEntrySummary(row, commentCounts[row.id])),
  }
}

export async function getCompetitionEntryBySlug(slug: string, userId?: string): Promise<CompetitionEntryDetail | null> {
  if (!slug) {
    return null
  }

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('competition_entries')
    .select(
      `
      id,
      competition_id,
      category_id,
      user_id,
      slug,
      title,
      tagline,
      description,
      process_summary,
      ai_tools_used,
      tech_stacks,
      demo_url,
      repo_url,
      thumbnail_url,
      thumbnail_key,
      gallery_urls,
      gallery_keys,
      video_url,
      comment_count,
      vote_count,
      status,
      is_featured,
      is_finalist,
      is_winner,
      comments_locked,
      submitted_at,
      created_at,
      competition:competitions(*),
      author:users(id, display_name, username, avatar_url, role),
      category:competition_categories(id, competition_id, slug, label, description, sort_order, is_active)
    `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  const row = data as CompetitionEntryRow | null
  if (!row) {
    return null
  }

  const competitionRow = asSingle(row.competition)
  if (!competitionRow) {
    return null
  }

  const voteState = await getCompetitionEntryVoteState([row.id], userId)
  const commentCounts = await getCompetitionEntryCommentsCount([row.id])
  const summary = mapCompetitionEntrySummary(row, commentCounts[row.id])

  return {
    ...summary,
    description: row.description,
    processSummary: row.process_summary,
    aiToolsUsed: row.ai_tools_used ?? [],
    techStacks: row.tech_stacks ?? [],
    demoUrl: row.demo_url,
    repoUrl: row.repo_url,
    thumbnailKey: row.thumbnail_key,
    galleryUrls: row.gallery_urls ?? [],
    galleryKeys: row.gallery_keys ?? [],
    videoUrl: row.video_url,
    competition: mapCompetition(competitionRow),
    hasVoted: Boolean(voteState[row.id]),
  }
}

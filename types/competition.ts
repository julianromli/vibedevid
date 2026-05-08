export type CompetitionStatus = 'draft' | 'active' | 'closed' | 'archived'

export type CompetitionEntryStatus = 'published' | 'hidden' | 'disqualified'

export type CompetitionSort = 'newest' | 'oldest' | 'top'

export interface CompetitionFaqItem {
  question: string
  answer: string
}

export interface CompetitionTimelineItem {
  label: string
  description: string
  date: string
}

export interface CompetitionCategory {
  id: string
  competitionId: string
  slug: string
  label: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export interface Competition {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  prizeText: string
  startsAt: string
  endsAt: string
  status: CompetitionStatus
  rulesMarkdown: string
  judgingCriteriaMarkdown: string
  faqItems: CompetitionFaqItem[]
  timelineItems: CompetitionTimelineItem[]
  heroPrimaryCtaLabel: string | null
  heroSecondaryCtaLabel: string | null
  judgingVoteWeight: number
  judgingJudgeWeight: number
  createdAt: string
  updatedAt: string
}

export interface CompetitionEntryAuthor {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
  role: number | null
}

export interface CompetitionEntrySummary {
  id: string
  competitionId: string
  categoryId: string
  userId: string
  slug: string
  title: string
  tagline: string
  thumbnailUrl: string
  voteCount: number
  commentCount: number
  status: CompetitionEntryStatus
  isFeatured: boolean
  isFinalist: boolean
  isWinner: boolean
  commentsLocked: boolean
  submittedAt: string
  createdAt: string
  category: CompetitionCategory | null
  author: CompetitionEntryAuthor | null
}

export interface CompetitionEntryDetail extends CompetitionEntrySummary {
  description: string
  processSummary: string
  aiToolsUsed: string[]
  techStacks: string[]
  demoUrl: string
  repoUrl: string
  thumbnailKey: string | null
  galleryUrls: string[]
  galleryKeys: string[]
  videoUrl: string | null
  competition: Competition
  hasVoted: boolean
}

export interface CompetitionEntriesResult {
  competition: Competition
  entries: CompetitionEntrySummary[]
}

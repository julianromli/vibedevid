'use client'

import { CompetitionEntryFeed } from '@/components/competition/competition-entry-feed'
import { CompetitionSortControls } from '@/components/competition/competition-sort-controls'
import type { CompetitionEntrySummary, CompetitionSort } from '@/types/competition'

interface CompetitionListClientProps {
  entries: CompetitionEntrySummary[]
  sort: CompetitionSort
  isLoggedIn: boolean
  currentUserId?: string
  voteState: Record<string, boolean>
  isCompetitionOpen: boolean
}

export function CompetitionListClient({
  entries,
  sort,
  isLoggedIn,
  currentUserId,
  voteState,
  isCompetitionOpen,
}: CompetitionListClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-xl">Feed entry publik</h2>
          <p className="text-sm text-muted-foreground">
            Urutan “Teratas” memakai vote_count desc lalu submitted_at asc.
          </p>
        </div>
        <CompetitionSortControls value={sort} />
      </div>

      <CompetitionEntryFeed
        entries={entries}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        voteState={voteState}
        isCompetitionOpen={isCompetitionOpen}
      />
    </div>
  )
}

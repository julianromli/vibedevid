import { CompetitionEntryCard } from '@/components/competition/competition-entry-card'
import type { CompetitionEntrySummary } from '@/types/competition'

interface CompetitionEntryFeedProps {
  entries: CompetitionEntrySummary[]
  isLoggedIn: boolean
  currentUserId?: string
  voteState: Record<string, boolean>
  isCompetitionOpen: boolean
}

export function CompetitionEntryFeed({
  entries,
  isLoggedIn,
  currentUserId,
  voteState,
  isCompetitionOpen,
}: CompetitionEntryFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        Belum ada entry yang tayang untuk kompetisi ini.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <CompetitionEntryCard
          key={entry.id}
          entry={entry}
          rank={index + 1}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
          hasVoted={Boolean(voteState[entry.id])}
          isCompetitionOpen={isCompetitionOpen}
        />
      ))}
    </div>
  )
}

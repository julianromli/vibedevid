import { MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { CompetitionVoteButton } from '@/components/competition/competition-vote-button'
import { Card, CardContent } from '@/components/ui/card'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { UserDisplayName } from '@/components/ui/user-display-name'
import type { CompetitionEntrySummary } from '@/types/competition'

interface CompetitionEntryCardProps {
  entry: CompetitionEntrySummary
  rank?: number
  isLoggedIn: boolean
  currentUserId?: string
  hasVoted: boolean
  isCompetitionOpen: boolean
}

export function CompetitionEntryCard({
  entry,
  rank,
  isLoggedIn,
  currentUserId,
  hasVoted,
  isCompetitionOpen,
}: CompetitionEntryCardProps) {
  const isOwner = currentUserId === entry.userId

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="grid gap-4 p-4 md:grid-cols-[160px_1fr_auto] md:items-center">
          <Link
            href={`/competition/${entry.slug}`}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="absolute top-3 left-3 z-10 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
              #{rank ?? 0}
            </div>
            <Image
              src={entry.thumbnailUrl}
              alt={entry.title}
              width={320}
              height={180}
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="space-y-3">
            <div className="space-y-1">
              <Link
                href={`/competition/${entry.slug}`}
                className="hover:text-primary"
              >
                <h3 className="font-semibold text-xl">{entry.title}</h3>
              </Link>
              <p className="text-sm text-muted-foreground">{entry.tagline}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                {entry.category?.label || 'Umum'}
              </span>
              <span>{new Date(entry.submittedAt).toLocaleDateString('id-ID')}</span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {entry.commentCount}
              </span>
            </div>

            {entry.author ? (
              <Link
                href={`/${entry.author.username}`}
                className="inline-flex items-center gap-2"
              >
                <OptimizedAvatar
                  src={entry.author.avatarUrl}
                  alt={entry.author.displayName}
                  size="sm"
                  showSkeleton={false}
                />
                <UserDisplayName
                  name={entry.author.displayName}
                  role={entry.author.role}
                  className="text-sm"
                />
              </Link>
            ) : null}
          </div>

          <div className="flex items-center justify-end md:self-start">
            <CompetitionVoteButton
              entryId={entry.id}
              initialVoteCount={entry.voteCount}
              initialHasVoted={hasVoted}
              isLoggedIn={isLoggedIn}
              isOwner={isOwner}
              isCompetitionOpen={isCompetitionOpen}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { notFound } from 'next/navigation'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { getCurrentUser } from '@/lib/server/auth'
import {
  getActiveCompetition,
  getCompetitionEntries,
  getCompetitionEntryVoteState,
} from '@/lib/server/competition-public'
import type { CompetitionSort } from '@/types/competition'
import { CompetitionListClient } from './competition-list-client'

type SearchParams = Promise<{ sort?: string }>

function normalizeSort(sort?: string): CompetitionSort {
  return sort === 'oldest' || sort === 'top' ? sort : 'newest'
}

function isCompetitionOpen(startsAt: string, endsAt: string) {
  const now = new Date()
  return now >= new Date(startsAt) && now < new Date(endsAt)
}

export default async function CompetitionListPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ sort }, competition, currentUser] = await Promise.all([
    searchParams,
    getActiveCompetition(),
    getCurrentUser(),
  ])

  if (!competition) {
    notFound()
  }

  const normalizedSort = normalizeSort(sort)
  const entriesResult = await getCompetitionEntries({
    competitionId: competition.id,
    sort: normalizedSort,
    userId: currentUser?.id,
  })

  if (!entriesResult) {
    notFound()
  }

  const voteState = currentUser
    ? await getCompetitionEntryVoteState(
        entriesResult.entries.map((entry) => entry.id),
        currentUser.id,
      )
    : {}

  const user = currentUser
    ? {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role,
      }
    : null

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

        <Navbar
          showNavigation={true}
          isLoggedIn={Boolean(currentUser)}
          user={user ?? undefined}
        />

        <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-24 pb-12 sm:px-6 lg:px-8">
          <section className="space-y-3">
            <h1 className="font-bold text-4xl tracking-tight">Mini Vibeathon Entries</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Jelajahi semua entry publik dari kompetisi aktif dan dukung karya favoritmu dengan vote.
            </p>
          </section>

          <CompetitionListClient
            entries={entriesResult.entries}
            sort={normalizedSort}
            isLoggedIn={Boolean(currentUser)}
            currentUserId={currentUser?.id}
            voteState={voteState}
            isCompetitionOpen={isCompetitionOpen(competition.startsAt, competition.endsAt)}
          />
        </main>

        <Footer />
      </div>
    </div>
  )
}

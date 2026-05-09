import { ExternalLink, MessageCircle, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CompetitionVoteButton } from '@/components/competition/competition-vote-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CommentSection } from '@/components/ui/comment-section'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { getComments } from '@/lib/actions/comments'
import { getCurrentUser } from '@/lib/server/auth'
import { getCompetitionEntryBySlug } from '@/lib/server/competition-public'

function isCompetitionOpen(startsAt: string, endsAt: string) {
  const now = new Date()
  return now >= new Date(startsAt) && now < new Date(endsAt)
}

export default async function CompetitionEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const currentUser = await getCurrentUser()
  const entry = await getCompetitionEntryBySlug(slug, currentUser?.id)

  if (!entry) {
    notFound()
  }

  const { comments: initialComments } = await getComments('competition', entry.id)
  const user = currentUser
    ? {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role,
      }
    : null

  const competitionOpen = isCompetitionOpen(entry.competition.startsAt, entry.competition.endsAt)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

        <Navbar
          showNavigation={true}
          showBackButton={true}
          isLoggedIn={Boolean(currentUser)}
          user={user ?? undefined}
        />

        <main className="relative mx-auto grid max-w-6xl gap-8 px-4 pt-24 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-3xl border border-border">
              <Image
                src={entry.thumbnailUrl}
                alt={entry.title}
                width={1440}
                height={810}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {entry.category?.label || 'Umum'}
                </span>
                <span>{new Date(entry.submittedAt).toLocaleDateString('id-ID')}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {initialComments.length} komentar
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="font-bold text-4xl tracking-tight">{entry.title}</h1>
                <p className="text-lg text-muted-foreground">{entry.tagline}</p>
              </div>

              {entry.author ? (
                <Link
                  href={`/${entry.author.username}`}
                  className="inline-flex items-center gap-3"
                >
                  <OptimizedAvatar
                    src={entry.author.avatarUrl}
                    alt={entry.author.displayName}
                    size="md"
                    showSkeleton={false}
                  />
                  <div className="space-y-1">
                    <UserDisplayName
                      name={entry.author.displayName}
                      role={entry.author.role}
                    />
                    <p className="text-sm text-muted-foreground">@{entry.author.username}</p>
                  </div>
                </Link>
              ) : null}
            </div>

            <Card>
              <CardContent className="space-y-6 py-6">
                <section className="space-y-2">
                  <h2 className="font-semibold text-xl">Tentang entry ini</h2>
                  <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{entry.description}</div>
                </section>

                <section className="space-y-2">
                  <h2 className="font-semibold text-xl">Proses vibe coding</h2>
                  <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {entry.processSummary}
                  </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                  <section className="space-y-2">
                    <h2 className="font-semibold text-xl">AI tools</h2>
                    <p className="text-sm text-muted-foreground">{entry.aiToolsUsed.join(', ')}</p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="font-semibold text-xl">Tech stack</h2>
                    <p className="text-sm text-muted-foreground">{entry.techStacks.join(', ')}</p>
                  </section>
                </div>

                {entry.galleryUrls.length > 0 ? (
                  <section className="space-y-3">
                    <h2 className="font-semibold text-xl">Galeri</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {entry.galleryUrls.map((url) => (
                        <div
                          key={url}
                          className="overflow-hidden rounded-2xl border border-border"
                        >
                          <Image
                            src={url}
                            alt={entry.title}
                            width={1280}
                            height={720}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </CardContent>
            </Card>

            <CommentSection
              entityType="competition"
              entityId={entry.id}
              initialComments={initialComments}
              isLoggedIn={Boolean(currentUser)}
              currentUser={
                currentUser
                  ? {
                      id: currentUser.id,
                      name: currentUser.name,
                      avatar: currentUser.avatar,
                    }
                  : null
              }
              allowGuest={false}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 py-6">
                <CompetitionVoteButton
                  entryId={entry.id}
                  initialVoteCount={entry.voteCount}
                  initialHasVoted={entry.hasVoted}
                  isLoggedIn={Boolean(currentUser)}
                  isOwner={currentUser?.id === entry.userId}
                  isCompetitionOpen={competitionOpen}
                />

                <Button
                  asChild
                  className="w-full"
                >
                  <a
                    href={entry.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka demo
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <a
                    href={entry.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Lihat repo
                  </a>
                </Button>

                {entry.videoUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={entry.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="h-4 w-4" />
                      Tonton video
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

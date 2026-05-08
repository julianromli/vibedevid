import { notFound } from 'next/navigation'
import { CompetitionFaq } from '@/components/competition/competition-faq'
import { CompetitionHero } from '@/components/competition/competition-hero'
import { CompetitionRules } from '@/components/competition/competition-rules'
import { CompetitionTimeline } from '@/components/competition/competition-timeline'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { getCompetitionCategories, getActiveCompetition } from '@/lib/server/competition-public'
import { getCurrentUser } from '@/lib/server/auth'

function isCompetitionOpen(startsAt: string, endsAt: string) {
  const now = new Date()
  return now >= new Date(startsAt) && now < new Date(endsAt)
}

export default async function CompetitionPage() {
  const [competition, currentUser] = await Promise.all([getActiveCompetition(), getCurrentUser()])

  if (!competition) {
    notFound()
  }

  const categories = await getCompetitionCategories(competition.id)
  const user = currentUser
    ? {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role,
      }
    : null

  const competitionOpen = isCompetitionOpen(competition.startsAt, competition.endsAt)

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
          <CompetitionHero
            competition={competition}
            isOpen={competitionOpen}
          />

          {categories.length > 0 ? (
            <section className="rounded-2xl border border-border bg-background/80 p-6">
              <h2 className="font-semibold text-2xl">Kategori kompetisi</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-primary/10 px-3 py-2 text-sm text-primary"
                  >
                    {category.label}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2">
            <CompetitionTimeline items={competition.timelineItems} />
            <CompetitionFaq items={competition.faqItems} />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <CompetitionRules
              title="Rules"
              content={competition.rulesMarkdown}
            />
            <CompetitionRules
              title="Judging criteria"
              content={competition.judgingCriteriaMarkdown}
            />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

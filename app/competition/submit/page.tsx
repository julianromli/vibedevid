import { redirect } from 'next/navigation'
import { CompetitionSubmitForm } from '@/components/competition/competition-submit-form'
import { Card, CardContent } from '@/components/ui/card'
import { getActiveCompetition, getCompetitionCategories } from '@/lib/server/competition-public'
import { createClient } from '@/lib/supabase/server'

function isCompetitionOpen(startsAt: string, endsAt: string) {
  const now = new Date()
  return now >= new Date(startsAt) && now < new Date(endsAt)
}

export default async function CompetitionSubmitPage() {
  const supabase = await createClient()
  const redirectTo = '/competition/submit'
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/user/auth?redirectTo=${redirectTo}`)
  }

  const competition = await getActiveCompetition()
  if (!competition) {
    redirect('/competition')
  }

  const categories = await getCompetitionCategories(competition.id)
  const competitionOpen = isCompetitionOpen(competition.startsAt, competition.endsAt)

  return (
    <div className="relative min-h-screen bg-grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

      <div className="container relative mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="font-bold text-3xl">Kirim entry Mini Vibeathon</h1>
            <p className="text-muted-foreground">
              Submission akan langsung tayang di feed publik dan tidak bisa diedit setelah dikirim.
            </p>
          </div>

          {!competitionOpen ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground">
                  Submission belum dibuka atau sudah ditutup. Pantau halaman kompetisi untuk timeline resminya.
                </p>
              </CardContent>
            </Card>
          ) : (
            <CompetitionSubmitForm
              competitionId={competition.id}
              categories={categories}
            />
          )}
        </div>
      </div>
    </div>
  )
}

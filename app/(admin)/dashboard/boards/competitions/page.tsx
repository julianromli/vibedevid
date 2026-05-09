import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getActiveCompetition, getCompetitionCategories, getCompetitionEntries } from '@/lib/server/competition-public'

export default async function CompetitionsPage() {
  const competition = await getActiveCompetition()

  if (!competition) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        Belum ada kompetisi aktif yang bisa dikelola.
      </div>
    )
  }

  const [categories, entriesResult] = await Promise.all([
    getCompetitionCategories(competition.id),
    getCompetitionEntries({
      competitionId: competition.id,
      sort: 'top',
    }),
  ])

  const entries = entriesResult?.entries ?? []

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Kompetisi aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold text-lg">{competition.title}</p>
            <p className="text-sm text-muted-foreground">{competition.tagline}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total entry publik</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">{entries.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-3xl">{categories.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top entries sementara</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada entry yang tayang.</p>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.author?.displayName || 'Peserta'} • {entry.category?.label || 'Umum'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.voteCount} vote • {entry.commentCount} komentar
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Competition } from '@/types/competition'

interface CompetitionHeroProps {
  competition: Competition
  isOpen: boolean
}

export function CompetitionHero({ competition, isOpen }: CompetitionHeroProps) {
  return (
    <section className="rounded-3xl border border-border bg-background/80 p-8 shadow-sm backdrop-blur md:p-12">
      <div className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
          {competition.title}
        </span>
        <div className="space-y-3">
          <h1 className="font-bold text-4xl tracking-tight md:text-5xl">{competition.tagline}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{competition.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Hadiah: {competition.prizeText}</span>
          <span aria-hidden="true">•</span>
          <span>
            {new Date(competition.startsAt).toLocaleDateString('id-ID')} -{' '}
            {new Date(competition.endsAt).toLocaleDateString('id-ID')}
          </span>
          <span aria-hidden="true">•</span>
          <span>{isOpen ? 'Submission & voting sedang berjalan' : 'Kompetisi belum dibuka atau sudah selesai'}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/competition/submit">{competition.heroPrimaryCtaLabel || 'Kirim Entry'}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
          >
            <Link href="/competition/list">{competition.heroSecondaryCtaLabel || 'Lihat Entry'}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

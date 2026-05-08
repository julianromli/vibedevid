import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CompetitionTimelineItem } from '@/types/competition'

interface CompetitionTimelineProps {
  items: CompetitionTimelineItem[]
}

export function CompetitionTimeline({ items }: CompetitionTimelineProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.date}-${item.label}`}
            className="rounded-xl border border-border p-4"
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <h3 className="font-medium">{item.label}</h3>
              <span className="text-sm text-muted-foreground">{item.date}</span>
            </div>
            {item.description ? <p className="mt-2 text-sm text-muted-foreground">{item.description}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

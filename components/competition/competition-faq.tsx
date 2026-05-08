import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CompetitionFaqItem } from '@/types/competition'

interface CompetitionFaqProps {
  items: CompetitionFaqItem[]
}

export function CompetitionFaq({ items }: CompetitionFaqProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.question}
            className="space-y-2 rounded-xl border border-border p-4"
          >
            <h3 className="font-medium">{item.question}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

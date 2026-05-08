import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompetitionRulesProps {
  title: string
  content: string
}

export function CompetitionRules({ title, content }: CompetitionRulesProps) {
  if (!content.trim()) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{content}</div>
      </CardContent>
    </Card>
  )
}

/**
 * Integration Card Component
 * Displays AI tool/integration cards with icon, title, description, and link
 */

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface IntegrationCardProps {
  title: string
  description: string
  children: React.ReactNode
  link?: string
}

export function IntegrationCard({ title, description, children, link = '#' }: IntegrationCardProps) {
  return (
    <Card className="p-6">
      <div className="relative">
        <div className="*:size-10">{children}</div>

        <div className="space-y-2 py-6">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
        </div>

        <div className="flex gap-3 border-t border-dashed pt-6">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1 pr-2 shadow-none"
          >
            <Link
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
              <ExternalLink className="ml-0 !size-3.5 opacity-50" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  isOwner?: boolean
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, isOwner }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center animate-in fade-in-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 mx-auto px-4">{description}</p>

      {isOwner && actionLabel && actionLink && (
        <Button asChild>
          <Link href={actionLink}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  )
}

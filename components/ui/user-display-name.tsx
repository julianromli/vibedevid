'use client'

import { VerifiedBadge } from '@/components/ui/verified-badge'
import { cn } from '@/lib/utils'

export function UserDisplayName({
  name,
  role,
  className,
  badgeClassName,
}: {
  name: string
  role?: number | null
  className?: string
  badgeClassName?: string
}) {
  const showVerified = role === 0

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="truncate">{name}</span>
      {showVerified ? (
        <VerifiedBadge
          className={badgeClassName}
          title="Verified"
        />
      ) : null}
    </span>
  )
}

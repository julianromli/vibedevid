'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { CompetitionSort } from '@/types/competition'

interface CompetitionSortControlsProps {
  value: CompetitionSort
}

const SORT_LABELS: Record<CompetitionSort, string> = {
  newest: 'Terbaru',
  oldest: 'Terlama',
  top: 'Teratas',
}

export function CompetitionSortControls({ value }: CompetitionSortControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <label className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>Urutkan</span>
      <select
        className="rounded-md border border-border bg-background px-3 py-2 text-foreground"
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('sort', event.target.value)
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }}
      >
        {Object.entries(SORT_LABELS).map(([sortValue, label]) => (
          <option
            key={sortValue}
            value={sortValue}
          >
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}

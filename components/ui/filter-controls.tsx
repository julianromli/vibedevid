/**
 * Filter Controls Component
 * Provides filter dropdown for project filtering.
 *
 * Owns its own open/close state and click-outside handling so consumers don't
 * have to lift dropdown UI state into the parent.
 */

'use client'

import { ChevronDown } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'
import type { ProjectFilterOption } from '@/types/homepage'

interface FilterControlsProps {
  filterOptions: ProjectFilterOption[]
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  triggerClassName?: string
}

export function FilterControls({
  filterOptions,
  selectedFilter,
  setSelectedFilter,
  triggerClassName,
}: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setIsOpen(false), [])
  useClickOutside(containerRef, close, isOpen)

  const selectedOption = filterOptions.find((option) => option.value === selectedFilter)

  return (
    <div
      className="relative"
      ref={containerRef}
    >
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn('flex items-center gap-2', triggerClassName)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {selectedOption?.label ?? 'All'}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="bg-background border-border absolute top-full left-0 z-10 mt-2 w-48 rounded-lg border shadow-lg">
          <div className="p-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelectedFilter(option.value)
                  setIsOpen(false)
                }}
                className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedFilter === option.value ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

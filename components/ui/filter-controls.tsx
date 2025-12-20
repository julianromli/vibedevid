/**
 * Filter Controls Component
 * Provides filter dropdown for project filtering
 */

'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterControlsProps {
  filterOptions: string[]
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function FilterControls({
  filterOptions,
  selectedFilter,
  setSelectedFilter,
  isOpen,
  setIsOpen,
}: FilterControlsProps) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        Filter
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="bg-background border-border absolute top-full left-0 z-10 mt-2 w-48 rounded-lg border shadow-lg">
          <div className="p-2">
            {filterOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSelectedFilter(option)
                  setIsOpen(false)
                }}
                className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedFilter === option ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

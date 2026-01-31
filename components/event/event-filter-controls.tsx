/**
 * Event Filter Controls Component
 * Provides filter dropdowns for event filtering by category, location, and sort
 */

'use client'

import { ChevronDown, LayoutGrid, List } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { EventCategory, EventLocationType } from '@/types/events'

type ViewMode = 'grid' | 'list'

interface EventFilterControlsProps {
  selectedCategory: EventCategory | 'All'
  setSelectedCategory: (category: EventCategory | 'All') => void
  selectedLocation: EventLocationType | 'All'
  setSelectedLocation: (location: EventLocationType | 'All') => void
  selectedSort: 'nearest' | 'latest'
  setSelectedSort: (sort: 'nearest' | 'latest') => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export function EventFilterControls({
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  selectedSort,
  setSelectedSort,
  viewMode,
  setViewMode,
}: EventFilterControlsProps) {
  const categoryOptions: Array<EventCategory | 'All'> = ['All', 'workshop', 'meetup', 'conference', 'hackathon']
  const locationOptions: Array<EventLocationType | 'All'> = ['All', 'online', 'offline', 'hybrid']
  const sortOptions: Array<{ value: 'nearest' | 'latest'; label: string }> = [
    { value: 'nearest', label: 'Terdekat' },
    { value: 'latest', label: 'Terbaru' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Category Filter */}
      <FilterDropdown
        label="Kategori"
        options={categoryOptions.map((cat) => ({
          value: cat,
          label: cat === 'All' ? 'Semua' : cat.charAt(0).toUpperCase() + cat.slice(1),
        }))}
        selectedValue={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Location Filter */}
      <FilterDropdown
        label="Lokasi"
        options={locationOptions.map((loc) => ({
          value: loc,
          label: loc === 'All' ? 'Semua' : loc.charAt(0).toUpperCase() + loc.slice(1),
        }))}
        selectedValue={selectedLocation}
        onSelect={setSelectedLocation}
      />

      {/* Sort Control */}
      <FilterDropdown
        label="Urutkan"
        options={sortOptions}
        selectedValue={selectedSort}
        onSelect={setSelectedSort}
      />

      {/* View Mode Toggle */}
      <div className="flex rounded-md border border-border">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`flex items-center justify-center rounded-l-md p-2 transition-colors ${
            viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
          }`}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`flex items-center justify-center rounded-r-md border-l border-border p-2 transition-colors ${
            viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
          }`}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface FilterDropdownProps<T extends string> {
  label: string
  options: Array<{ value: T; label: string }>
  selectedValue: T
  onSelect: (value: T) => void
}

function FilterDropdown<T extends string>({ label, options, selectedValue, onSelect }: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.label || label

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        {label}: {selectedLabel}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-2 w-48 rounded-lg border border-border bg-background shadow-lg">
          <div className="p-2">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onSelect(option.value)
                  setIsOpen(false)
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  selectedValue === option.value ? 'bg-muted text-foreground' : 'text-muted-foreground'
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

'use client'

import { useEffect, useState } from 'react'
import { EventCard } from '@/components/event/event-card'
import { EventFilterControls } from '@/components/event/event-filter-controls'
import { SubmitEventSection } from '@/components/event/submit-event-section'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { useAuth } from '@/hooks/useAuth'
import { applyFilters } from '@/lib/events-utils'
import type { AIEvent, EventCategory, EventLocationType } from '@/types/events'

type ViewMode = 'grid' | 'list'

interface EventListClientProps {
  initialEvents: AIEvent[]
}

export default function EventListClient({ initialEvents }: EventListClientProps) {
  const { isLoggedIn, user } = useAuth()

  // Filter and sort state
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>('All')
  const [selectedLocation, setSelectedLocation] = useState<EventLocationType | 'All'>('All')
  const [selectedSort, setSelectedSort] = useState<'nearest' | 'latest'>('nearest')

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  useEffect(() => {
    const saved = localStorage.getItem('eventViewMode') as ViewMode | null
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('eventViewMode', mode)
  }

  // Apply filters and sort to mock data
  const filteredEvents = applyFilters(initialEvents, {
    category: selectedCategory,
    locationType: selectedLocation,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Background pattern sama seperti project list */}
      <div className="relative min-h-screen bg-grid-pattern">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={user ?? undefined}
        />

        {/* Main Content */}
        <section className="relative bg-transparent py-12 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight lg:text-5xl">
                AI Events di Indonesia
              </h1>
              <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
                Temukan workshop, meetup, conference, dan hackathon AI terbaik di Indonesia. Bergabunglah dengan
                komunitas AI dan tingkatkan skill kamu!
              </p>
            </div>

            {/* Filter Controls */}
            <div className="mb-8 flex justify-center">
              <EventFilterControls
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
                viewMode={viewMode}
                setViewMode={handleViewModeChange}
              />
            </div>

            {/* Event Grid/List - Responsive layout based on viewMode */}
            <div
              className={
                viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4'
              }
            >
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant={viewMode}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredEvents.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-4 text-muted-foreground text-xl">Tidak ada event yang sesuai dengan filter</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All')
                    setSelectedLocation('All')
                  }}
                  className="text-primary hover:underline"
                >
                  Reset filter
                </button>
              </div>
            )}

            {/* Stats info */}
            {filteredEvents.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-muted-foreground">Menampilkan {filteredEvents.length} event AI di Indonesia</p>
              </div>
            )}
          </div>
        </section>

        {/* Submit Event Section */}
        <SubmitEventSection
          isLoggedIn={isLoggedIn}
          user={user}
        />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

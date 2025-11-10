/**
 * Project Showcase Section Component
 * Displays filtered and sorted project grid with load more functionality
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { HeartButtonDisplay } from '@/components/ui/heart-button-display'
import { FilterControls } from '@/components/ui/filter-controls'
import { ChevronDown, Plus } from 'lucide-react'
import type { Project } from '@/types/homepage'

interface ProjectShowcaseProps {
  projects: Project[]
  loading: boolean
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  selectedTrending: string
  setSelectedTrending: (trending: string) => void
  filterOptions: string[]
}

// Hardcoded trending options
const trendingOptions = ['Trending', 'Top', 'Newest']

export function ProjectShowcase({
  projects,
  loading,
  selectedFilter,
  setSelectedFilter,
  selectedTrending,
  setSelectedTrending,
  filterOptions,
}: ProjectShowcaseProps) {
  const router = useRouter()
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isTrendingOpen, setIsTrendingOpen] = useState(false)
  const [visibleProjects, setVisibleProjects] = useState(6)

  return (
    <section className="bg-muted/20 py-12" id="projects">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
            Showcase Project Developer Indonesia
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Temukan project keren yang dibuat oleh komunitas vibe coder
            Indonesia. Dari AI tools sampai open source projects, semua karya
            developer terbaik ada di sini.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Filters Dropdown */}
            <FilterControls
              filterOptions={filterOptions}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              isOpen={isFiltersOpen}
              setIsOpen={setIsFiltersOpen}
            />
          </div>

          <div className="flex flex-1 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/project/submit">
                <Plus className="mr-2 h-4 w-4" />
                Submit Project
              </Link>
            </Button>
          </div>

          {/* Trending Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsTrendingOpen(!isTrendingOpen)}
              className="flex items-center gap-2"
            >
              {selectedTrending}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isTrendingOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>

            {isTrendingOpen && (
              <div className="bg-background border-border absolute top-full right-0 z-10 mt-2 w-32 rounded-lg border shadow-lg">
                <div className="p-2">
                  {trendingOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedTrending(option)
                        setIsTrendingOpen(false)
                      }}
                      className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selectedTrending === option
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="group my-4 cursor-pointer py-0">
                  <div className="bg-muted relative mb-4 animate-pulse overflow-hidden rounded-lg">
                    <div className="bg-muted h-64 w-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted h-6 animate-pulse rounded"></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-muted h-8 w-8 animate-pulse rounded-full"></div>
                        <div className="bg-muted h-4 w-24 animate-pulse rounded"></div>
                      </div>
                      <div className="bg-muted h-8 w-16 animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            : projects.slice(0, visibleProjects).map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.slug}`}
                  className="group my-4 block cursor-pointer py-0"
                >
                  {/* Thumbnail Preview Section */}
                  <div className="bg-background relative mb-4 overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
                    <AspectRatio ratio={16 / 9}>
                      <Image
                        src={project.image || '/vibedev-guest-avatar.png'}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = '/vibedev-guest-avatar.png'
                        }}
                      />
                    </AspectRatio>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Project Details Section */}
                  <div className="space-y-3">
                    <h3 className="text-foreground group-hover:text-primary line-clamp-2 py-0 text-lg leading-tight font-semibold transition-colors duration-300">
                      {project.title}
                    </h3>

                    {/* Author and Stats */}
                    <div className="flex items-center justify-between py-0">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="relative z-10 flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push(`/${project.author.username}`)
                          }}
                        >
                          <OptimizedAvatar
                            src={project.author.avatar}
                            alt={project.author.name}
                            size="sm"
                            className="ring-muted ring-2"
                            showSkeleton={false}
                          />
                          <span className="text-muted-foreground text-sm font-medium">
                            {project.author.name}
                          </span>
                        </div>
                      </div>
                      <div className="relative z-20">
                        <HeartButtonDisplay
                          likes={project.likes || 0}
                          variant="default"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {/* Load More button */}
        {!loading && visibleProjects < projects.length && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setVisibleProjects((prev) => prev + 6)}
              className="px-8 py-2"
            >
              Muat Project Lainnya
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

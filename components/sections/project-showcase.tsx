/**
 * Project Showcase Section Component
 * Displays filtered and sorted project grid with load more functionality
 */

'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { FilterControls } from '@/components/ui/filter-controls'
import { HeartButtonDisplay } from '@/components/ui/heart-button-display'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { UserDisplayName } from '@/components/ui/user-display-name'
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

const skeletonKeys = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6']

interface TrendingDropdownProps {
  selectedTrending: string
  options: string[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onChange: (value: string) => void
  buttonClassName?: string
  menuClassName?: string
}

function TrendingDropdown({
  selectedTrending,
  options,
  isOpen,
  setIsOpen,
  onChange,
  buttonClassName,
  menuClassName,
}: TrendingDropdownProps) {
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName}
      >
        {selectedTrending}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className={menuClassName}>
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
                className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedTrending === option ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export function ProjectShowcase({
  projects,
  loading,
  selectedFilter,
  setSelectedFilter,
  selectedTrending,
  setSelectedTrending,
  filterOptions,
}: ProjectShowcaseProps) {
  const t = useTranslations('projectShowcase')

  // Translated trending options
  const trendingOptions = [t('trendingOptions.trending'), t('trendingOptions.top'), t('trendingOptions.newest')]
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isTrendingOpen, setIsTrendingOpen] = useState(false)
  const [visibleProjects, setVisibleProjects] = useState(6)
  const gridRef = useRef<HTMLDivElement>(null)
  const mobileTrendingRef = useRef<HTMLDivElement>(null)
  const desktopTrendingRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(gridRef, { once: true, margin: '-50px' })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isTrendingOpen) {
        return
      }

      const target = event.target as Node
      const clickedOutsideMobile = mobileTrendingRef.current && !mobileTrendingRef.current.contains(target)
      const clickedOutsideDesktop = desktopTrendingRef.current && !desktopTrendingRef.current.contains(target)

      if (clickedOutsideMobile && clickedOutsideDesktop) {
        setIsTrendingOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTrendingOpen])

  return (
    <section
      className="bg-muted/20 py-14 sm:py-16"
      id="projects"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">{t('description')}</p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8">
          {/* Mobile Layout: stacked + balanced widths */}
          <div className="space-y-4 md:hidden">
            <div className="flex justify-center">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 w-full max-w-sm"
              >
                <Link href="/project/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('submitButton')}
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FilterControls
                filterOptions={filterOptions}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                isOpen={isFiltersOpen}
                setIsOpen={setIsFiltersOpen}
                triggerClassName="w-full justify-between"
              />

              <div
                className="relative"
                ref={mobileTrendingRef}
              >
                <TrendingDropdown
                  selectedTrending={selectedTrending}
                  options={trendingOptions}
                  isOpen={isTrendingOpen}
                  setIsOpen={setIsTrendingOpen}
                  onChange={setSelectedTrending}
                  buttonClassName="w-full justify-between"
                  menuClassName="bg-background border-border absolute top-full right-0 z-10 mt-2 w-40 rounded-lg border shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Tablet/Desktop Layout: all controls aligned in one row */}
          <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="justify-self-start">
              <FilterControls
                filterOptions={filterOptions}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                isOpen={isFiltersOpen}
                setIsOpen={setIsFiltersOpen}
              />
            </div>

            <div className="justify-self-center">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90"
              >
                <Link href="/project/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('submitButton')}
                </Link>
              </Button>
            </div>

            <div
              className="relative justify-self-end"
              ref={desktopTrendingRef}
            >
              <TrendingDropdown
                selectedTrending={selectedTrending}
                options={trendingOptions}
                isOpen={isTrendingOpen}
                setIsOpen={setIsTrendingOpen}
                onChange={setSelectedTrending}
                buttonClassName="flex items-center gap-2"
                menuClassName="bg-background border-border absolute top-full right-0 z-10 mt-2 w-32 rounded-lg border shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {loading
            ? skeletonKeys.map((skeletonKey) => (
                <div
                  key={skeletonKey}
                  className="group my-4 cursor-pointer py-0"
                >
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
            : projects.slice(0, visibleProjects).map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  whileHover={{ y: -2 }}
                >
                  <div className="group my-4 cursor-pointer py-0">
                    <Link
                      href={`/project/${project.slug}`}
                      className="block"
                    >
                      {/* Thumbnail Preview Section */}
                      <div className="bg-background relative mb-4 overflow-hidden rounded-lg border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={project.image || '/vibedev-guest-avatar.png'}
                            alt={project.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = '/vibedev-guest-avatar.png'
                            }}
                          />
                        </AspectRatio>

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="text-foreground border-border/70 bg-background/85 rounded-full border px-2 py-1 text-xs backdrop-blur-sm">
                            {project.category}
                          </span>
                        </div>
                      </div>

                      {/* Project Details Section */}
                      <div className="space-y-3">
                        <h3 className="text-foreground group-hover:text-primary line-clamp-2 py-0 text-lg leading-tight font-semibold transition-colors duration-300">
                          {project.title}
                        </h3>
                      </div>
                    </Link>

                    {/* Author and Stats */}
                    <div className="mt-3 flex items-center justify-between py-0">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/${project.author.username}`}
                          className="relative z-10 flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
                        >
                          <OptimizedAvatar
                            src={project.author.avatar}
                            alt={project.author.name}
                            size="sm"
                            className="ring-muted ring-2"
                            showSkeleton={false}
                          />
                          <UserDisplayName
                            name={project.author.name}
                            role={project.author.role}
                            className="text-muted-foreground text-sm font-medium"
                          />
                        </Link>
                      </div>
                      <div className="relative z-20">
                        <HeartButtonDisplay
                          likes={project.likes || 0}
                          variant="default"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
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
              {t('loadMoreButton')}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

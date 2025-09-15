'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlertCircle, RefreshCw, Trophy, Zap } from 'lucide-react'
import useSWR from 'swr'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface LeaderboardItem {
  id: string
  name: string
  icon: string
  winRate: number
  eloRating?: number
  category: string
  color: string
}

interface LeaderboardData {
  modelPerformance: LeaderboardItem[]
  builderPerformance: LeaderboardItem[]
  lastUpdated: string
}

export default function AIRankingPage() {
  const [activeTab, setActiveTab] = useState('models')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Polling interval in ms (15 seconds)
  const POLLING_INTERVAL = 15000

  // SWR fetcher function
  const fetcher = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    return response.json()
  }

  // Use SWR for data fetching with polling
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<LeaderboardData>('/api/designarena', fetcher, {
      refreshInterval: POLLING_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
    })

  // Categories untuk filtering
  const categories = {
    models: ['All Categories', 'AI Model'],
    builders: [
      'All Categories',
      'AI Builder',
      'Design Tool',
      'Code Editor',
      'AI Platform',
    ],
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = `/#${sectionId}`
    }
  }

  const handleRefresh = () => {
    mutate()
  }

  const getFilteredData = (items: LeaderboardItem[]) => {
    if (selectedCategory === 'all') return items
    return items.filter((item) => item.category === selectedCategory)
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <Navbar showNavigation={true} scrollToSection={scrollToSection} />

      <div className="relative mx-auto max-w-6xl px-3 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="mb-8 text-center sm:mb-12 lg:mb-16">
          <div className="relative mb-4 inline-block sm:mb-6">
            {/* Clean background without rainbow effects */}
            <div className="bg-background/95 border-border/50 relative flex items-center justify-center rounded-xl border px-4 py-4 shadow-lg backdrop-blur-sm sm:rounded-2xl sm:px-6 sm:py-5 lg:px-8 lg:py-6">
              {/* Clean title with standard foreground color */}
              <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-4xl lg:text-6xl">
                AI Coding Leaderboard
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground mx-auto max-w-3xl px-2 text-sm leading-relaxed sm:text-lg lg:text-xl">
            Ranking terbaru performance AI Models dan AI Builders untuk coding.
            Data real-time dari DesignArena untuk membantu lo pilih tools AI
            terbaik! 🚀
          </p>

          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row sm:gap-4">
            <Button
              onClick={handleRefresh}
              disabled={isLoading || isValidating}
              variant="outline"
              size="sm"
              className="gap-2 text-xs sm:text-sm"
            >
              <RefreshCw
                className={`h-3 w-3 sm:h-4 sm:w-4 ${isValidating ? 'animate-spin' : ''}`}
              />
              {isValidating ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            {data && (
              <p className="text-muted-foreground text-center text-xs sm:text-sm">
                Last updated: {formatLastUpdated(data.lastUpdated)}
              </p>
            )}
            {error && (
              <div className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <p className="text-xs">Error loading data</p>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-sm grid-cols-2 sm:max-w-md">
                <TabsTrigger
                  value="models"
                  className="gap-1 text-xs sm:gap-2 sm:text-sm"
                >
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                  AI Models
                </TabsTrigger>
                <TabsTrigger
                  value="builders"
                  className="gap-1 text-xs sm:gap-2 sm:text-sm"
                >
                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                  AI Builders
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(activeTab === 'models'
                ? categories.models
                : categories.builders
              ).map((category) => (
                <Button
                  key={category}
                  variant={
                    (category === 'All Categories' &&
                      selectedCategory === 'all') ||
                    category === selectedCategory
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                  onClick={() =>
                    setSelectedCategory(
                      category === 'All Categories' ? 'all' : category,
                    )
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Model Performance Ranking</CardTitle>
                    <CardDescription>
                      Win rate performance dari AI models terbaik untuk coding
                      tasks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : data ? (
                  <LeaderboardList
                    items={getFilteredData(data.modelPerformance)}
                  />
                ) : (
                  <ErrorState onRetry={handleRefresh} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builders">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Builder Performance Ranking</CardTitle>
                    <CardDescription>
                      Win rate performance dari AI builders dan coding tools
                      terbaik
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : data ? (
                  <LeaderboardList
                    items={getFilteredData(data.builderPerformance)}
                  />
                ) : (
                  <ErrorState onRetry={handleRefresh} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4 lg:p-5"
        >
          <Skeleton className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
          <Skeleton className="h-10 w-10 rounded-xl sm:h-12 sm:w-12" />
          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-4 w-24 sm:h-5 sm:w-40" />
              <Skeleton className="h-3 w-12 rounded-full sm:h-4 sm:w-16" />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Skeleton className="h-2 w-16 sm:h-3 sm:w-20" />
              <Skeleton className="h-2 w-full rounded-full sm:h-3" />
            </div>
          </div>
          <Skeleton className="h-10 w-16 rounded-lg sm:h-12 sm:w-20" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Unable to Load Data</h3>
      <p className="text-muted-foreground mb-4">
        Terjadi error saat mengambil data leaderboard.
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

function LeaderboardList({ items }: { items: LeaderboardItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="bg-muted/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Trophy className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No Results Found</h3>
        <p className="text-muted-foreground">
          Tidak ada data yang match dengan filter kategori yang dipilih.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {items.map((item, index) => (
        <LeaderboardItem key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}

function LeaderboardItem({
  item,
  index,
}: {
  item: LeaderboardItem
  index: number
}) {
  const getRankIcon = (position: number) => {
    if (position === 0) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg sm:h-10 sm:w-10">
          <Trophy className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
      )
    }
    if (position === 1) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg sm:h-10 sm:w-10">
          <Trophy className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
      )
    }
    if (position === 2) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg sm:h-10 sm:w-10">
          <Trophy className="h-4 w-4 text-white sm:h-5 sm:w-5" />
        </div>
      )
    }
    return (
      <span className="text-muted-foreground group-hover:text-foreground text-sm font-bold transition-colors sm:text-base lg:text-lg">
        #{position + 1}
      </span>
    )
  }

  return (
    <div className="group hover:bg-accent/50 flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 hover:shadow-md sm:gap-4 sm:p-4 lg:p-5">
      <div className="bg-muted/20 group-hover:bg-accent/40 flex h-10 w-10 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12">
        {getRankIcon(index)}
      </div>

      <div className="bg-card border-border flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md sm:h-12 sm:w-12 sm:p-2">
        <Image
          unoptimized
          width={32}
          height={32}
          src={item.icon}
          alt={`${item.name} icon`}
          className="h-6 w-6 object-contain transition-all duration-300 sm:h-8 sm:w-8"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const fallback = document.createElement('span')
            fallback.className =
              'text-xs sm:text-sm font-semibold text-muted-foreground'
            fallback.textContent = item.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
            target.parentElement?.appendChild(fallback)
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2 sm:gap-3">
          <h3 className="group-hover:text-foreground truncate text-sm font-bold transition-colors sm:text-base lg:text-lg">
            {item.name}
          </h3>
          <Badge variant="outline" className="shrink-0 text-xs font-medium">
            {item.category}
          </Badge>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between sm:mb-2">
              <span className="text-muted-foreground text-xs sm:text-sm">
                Win Rate
              </span>
              <span className="text-foreground text-base font-bold sm:text-lg">
                {item.winRate}%
              </span>
            </div>
            <div className="relative">
              <Progress
                value={item.winRate}
                className="bg-muted h-2 rounded-full sm:h-3"
              />
            </div>
          </div>
          {item.eloRating && (
            <div className="bg-muted/50 border-border/50 shrink-0 rounded-lg border px-2 py-1.5 text-center sm:px-3 sm:py-2 sm:text-right">
              <div className="text-muted-foreground mb-0.5 text-xs sm:mb-1">
                ELO Rating
              </div>
              <div className="text-sm font-bold sm:text-base lg:text-lg">
                {item.eloRating}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

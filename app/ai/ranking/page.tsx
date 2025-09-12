'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, Trophy, Zap } from 'lucide-react'

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
  const { data, error, isLoading, isValidating, mutate } = useSWR<LeaderboardData>(
    '/api/designarena',
    fetcher,
    {
      refreshInterval: POLLING_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      errorRetryCount: 3
    }
  )
  
  // Categories untuk filtering
  const categories = {
    models: ['All Categories', 'AI Model'],
    builders: ['All Categories', 'AI Builder', 'Design Tool', 'Code Editor', 'AI Platform']
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
    return items.filter(item => item.category === selectedCategory)
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
      
      <Navbar showNavigation={true} scrollToSection={scrollToSection} />
      
      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="relative inline-block mb-4 sm:mb-6">
            {/* Clean background without rainbow effects */}
            <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 bg-background/95 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-border/50 shadow-lg">
              {/* Clean title with standard foreground color */}
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-foreground tracking-tight">
                AI Coding Leaderboard
              </h1>
            </div>
          </div>
          <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            Ranking terbaru performance AI Models dan AI Builders untuk coding. 
            Data real-time dari DesignArena untuk membantu lo pilih tools AI terbaik! 🚀
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
            <Button
              onClick={handleRefresh}
              disabled={isLoading || isValidating}
              variant="outline"
              size="sm"
              className="gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isValidating ? 'animate-spin' : ''}`} />
              {isValidating ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            {data && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Last updated: {formatLastUpdated(data.lastUpdated)}
              </p>
            )}
            {error && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <p className="text-xs">Error loading data</p>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-4 mb-6 sm:mb-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-sm sm:max-w-md grid-cols-2">
                <TabsTrigger value="models" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  AI Models
                </TabsTrigger>
                <TabsTrigger value="builders" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                  AI Builders
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(activeTab === 'models' ? categories.models : categories.builders).map((category) => (
                <Button
                  key={category}
                  variant={
                    (category === 'All Categories' && selectedCategory === 'all') ||
                    category === selectedCategory
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  onClick={() => setSelectedCategory(category === 'All Categories' ? 'all' : category)}
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
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Model Performance Ranking</CardTitle>
                    <CardDescription>
                      Win rate performance dari AI models terbaik untuk coding tasks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : data ? (
                  <LeaderboardList items={getFilteredData(data.modelPerformance)} />
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
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Builder Performance Ranking</CardTitle>
                    <CardDescription>
                      Win rate performance dari AI builders dan coding tools terbaik
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : data ? (
                  <LeaderboardList items={getFilteredData(data.builderPerformance)} />
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
        <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 border rounded-xl animate-pulse">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
          <div className="flex-1 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-4 sm:h-5 w-24 sm:w-40" />
              <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 rounded-full" />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Skeleton className="h-2 sm:h-3 w-16 sm:w-20" />
              <Skeleton className="h-2 sm:h-3 w-full rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-16 sm:h-12 sm:w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
      <p className="text-muted-foreground mb-4">
        Terjadi error saat mengambil data leaderboard. 
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  )
}

function LeaderboardList({ items }: { items: LeaderboardItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted/20 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
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

function LeaderboardItem({ item, index }: { item: LeaderboardItem; index: number }) {
  
  const getRankIcon = (position: number) => {
    if (position === 0) {
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }
    if (position === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }
    if (position === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )
    }
    return (
      <span className="text-sm sm:text-base lg:text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">
        #{position + 1}
      </span>
    )
  }

  return (
    <div
      className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 border rounded-xl hover:bg-accent/50 transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/20 group-hover:bg-accent/40 transition-colors">
        {getRankIcon(index)}
      </div>

      <div className="w-10 h-10 sm:w-12 sm:h-12 p-1.5 sm:p-2 rounded-xl bg-card border border-border group-hover:scale-110 transition-all duration-300 group-hover:shadow-md flex items-center justify-center overflow-hidden">
        <img 
          src={item.icon} 
          alt={`${item.name} icon`}
          className="w-6 h-6 sm:w-8 sm:h-8 object-contain transition-all duration-300"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = document.createElement('span');
            fallback.className = 'text-xs sm:text-sm font-semibold text-muted-foreground';
            fallback.textContent = item.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
            target.parentElement?.appendChild(fallback);
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold truncate group-hover:text-foreground transition-colors">
            {item.name}
          </h3>
          <Badge 
            variant="outline" 
            className="text-xs font-medium shrink-0"
          >
            {item.category}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Win Rate</span>
              <span className="font-bold text-base sm:text-lg text-foreground">
                {item.winRate}%
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={item.winRate} 
                className="h-2 sm:h-3 rounded-full bg-muted"
              />
            </div>
          </div>
          {item.eloRating && (
            <div className="text-center sm:text-right px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-lg border border-border/50 shrink-0">
              <div className="text-xs text-muted-foreground mb-0.5 sm:mb-1">ELO Rating</div>
              <div className="font-bold text-sm sm:text-base lg:text-lg">{item.eloRating}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
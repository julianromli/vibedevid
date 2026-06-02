'use client'

import {
  IconCalendar,
  IconEye,
  IconFolder,
  IconHeart,
  IconMessageCircle,
  IconNews,
  IconUsers,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getAnalyticsTimeSeries,
  getMostViewedPosts,
  getMostViewedProjects,
  getPlatformStats,
  type PlatformStats,
  type TrendingItem,
} from '@/lib/actions/analytics'

interface TimeSeriesPoint {
  date: string
  views: number
  likes: number
  comments: number
}

interface AnalyticsData {
  stats: PlatformStats | null
  timeSeries: TimeSeriesPoint[]
  topProjects: TrendingItem[]
  topPosts: TrendingItem[]
}

export default function Overview() {
  const [data, setData] = useState<AnalyticsData>({
    stats: null,
    timeSeries: [],
    topProjects: [],
    topPosts: [],
  })
  const [days, setDays] = useState<number>(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchAnalyticsData(days)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [days])

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-destructive text-lg">Error loading analytics</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data.stats?.total_users || 0}
          newToday={data.stats?.new_users_today || 0}
          icon={IconUsers}
          loading={loading}
        />
        <StatCard
          title="Total Projects"
          value={data.stats?.total_projects || 0}
          newToday={data.stats?.new_projects_today || 0}
          icon={IconFolder}
          loading={loading}
        />
        <StatCard
          title="Total Posts"
          value={data.stats?.total_posts || 0}
          newToday={data.stats?.new_posts_today || 0}
          icon={IconNews}
          loading={loading}
        />
        <StatCard
          title="Total Comments"
          value={data.stats?.total_comments || 0}
          icon={IconMessageCircle}
          loading={loading}
        />
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Likes"
          value={data.stats?.total_likes || 0}
          icon={IconHeart}
          loading={loading}
          variant="secondary"
        />
        <StatCard
          title="Total Views"
          value={data.stats?.total_views || 0}
          icon={IconEye}
          loading={loading}
          variant="secondary"
        />
        <Card className="flex flex-col justify-center">
          <CardHeader className="pb-2">
            <CardDescription>Date Range</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={days.toString()}
              onValueChange={(value) => setDays(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <IconCalendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
          <CardDescription>Views, likes, and comments over the last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full"
            >
              <LineChart data={data.timeSeries}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="likes"
                  stroke="var(--color-likes)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="comments"
                  stroke="var(--color-comments)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopItemsCard
          title="Top Projects"
          description="Most viewed projects"
          items={data.topProjects}
          loading={loading}
        />
        <TopItemsCard
          title="Top Blog Posts"
          description="Most viewed blog posts"
          items={data.topPosts}
          loading={loading}
        />
      </div>
    </div>
  )
}

async function fetchAnalyticsData(days: number): Promise<AnalyticsData> {
  const [statsResult, timeSeriesResult, projectsResult, postsResult] = await Promise.all([
    getPlatformStats(),
    getAnalyticsTimeSeries(days),
    getMostViewedProjects(10),
    getMostViewedPosts(10),
  ])

  let stats: PlatformStats | null = null
  if (statsResult.success && statsResult.stats) {
    stats = statsResult.stats
  }

  let timeSeries: TimeSeriesPoint[] = []
  if (timeSeriesResult.success && timeSeriesResult.data) {
    timeSeries = timeSeriesResult.data.dates.map((date, i) => ({
      date: formatDate(date),
      views: timeSeriesResult.data?.views[i] || 0,
      likes: timeSeriesResult.data?.likes[i] || 0,
      comments: timeSeriesResult.data?.comments[i] || 0,
    }))
  }

  return {
    stats,
    timeSeries,
    topProjects: projectsResult.success && projectsResult.projects ? projectsResult.projects : [],
    topPosts: postsResult.success && postsResult.posts ? postsResult.posts : [],
  }
}

interface StatCardProps {
  title: string
  value: number
  newToday?: number
  icon: React.ElementType
  loading: boolean
  variant?: 'default' | 'secondary'
}

function StatCard({ title, value, newToday, icon: Icon, loading, variant = 'default' }: StatCardProps) {
  return (
    <Card className={variant === 'secondary' ? 'bg-muted/50' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="font-bold text-2xl">{value.toLocaleString()}</div>
            {newToday !== undefined && newToday > 0 && (
              <p className="text-muted-foreground text-xs">+{newToday} today</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface TopItemsCardProps {
  title: string
  description: string
  items: TrendingItem[]
  loading: boolean
}

function TopItemsCard({ title, description, items, loading }: TopItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No items yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground text-sm">by {item.author}</div>
                  </TableCell>
                  <TableCell className="text-right">{item.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.likes.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

const chartConfig = {
  views: {
    label: 'Views',
    color: 'hsl(var(--chart-1))',
  },
  likes: {
    label: 'Likes',
    color: 'hsl(var(--chart-2))',
  },
  comments: {
    label: 'Comments',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

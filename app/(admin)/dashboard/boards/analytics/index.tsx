'use client'

import {
  IconCalendarEvent,
  IconFolder,
  IconMessageCircle,
  IconNews,
  IconShield,
  IconStar,
  IconUsers,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { type ElementType, type ReactNode, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type CategoryCount,
  type CommunityHealthCounts,
  type ContentGrowthPoint,
  type RoleCount,
  type StatusCount,
} from '@/lib/actions/analytics'
import {
  getAnalyticsTimeSeriesFn,
  getCommunityHealthCountsFn,
  getContentGrowthTimeSeriesFn,
  getPeriodSignupStatsFn,
  getPostsByStatusFn,
  getProjectsByCategoryFn,
  getUsersByRoleFn,
} from '@/lib/actions/analytics.functions'

interface EngagementPoint {
  date: string
  views: number
  likes: number
  comments: number
}

const contentGrowthConfig = {
  users: { label: 'New users', color: 'hsl(var(--chart-1))' },
  projects: { label: 'New projects', color: 'hsl(var(--chart-2))' },
  posts: { label: 'New posts', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

const engagementConfig = {
  views: { label: 'Views', color: 'hsl(var(--chart-1))' },
  likes: { label: 'Likes', color: 'hsl(var(--chart-2))' },
  comments: { label: 'Comments', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

const categoryChartConfig = {
  count: { label: 'Projects', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

const roleChartConfig = {
  count: { label: 'Users', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig

const statusChartConfig = {
  count: { label: 'Posts', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [periodStats, setPeriodStats] = useState({ new_users: 0, new_projects: 0, new_posts: 0 })
  const [contentGrowth, setContentGrowth] = useState<ContentGrowthPoint[]>([])
  const [engagement, setEngagement] = useState<EngagementPoint[]>([])
  const [categories, setCategories] = useState<CategoryCount[]>([])
  const [roles, setRoles] = useState<RoleCount[]>([])
  const [postStatuses, setPostStatuses] = useState<StatusCount[]>([])
  const [health, setHealth] = useState<CommunityHealthCounts | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [periodResult, growthResult, engagementResult, categoryResult, roleResult, statusResult, healthResult] =
          await Promise.all([
            getPeriodSignupStatsFn({ data: { days } }),
            getContentGrowthTimeSeriesFn({ data: { days } }),
            getAnalyticsTimeSeriesFn({ data: { days } }),
            getProjectsByCategoryFn({ data: { limit: 8 } }),
            getUsersByRoleFn(),
            getPostsByStatusFn(),
            getCommunityHealthCountsFn(),
          ])

        if (!periodResult.success) throw new Error(periodResult.error)
        if (!growthResult.success) throw new Error(growthResult.error)
        if (!engagementResult.success) throw new Error(engagementResult.error)
        if (!categoryResult.success) throw new Error(categoryResult.error)
        if (!roleResult.success) throw new Error(roleResult.error)
        if (!statusResult.success) throw new Error(statusResult.error)
        if (!healthResult.success) throw new Error(healthResult.error)

        setPeriodStats({
          new_users: periodResult.new_users || 0,
          new_projects: periodResult.new_projects || 0,
          new_posts: periodResult.new_posts || 0,
        })
        setContentGrowth(
          (growthResult.data || []).map((point) => ({
            ...point,
            date: formatChartDate(point.date),
          })),
        )

        if (engagementResult.data) {
          setEngagement(
            engagementResult.data.dates.map((date, i) => ({
              date: formatChartDate(date),
              views: engagementResult.data?.views[i] || 0,
              likes: engagementResult.data?.likes[i] || 0,
              comments: engagementResult.data?.comments[i] || 0,
            })),
          )
        }

        setCategories(categoryResult.categories || [])
        setRoles(roleResult.roles || [])
        setPostStatuses(statusResult.statuses || [])
        setHealth(healthResult.counts || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    load()
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">Platform analytics</h2>
          <p className="text-muted-foreground text-sm">Growth, engagement, and community breakdown from live data.</p>
        </div>
        <Select
          value={days.toString()}
          onValueChange={(value) => setDays(Number(value))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PeriodStatCard
          title="New signups"
          value={periodStats.new_users}
          icon={IconUsers}
          loading={loading}
        />
        <PeriodStatCard
          title="New projects"
          value={periodStats.new_projects}
          icon={IconFolder}
          loading={loading}
        />
        <PeriodStatCard
          title="New blog posts"
          value={periodStats.new_posts}
          icon={IconNews}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Content growth"
          description={`New users, projects, and posts in the last ${days} days`}
          loading={loading}
        >
          <ChartContainer
            config={contentGrowthConfig}
            className="h-[280px] w-full"
          >
            <LineChart data={contentGrowth}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="projects"
                stroke="var(--color-projects)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="var(--color-posts)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Engagement activity"
          description={`Views, likes, and comments in the last ${days} days`}
          loading={loading}
        >
          <ChartContainer
            config={engagementConfig}
            className="h-[280px] w-full"
          >
            <LineChart data={engagement}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
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
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Projects by category"
          description="Distribution of submitted projects"
          loading={loading}
        >
          <ChartContainer
            config={categoryChartConfig}
            className="h-[240px] w-full"
          >
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ left: 8, right: 8 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Users by role"
          description="Admin, moderator, and member accounts"
          loading={loading}
        >
          <ChartContainer
            config={roleChartConfig}
            className="h-[240px] w-full"
          >
            <BarChart data={roles}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Blog posts by status"
          description="Draft, published, and archived posts"
          loading={loading}
        >
          <ChartContainer
            config={statusChartConfig}
            className="h-[240px] w-full"
          >
            <BarChart data={postStatuses}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-3 font-medium text-sm">Community health</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HealthCard
            title="Pending events"
            value={health?.pending_events}
            icon={IconCalendarEvent}
            href="/dashboard?tab=events-approval"
            loading={loading}
            highlight={!!health && health.pending_events > 0}
          />
          <HealthCard
            title="Pending reports"
            value={health?.pending_reports}
            icon={IconMessageCircle}
            href="/dashboard?tab=comments"
            loading={loading}
            highlight={!!health && health.pending_reports > 0}
          />
          <HealthCard
            title="Suspended users"
            value={health?.suspended_users}
            icon={IconShield}
            href="/dashboard?tab=users"
            loading={loading}
          />
          <HealthCard
            title="Featured projects"
            value={health?.featured_projects}
            icon={IconStar}
            href="/dashboard?tab=projects"
            loading={loading}
          />
          <HealthCard
            title="Featured posts"
            value={health?.featured_posts}
            icon={IconStar}
            href="/dashboard?tab=blog"
            loading={loading}
          />
          <HealthCard
            title="Live events"
            value={health?.approved_events}
            icon={IconCalendarEvent}
            href="/dashboard?tab=events-approval"
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PeriodStatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string
  value: number
  icon: ElementType
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="font-bold text-2xl">{value.toLocaleString()}</div>
        )}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  loading,
  children,
}: {
  title: string
  description: string
  loading: boolean
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-[280px] w-full" /> : children}</CardContent>
    </Card>
  )
}

function HealthCard({
  title,
  value,
  icon: Icon,
  href,
  loading,
  highlight = false,
}: {
  title: string
  value?: number
  icon: ElementType
  href: string
  loading: boolean
  highlight?: boolean
}) {
  return (
    <Link to={href}>
      <Card
        className={
          highlight
            ? 'border-amber-500/50 bg-amber-500/5 transition-colors hover:bg-amber-500/10'
            : 'transition-colors hover:bg-muted/50'
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="font-bold text-2xl">{(value ?? 0).toLocaleString()}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

'use client'

import { FileText, Heart, LayoutGrid, Eye } from 'lucide-react'

interface ProfileStatsProps {
  stats: {
    projects: number
    posts: number
    likes: number
    views: number
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const statItems = [
    {
      label: 'Projects',
      value: stats.projects,
      icon: LayoutGrid,
    },
    {
      label: 'Posts',
      value: stats.posts,
      icon: FileText,
    },
    {
      label: 'Likes',
      value: stats.likes,
      icon: Heart,
    },
    {
      label: 'Views',
      value: stats.views,
      icon: Eye,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-card border-border group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{item.label}</p>
              <h3 className="text-foreground mt-1 text-2xl font-bold">{item.value.toLocaleString()}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <item.icon className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

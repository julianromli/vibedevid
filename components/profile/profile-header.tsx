'use client'

import { IconBrandGithub, IconBrandInstagram, IconBrandThreads, IconBrandX, IconWorld } from '@tabler/icons-react'
import { Calendar, Edit, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { UserDisplayName } from '@/components/ui/user-display-name'

interface ProfileHeaderUser {
  id?: string
  username?: string | null
  display_name?: string | null
  name?: string | null
  bio?: string | null
  avatar?: string | null
  avatar_url?: string | null
  location?: string | null
  website?: string | null
  github_url?: string | null
  x_url?: string | null
  twitter_url?: string | null
  instagram_url?: string | null
  threads_url?: string | null
  joined_at: string | number | Date
  role?: number | null
}

interface ProfileHeaderProps {
  user: ProfileHeaderUser | null
  isOwner: boolean
  onEdit: () => void
}

export function ProfileHeader({ user, isOwner, onEdit }: ProfileHeaderProps) {
  if (!user) return null

  const socialLinks = [
    { label: 'Website', href: user.website, Icon: IconWorld },
    { label: 'GitHub', href: user.github_url, Icon: IconBrandGithub },
    { label: 'X', href: user.x_url || user.twitter_url, Icon: IconBrandX },
    { label: 'Instagram', href: user.instagram_url, Icon: IconBrandInstagram },
    { label: 'Threads', href: user.threads_url, Icon: IconBrandThreads },
  ].flatMap((link) => (link.href ? [{ ...link, href: link.href }] : []))
  const displayName = user.display_name || user.username || 'User'
  const avatarUser = {
    id: user.id,
    username: user.username || undefined,
    display_name: user.display_name || undefined,
    name: user.name || undefined,
    avatar_url: user.avatar_url || undefined,
    avatar: user.avatar || undefined,
  }

  return (
    <div className="bg-card border-border mb-6 rounded-xl border p-6 sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <UserAvatar
            user={avatarUser}
            size="xl"
            className="h-32 w-32 border-4 border-background shadow-xl"
          />
          {isOwner && (
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="mb-2">
            <h1 className="text-3xl font-bold leading-tight">
              <UserDisplayName
                name={displayName}
                role={user.role}
              />
            </h1>
            <p className="text-muted-foreground text-lg font-medium">@{user.username}</p>
          </div>

          <p className="text-foreground/90 mb-6 max-w-2xl text-base leading-relaxed">
            {user.bio || 'No bio available'}
          </p>

          <div className="text-muted-foreground mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm md:justify-start">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{user.location || 'Location not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                Joined{' '}
                {new Date(user.joined_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            {socialLinks.map(({ label, href, Icon }) => (
              <Button
                key={label}
                variant="outline"
                size="icon"
                className="h-9 w-9"
                asChild
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{label}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

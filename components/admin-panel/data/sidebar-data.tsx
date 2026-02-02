import {
  IconCalendarEvent,
  IconFolder,
  IconLayoutDashboard,
  IconMessageCircle,
  IconNews,
  IconUsers,
} from '@tabler/icons-react'
import type { NavGroup } from '../types'

// Navigation groups for admin sidebar
export const sidebarData: { navGroups: NavGroup[] } = {
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          icon: IconLayoutDashboard,
          items: [
            {
              title: 'Overview',
              url: '/admin/dashboard',
            },
          ],
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          title: 'Projects',
          url: '/admin/dashboard?tab=projects',
          icon: IconFolder,
        },
        {
          title: 'Blog Posts',
          url: '/admin/dashboard?tab=blog',
          icon: IconNews,
        },
        {
          title: 'Events',
          url: '/admin/dashboard?tab=events-approval',
          icon: IconCalendarEvent,
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          title: 'Users',
          url: '/admin/dashboard?tab=users',
          icon: IconUsers,
        },
        {
          title: 'Comments',
          url: '/admin/dashboard?tab=comments',
          icon: IconMessageCircle,
        },
      ],
    },
  ],
}

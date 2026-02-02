import {
  IconApps,
  IconBarrierBlock,
  IconBug,
  IconChecklist,
  IconCode,
  IconCoin,
  IconError404,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconNotification,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUser,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react'
import type { NavGroup } from '../types'

// Navigation groups only - user and teams data now comes from real auth
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
              url: '/dashboard',
            },
          ],
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Users',
          url: '/users',
          icon: IconUsers,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: IconLockAccess,
          items: [
            {
              title: 'Login',
              url: '/login',
            },
            {
              title: 'Register',
              url: '/register',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
          ],
        },
        {
          title: 'Errors',
          icon: IconBug,
          items: [
            {
              title: 'Unauthorized',
              url: '/401',
              icon: IconLock,
            },
            {
              title: 'Forbidden',
              url: '/403',
              icon: IconUserOff,
            },
            {
              title: 'Not Found',
              url: '/404',
              icon: IconError404,
            },
            {
              title: 'Internal Server Error',
              url: '/error',
              icon: IconServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/503',
              icon: IconBarrierBlock,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'General',
              icon: IconTool,
              url: '/settings',
            },
            {
              title: 'Profile',
              icon: IconUser,
              url: '/settings/profile',
            },
            {
              title: 'Billing',
              icon: IconCoin,
              url: '/settings/billing',
            },
            {
              title: 'Plans',
              icon: IconChecklist,
              url: '/settings/plans',
            },
            {
              title: 'Connected Apps',
              icon: IconApps,
              url: '/settings/connected-apps',
            },
            {
              title: 'Notifications',
              icon: IconNotification,
              url: '/settings/notifications',
            },
          ],
        },
        {
          title: 'Developers',
          icon: IconCode,
          items: [
            {
              title: 'Overview',
              url: '/developers/overview',
            },
            {
              title: 'API Keys',
              url: '/developers/api-keys',
            },
            {
              title: 'Webhooks',
              url: '/developers/webhooks',
            },
            {
              title: 'Events/Logs',
              url: '/developers/events-&-logs',
            },
          ],
        },
      ],
    },
  ],
}

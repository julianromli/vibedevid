import {
  IconCalendarEvent,
  IconFolder,
  IconLayoutDashboard,
  IconMessageCircle,
  IconNews,
  IconShield,
  IconUsers,
} from "@tabler/icons-react";
import type { NavGroup } from "../types";

// Navigation groups for admin sidebar
export const sidebarData: { navGroups: NavGroup[] } = {
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          icon: IconLayoutDashboard,
          items: [
            {
              title: "Overview",
              url: "/dashboard",
            },
            {
              title: "Analytics",
              url: "/dashboard?tab=analytics",
            },
          ],
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          title: "Projects",
          url: "/dashboard?tab=projects",
          icon: IconFolder,
        },
        {
          title: "Blog Posts",
          url: "/dashboard?tab=blog",
          icon: IconNews,
        },
        {
          title: "Events",
          url: "/dashboard?tab=events-approval",
          icon: IconCalendarEvent,
        },
      ],
    },
    {
      title: "Community",
      items: [
        {
          title: "Users",
          url: "/dashboard?tab=users",
          icon: IconUsers,
        },
        {
          title: "Admin management",
          url: "/dashboard?tab=admin-management",
          icon: IconShield,
        },
        {
          title: "Comments",
          url: "/dashboard?tab=comments",
          icon: IconMessageCircle,
        },
      ],
    },
  ],
};

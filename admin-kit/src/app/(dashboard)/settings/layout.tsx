import {
  IconApps,
  IconChecklist,
  IconCoin,
  IconNotification,
  IconTool,
  IconUser,
} from "@tabler/icons-react"
import { Header } from "@/components/layout/header"
import SidebarNav from "./components/sidebar-nav"

const sidebarNavItems = [
  {
    title: "General",
    icon: <IconTool />,
    href: "/settings",
  },
  {
    title: "Profile",
    icon: <IconUser />,
    href: "/settings/profile",
  },
  {
    title: "Billing",
    icon: <IconCoin />,
    href: "/settings/billing",
  },
  {
    title: "Plans",
    icon: <IconChecklist />,
    href: "/settings/plans",
  },
  {
    title: "Connected Apps",
    icon: <IconApps />,
    href: "/settings/connected-apps",
  },
  {
    title: "Notifications",
    icon: <IconNotification />,
    href: "/settings/notifications",
  },
]

interface Props {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: Props) {
  return (
    <>
      <Header />

      <div
        data-layout="fixed"
        className="flex flex-1 flex-col gap-4 overflow-hidden p-4"
      >
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Update account preferences and manage integrations.
          </p>
        </div>
        <div className="flex flex-1 flex-col space-y-8 overflow-auto md:space-y-2 md:overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="lg:sticky lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex w-full overflow-y-scroll p-1 pr-4 md:overflow-y-hidden">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

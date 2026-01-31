import {
  IconBrandSpeedtest,
  IconClipboardData,
  IconEye,
  IconFileBarcode,
} from "@tabler/icons-react"

export const dashboard3Stats = [
  {
    label: "Session",
    icon: <IconClipboardData size={18} className="text-blue-500" />,
    stats: 6132,
    percentage: 90,
    type: "up",
  },
  {
    label: "Page Views",
    icon: <IconEye size={18} className="text-indigo-500" />,
    stats: 11236,
    percentage: 40,
    type: "down",
  },
  {
    label: "Average",
    icon: <IconFileBarcode size={18} className="text-orange-500" />,
    stats: 46,
    percentage: 22,
    type: "up",
  },
  {
    label: "Bounce Rate",
    icon: <IconBrandSpeedtest size={18} className="text-red-500" />,
    stats: 6132,
    percentage: 30,
    type: "down",
  },
] as const

export type Dashboard3Stats = (typeof dashboard3Stats)[number]

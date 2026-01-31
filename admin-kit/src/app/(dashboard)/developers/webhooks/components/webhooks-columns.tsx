"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import LongText from "@/components/long-text"
import { Webhook } from "../data/schema"
import { DataTableColumnHeader } from "./data-table-column-header"

export const columns: ColumnDef<Webhook>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CopyButton
          className="size-6 scale-100 rounded-full"
          text="Copt Api Key"
        />
        <LongText className="w-28">{row.getValue("id")}</LongText>
        <div className="w-3 max-w-36"></div>
      </div>
    ),
    meta: { className: cn("w-44") },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "url",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="URL Endpoint" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/developers/webhooks/${row.original.id}`}
        className="underline decoration-dashed underline-offset-2 hover:decoration-solid"
      >
        <LongText className="min-w-40">{row.getValue("url")}</LongText>
      </Link>
    ),
    meta: { className: cn("min-w-40") },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "events",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Events" />
    ),
    cell: ({ row }) => {
      const { events } = row.original
      return <div className="text-center">{events.length}</div>
    },
    meta: { className: "w-20 text-center" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "authType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <LongText className="capitalize">{row.getValue("authType")}</LongText>
    ),
    meta: { className: "w-32" },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const { status } = row.original
      return (
        <div>
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              status === "enabled" &&
                "border-green-300 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50"
            )}
          >
            {status}
          </Badge>
        </div>
      )
    },
    meta: { className: "w-28" },
    enableSorting: false,
    enableHiding: false,
  },
]

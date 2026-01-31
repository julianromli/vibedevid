"use client"

import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "../../components/data-table-column-header"
import { WebhookLog } from "../../data/schema"
import { WebhookStatusIcon } from "./webhook-status-icon"

export const columns: ColumnDef<WebhookLog>[] = [
  {
    accessorKey: "datetime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => {
      const { datetime } = row.original
      return <div>{format(datetime, "dd MMM, yyyy h:mma")}</div>
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actions" />
    ),
    cell: ({ row }) => {
      const { succeeded } = row.original
      return (
        <div className="flex items-center gap-1.5">
          <WebhookStatusIcon status={succeeded} />
          <span className="font-mono">{row.getValue("action")}</span>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]

'use client'

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { IconCalendarEvent } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { approveEvent, rejectEvent } from '@/lib/actions/events'
import type { AIEvent } from '@/types/events'

interface PendingEventsTableProps {
  events: AIEvent[]
}

export function PendingEventsTable({ events }: PendingEventsTableProps) {
  const router = useRouter()
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  async function handleApprove(eventId: string) {
    setProcessingIds((prev) => new Set(prev).add(eventId))
    const result = await approveEvent(eventId)

    if (result.success) {
      toast.success('Event approved successfully')
      // Clear processing state before refresh
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to approve event')
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  async function handleReject(eventId: string) {
    if (!confirm('Are you sure? This will permanently delete the event.')) return

    setProcessingIds((prev) => new Set(prev).add(eventId))
    const result = await rejectEvent(eventId)

    if (result.success) {
      toast.success('Event rejected and deleted')
      // Clear processing state before refresh
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to reject event')
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  const columns: ColumnDef<AIEvent>[] = [
    {
      accessorKey: 'name',
      header: 'Event Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="secondary">{row.getValue('category')}</Badge>,
    },
    {
      accessorKey: 'date',
      header: 'Event Date',
      cell: ({ row }) => {
        const date = new Date(row.getValue('date'))
        return <div className="text-muted-foreground">{date.toLocaleDateString('id-ID')}</div>
      },
    },
    {
      accessorKey: 'organizer',
      header: 'Organizer',
      cell: ({ row }) => <div>{row.getValue('organizer')}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const event = row.original
        const isProcessing = processingIds.has(event.id)

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleApprove(event.id)}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleReject(event.id)}
            >
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Events</CardTitle>
        <CardDescription>
          {events.length} event{events.length !== 1 ? 's' : ''} awaiting approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconCalendarEvent size={48} className="text-muted-foreground mb-4" />
            <div className="text-muted-foreground font-medium">No pending events</div>
            <div className="text-sm text-muted-foreground mt-1">All events have been reviewed</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

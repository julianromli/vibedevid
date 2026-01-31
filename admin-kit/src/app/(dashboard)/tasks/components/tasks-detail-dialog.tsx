"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { labels, priorities, statuses } from "../data/data"
import { Task } from "../data/schema"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Task
}

export function TasksDetailDialog({ open, onOpenChange, currentRow }: Props) {
  const status = statuses.find((status) => status.value === currentRow.status)
  const priority = priorities.find(
    (priority) => priority.value === currentRow.priority
  )
  const label = labels.find((label) => label.value === currentRow.label)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-96">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            {currentRow.id}{" "}
            {label && <Badge variant="outline">{label.label}</Badge>}
          </DialogTitle>
          <DialogDescription>{currentRow.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {status && status.icon && (
            <div className="text-muted-foreground flex items-center gap-0.5">
              <status.icon className="mr-2 size-6" />
              <span className="text-sm font-semibold">{status?.label}</span>
            </div>
          )}
          {priority && priority.icon && (
            <div className="text-muted-foreground flex items-center gap-0.5">
              <priority.icon className="mr-2 size-6" />
              <span className="text-sm font-semibold">{priority.label}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

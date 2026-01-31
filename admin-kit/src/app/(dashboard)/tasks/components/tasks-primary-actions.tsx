"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TasksImportDialog } from "./tasks-import-dialog"
import { TasksMutateDrawer } from "./tasks-mutate-drawer"

export function TasksPrimaryActions() {
  const [open, setOpen] = useState(false)
  const [openImport, setOpenImport] = useState(false)
  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          className="font-semibold"
          onClick={() => setOpenImport(true)}
        >
          Import
        </Button>
        <Button className="font-semibold" onClick={() => setOpen(true)}>
          Create Task
        </Button>
      </div>

      <TasksMutateDrawer key="task-create" open={open} onOpenChange={setOpen} />
      <TasksImportDialog
        key="task-import"
        open={openImport}
        onOpenChange={setOpenImport}
      />
    </>
  )
}

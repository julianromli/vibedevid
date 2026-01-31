"use client"

import { IconMailPlus, IconUserPlus } from "@tabler/icons-react"
import useDialogState from "@/hooks/use-dialog-state"
import { Button } from "@/components/ui/button"
import { UsersActionDialog } from "./users-action-dialog"
import { UsersInviteDialog } from "./users-invite-dialog"

export function UserPrimaryActions() {
  const [open, setOpen] = useDialogState<"invite" | "add">(null)
  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          className="space-x-1"
          onClick={() => setOpen("invite")}
        >
          <span>Invite User</span> <IconMailPlus size={18} />
        </Button>
        <Button className="space-x-1" onClick={() => setOpen("add")}>
          <span>Add User</span> <IconUserPlus size={18} />
        </Button>
      </div>

      <UsersActionDialog
        key="user-add"
        open={open === "add"}
        onOpenChange={() => setOpen("add")}
      />

      <UsersInviteDialog
        key="user-invite"
        open={open === "invite"}
        onOpenChange={() => setOpen("invite")}
      />
    </>
  )
}

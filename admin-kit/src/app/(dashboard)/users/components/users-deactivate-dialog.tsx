"use client"

import { useState } from "react"
import { IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { User } from "../data/schema"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeactivateDialog({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const [value, setValue] = useState("")

  const handleDeactivate = () => {
    if (value.trim() !== currentRow.email) return

    onOpenChange(false)
    toast({
      title: "The following account has been deactivated:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">
            {JSON.stringify(currentRow, null, 2)}
          </code>
        </pre>
      ),
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDeactivate}
      disabled={value.trim() !== currentRow.email}
      title={
        <span className="text-destructive">
          <IconAlertTriangle
            className="stroke-destructive mr-1 inline-block"
            size={18}
          />{" "}
          Deactivate
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to deactivate the account with the email{" "}
            <span className="font-bold">{currentRow.email}</span>?
            <br />
            This action will remove the user with the role of{" "}
            <span className="font-bold">
              {currentRow.role.toUpperCase()}
            </span>{" "}
            from the system. Please proceed with caution.
          </p>

          <Label className="my-2">
            Email:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter the email to confirm deactivation."
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be carefull, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText="Deactivate"
      destructive
    />
  )
}

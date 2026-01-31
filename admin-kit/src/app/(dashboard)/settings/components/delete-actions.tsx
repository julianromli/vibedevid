"use client"

import { useState } from "react"
import { IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/confirm-dialog"

export function DeleteActions() {
  const [opened, setOpened] = useState(false)

  const [value, setValue] = useState("")
  const [type, setType] = useState<"delete" | "deactivate">("delete")

  const handleDeactivate = () => {
    setOpened(false)
    toast({
      title: "The following account has been deactivated:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">
            User {type === "delete" ? "Deleted" : "Deactivated"} Successfully
          </code>
        </pre>
      ),
    })
  }

  return (
    <>
      <Button
        onClick={() => {
          setOpened(true)
          setType("deactivate")
        }}
        variant="outline"
        type="button"
        className="text-red-500"
      >
        Deactivate Account
      </Button>

      <Button
        onClick={() => {
          setOpened(true)
          setType("delete")
        }}
        type="button"
        variant="destructive"
      >
        Delete Account
      </Button>

      <ConfirmDialog
        open={opened}
        onOpenChange={() => setOpened((prev) => !prev)}
        handleConfirm={handleDeactivate}
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
              Are you sure you want to {type} the account
              <br />
              {type === "delete" &&
                "This action will remove the user with the role from the system. Please proceed with caution."}
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
        confirmText={<p className="capitalize">{type}</p>}
        destructive
      />
    </>
  )
}

"use client"

import { EllipsisVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import useDialogState from "@/hooks/use-dialog-state"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { MutateWebhook } from "../../components/mutate-webhook"
import { Webhook } from "../../data/schema"

interface Props {
  data: Webhook
}

export function WebhookDetailActions({ data }: Props) {
  const router = useRouter()
  const [open, setOpen] = useDialogState<"update" | "disable" | "delete">(null)
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" className="scale-75">
            <EllipsisVertical size={16} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-[160px]">
          <DropdownMenuItem onClick={() => setOpen("update")}>
            Update details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("disable")}>
            Disable
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpen("delete")}
            className="text-red-500!"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MutateWebhook
        open={open === "update"}
        setOpen={() => setOpen("update")}
        currentWebhook={data}
      />

      <ConfirmDialog
        key="disable-webhook"
        className="max-w-sm"
        open={open === "disable"}
        onOpenChange={() => setOpen("disable")}
        handleConfirm={() => {
          setOpen(null)
          toast({
            title: "Webhook has been disabled successfully!",
          })

          // Artificially delay the redirect
          setTimeout(() => {
            router.push("/developers/webhooks")
          }, 1000)
        }}
        title="Disable Webhook"
        desc="Are you sure you want to disable this webhook?"
        confirmText="Disable webhook"
      />

      <ConfirmDialog
        key="delete-webhook"
        open={open === "delete"}
        onOpenChange={() => setOpen("delete")}
        handleConfirm={() => {
          setOpen(null)
          toast({
            variant: "destructive",
            title: "Webhook deleted successfully!",
          })

          // Artificially delay the redirect
          setTimeout(() => {
            router.push("/developers/webhooks")
          }, 1000)
        }}
        title="Delete Webhook"
        desc="Are you sure you want to delete this webhook? This action cannot be undone, and no future webhooks will be sent to this URL."
        confirmText="Delete"
        destructive
      />
    </>
  )
}

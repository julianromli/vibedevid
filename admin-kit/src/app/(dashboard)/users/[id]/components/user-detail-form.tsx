"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { IconTerminal } from "@tabler/icons-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import useDialogState from "@/hooks/use-dialog-state"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { UsersDeactivateDialog } from "../../components/users-deactivate-dialog"
import { User } from "../../data/schema"

interface Props {
  user: User
}

const accountDetailSchema = z.object({
  firstName: z.string().min(1, { message: "First Name is required." }),
  lastName: z.string().min(1, { message: "Last Name is required." }),
  phoneNumber: z.string().min(1, { message: "Phone number is required." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Email is invalid." }),
  role: z.string().min(1, { message: "Role is required." }),
})
type AccountDetailForm = z.infer<typeof accountDetailSchema>

export function UserDetailForm({ user }: Props) {
  const router = useRouter()
  const [isEdit, setIsEdit] = useState(false)
  const [open, setOpen] = useDialogState<"reset" | "deactivate">(null)

  const form = useForm<AccountDetailForm>({
    resolver: zodResolver(accountDetailSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      role: user.role ?? "",
      phoneNumber: user.phoneNumber ?? "",
    },
  })

  const onSubmit = (values: AccountDetailForm) => {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    })
    setIsEdit(false)
  }

  return (
    <div className="flex flex-col items-start gap-4 lg:flex-row">
      <Card className="w-full lg:max-w-2xl lg:flex-auto lg:basis-9/12">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Overview
            <Badge>Status: Active</Badge>
          </CardTitle>
          <CardDescription>
            Profile details, including name, contact, role, and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              id="user-edit-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-2 gap-x-4 gap-y-6"
            >
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="First name"
                        {...field}
                        readOnly={!isEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Last name"
                        {...field}
                        readOnly={!isEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-2 space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email"
                        {...field}
                        readOnly={!isEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2 space-y-1">
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Phone number"
                        {...field}
                        readOnly={!isEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="col-span-2 space-y-1">
                    <FormLabel>Role</FormLabel>
                    <FormDescription>
                      Indicates the user&apos;s assigned position and
                      corresponding permissions within the system.
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col"
                        disabled={!isEdit}
                      >
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value="superadmin" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Superadmin{" "}
                            <span className="text-muted-foreground text-sm">
                              (Full access to all features and settings.)
                            </span>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value="admin" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Admin{" "}
                            <span className="text-muted-foreground text-sm">
                              (Manage users, permissions, and content.)
                            </span>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value="manager" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Manager{" "}
                            <span className="text-muted-foreground text-sm">
                              (Oversee teams and manage related data.)
                            </span>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-y-0 space-x-3">
                          <FormControl>
                            <RadioGroupItem value="cashier" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Cashier{" "}
                            <span className="text-muted-foreground text-sm">
                              (Handle payments and view transactions.)
                            </span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert className="col-span-2">
                <IconTerminal className="h-4 w-4" />
                <AlertTitle>Last login at</AlertTitle>
                <AlertDescription>
                  11 December, 2024 | 10:45 PM
                </AlertDescription>
              </Alert>
            </form>
          </Form>
        </CardContent>
        {isEdit && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEdit(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-edit-form">
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card className="w-full lg:w-auto lg:max-w-md lg:flex-initial lg:basis-3/12">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage necessary user actions including edit, resend email, and
            account deactivation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <span>Update Account Info</span>
                <span className="text-muted-foreground text-xs leading-snug font-normal">
                  Update the user info by turning the switch on.
                </span>
              </div>
              <Switch
                checked={isEdit}
                onCheckedChange={() => setIsEdit((prev) => !prev)}
                className="scale-125"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <span>Send Password Reset Email</span>
                <span className="text-muted-foreground text-xs leading-snug font-normal">
                  Sends a reset link to the user&apos;s registered email.
                </span>
              </div>
              <Button
                variant="outline"
                className="border-destructive/75 text-destructive hover:bg-destructive/10 hover:text-destructive/90 dark:border-red-500 dark:text-red-400 dark:hover:text-red-600"
                onClick={() => setOpen("reset")}
              >
                Send Email
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-col space-y-1 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <span>Deactivate Account</span>
                <span className="text-muted-foreground text-xs leading-snug font-normal">
                  Disables the user&apos;s account, restricting access until
                  reactivated.
                </span>
              </div>
              <Button
                variant="destructive"
                onClick={() => setOpen("deactivate")}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        key="user-reset-password"
        open={open === "reset"}
        onOpenChange={() => setOpen("reset")}
        handleConfirm={() => {
          setOpen(null)
          toast({
            title: "The following task has been deleted:",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-white">
                  {JSON.stringify(user, null, 2)}
                </code>
              </pre>
            ),
          })
          router.push("/users")
        }}
        className="max-w-md"
        title={`Send Reset Password Email?`}
        desc={
          <>
            You are about to send a reset password email to{" "}
            <strong>{user.email}</strong>.
          </>
        }
        confirmText="Send"
      />

      <UsersDeactivateDialog
        key={`user-deactivate-${user.id}`}
        open={open === "deactivate"}
        onOpenChange={() => setOpen("deactivate")}
        currentRow={user}
      />
    </div>
  )
}

"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { IconHome, IconId, IconMessage2Question } from "@tabler/icons-react"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import Link from "next/link"
import { nofitySubmittedValues } from "@/lib/notify-submitted-values"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DeleteActions } from "./delete-actions"

const formSchema = z.object({
  font: z.string({
    required_error: "Font is required.",
  }),
  company_tax_id: z.string().min(1, {
    message: "Tax ID is required.",
  }),
  company_address: z.string().min(1, {
    message: "Company address is required.",
  }),
  company_logo: z
    .instanceof(File)
    .refine(
      (file) =>
        ["image/webp", "image/jpeg", "image/png", "image/svg+xml"].includes(
          file.type
        ),
      {
        message: "Only WebP, JPEG, PNG, or SVG files are allowed",
      }
    )
    .optional(),
})

export default function GeneralForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_tax_id: "",
      company_address: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    nofitySubmittedValues(values)
  }

  return (
    <Form {...form}>
      <div className="flex w-full flex-col items-start justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center">
        <div className="flex flex-col items-start text-sm">
          <p className="font-bold tracking-wide">
            Your application is currently on the free plan
          </p>
          <p className="text-muted-foreground font-medium">
            Paid plans offer higher usage limits, additional branches,and much
            more.Learn more{" "}
            <Link href="" className="underline">
              here
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <IconMessage2Question />
            Chat to us
          </Button>
          <Button variant="outline">Upgrade</Button>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-8">
        <FormField
          control={form.control}
          name="company_logo"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem className="flex flex-col items-start justify-between md:flex-row md:items-center">
              <div>
                <FormLabel>Company Logo</FormLabel>
                <FormDescription>Update your company logo.</FormDescription>
                <FormMessage />
              </div>
              <div className="flex items-center gap-2">
                {value && (
                  <Image
                    alt="company-logo"
                    width={35}
                    height={35}
                    className="h-[35px] w-[35px] rounded-md object-cover"
                    src={URL.createObjectURL(value)}
                  />
                )}
                <FormControl>
                  <Input
                    {...fieldProps}
                    type="file"
                    placeholder="Company Logo"
                    accept="image/webp,image/jpeg,image/png/image/svg+xml"
                    onChange={(event) =>
                      onChange(event.target.files && event.target.files[0])
                    }
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
        <Separator />
        <FormField
          control={form.control}
          name="font"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start justify-between md:flex-row md:items-center">
              <div>
                <FormLabel>System Font</FormLabel>
                <FormDescription>
                  Set the font you want to use in the dashboard.
                </FormDescription>
                <FormMessage />
              </div>

              <div>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="manrope">Manrope</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </div>
            </FormItem>
          )}
        />
        <Separator />
        <FormField
          control={form.control}
          name="company_tax_id"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start justify-between md:flex-row md:items-center">
              <div>
                <FormLabel>Business Tax ID</FormLabel>
                <FormDescription>Tax ID of the company.</FormDescription>
                <FormMessage />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <FormControl>
                    <Input placeholder="Business Tax ID" {...field} />
                  </FormControl>
                </div>
                <Badge variant="outline" className="py-2">
                  <IconId size={20} strokeWidth={1.5} />
                </Badge>
              </div>
            </FormItem>
          )}
        />
        <Separator />
        <FormField
          control={form.control}
          name="company_address"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start justify-between md:flex-row md:items-center">
              <div>
                <FormLabel>Business Address</FormLabel>
                <FormDescription>Address of the company.</FormDescription>
                <FormMessage />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <FormControl>
                    <Input placeholder="Business Address" {...field} />
                  </FormControl>
                </div>

                <Badge variant="outline" className="py-2">
                  <IconHome size={20} strokeWidth={1.5} />
                </Badge>
              </div>
            </FormItem>
          )}
        />
        <Button>Save Changes</Button>
      </form>
      <div className="mt-10 mb-4 flex w-full flex-col items-start justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center">
        <div className="flex flex-col items-start text-sm">
          <p className="font-bold tracking-wide">Remove Account</p>
          <p className="text-muted-foreground font-medium">
            You can do &apos;Disable account&apos; to take a break from panel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteActions />
        </div>
      </div>
    </Form>
  )
}

"use client"

import { useState } from "react"
import { z } from "zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { CalendarIcon } from "@radix-ui/react-icons"
import {
  IconCreditCard,
  IconCreditCardPay,
  IconPlus,
} from "@tabler/icons-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const formSchema = z.object({
  card_number: z.string().min(1, {
    message: "Card Number is required.",
  }),
  cardholder_name: z.string().min(1, {
    message: "Card Holder Name is required.",
  }),
  expireDate: z.coerce.date({ required_error: "Expire Date is required." }),
  cvv: z.string().min(1, {
    message: "CVV is required.",
  }),
  billing_address: z.string().min(1, {
    message: "Billing Address is required.",
  }),
})

export function AddNewCard() {
  const [opened, setOpened] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      card_number: "",
      cardholder_name: "",
      cvv: "",
      billing_address: "",
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    form.reset()
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    })
    setOpened(false)
  }

  return (
    <Dialog
      open={opened}
      onOpenChange={() => {
        form.reset()
        setOpened((prev) => !prev)
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="flex items-center gap-1 font-semibold text-blue-600"
        >
          <IconPlus size={16} />
          <span className="text-xs">Add New Card</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <IconCreditCard /> New Payment
          </DialogTitle>
          <DialogDescription>
            Ensure accurate information to process the transaction smoothly.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="add-new-card-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-6 gap-5"
          >
            <FormField
              control={form.control}
              name="cardholder_name"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Card Holder</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Holder Name" {...field} />
                  </FormControl>
                  <FormDescription>Fill Card Holder Name</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="card_number"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Card Number" {...field} />
                  </FormControl>
                  <FormDescription>Fill Card Number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expireDate"
              render={({ field }) => (
                <FormItem className="col-span-6">
                  <FormLabel>Expire Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Pick Expire Date.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cvv"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input placeholder="CVV No" {...field} />
                  </FormControl>
                  <FormDescription>Fill CVV No</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_address"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>Billing Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Billing Address" {...field} />
                  </FormControl>
                  <FormDescription>Fill Billing Address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="gap-y-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="add-new-card-form">
            Submit <IconCreditCardPay />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { apps } from "../data/data"

export default function ConnectAppForm() {
  return (
    <>
      <div className="text-muted-foreground text-start text-sm font-medium tracking-tight">
        <p>
          To get the best experience, we recommand setting up at least one
          integration.
        </p>
        <p>
          This is necessary for us to have a source to generate reports for you.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="my-10 flex w-full flex-col gap-4"
      >
        {apps.map((app) => (
          <AccordionItem
            key={app.name}
            value={app.name}
            className="rounded-md border px-4 py-0"
          >
            <AccordionTrigger className="flex items-center hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="bg-muted flex size-9 items-center justify-center rounded-lg p-2">
                  {app.logo}
                </div>
                <p>{app.name}</p>
              </div>
              <div className="mr-3 ml-auto flex h-full items-center gap-4">
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  aria-label={app.connected ? "Connected" : "Connect"}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800",
                    {
                      "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900":
                        app.connected,
                    }
                  )}
                >
                  {app.connected ? "Connected" : "Connect"}
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">Learn More</p>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>{app.desc}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}

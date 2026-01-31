"use client"

import { useState } from "react"
import { IconArrowUpRight, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import SubscribeDrawer from "./components/subscribe-drawer"
import { getPlan, plans, PlanType } from "./data/data"

export default function PlanDetail() {
  const [selectPlan, setSelectPlan] = useState<PlanType>("Monthly")

  const plan = getPlan.get(selectPlan)

  return (
    <div className="mb-4 flex flex-col space-y-8 py-3">
      <RadioGroup
        defaultValue="comfortable"
        value={selectPlan}
        onValueChange={(e) => {
          setSelectPlan(e as PlanType)
        }}
      >
        <div className="flex flex-wrap items-center gap-5">
          {plans.map((plan) => (
            <div
              key={plan.label}
              className="flex min-w-fit shrink-0 grow basis-0 items-center transition-colors"
            >
              <RadioGroupItem
                value={plan.label}
                className="peer sr-only"
                id={plan.label}
              />
              <Label
                htmlFor={plan.label}
                className="outline-muted w-full cursor-pointer rounded-md border outline peer-data-[state=checked]:border-blue-500"
              >
                <Card className="w-full border-none">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full outline outline-[1px] outline-offset-2",
                            {
                              "bg-blue-700 outline-blue-500":
                                plan.label === selectPlan,
                            }
                          )}
                        ></div>
                        <CardTitle className="text-sm">{plan.label}</CardTitle>
                      </div>

                      {"badge" in plan && plan.badge && (
                        <Badge className="px-2 py-1 text-xs" variant="outline">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="py-3">
                    <div className="flex flex-col items-start gap-1">
                      <p className="text-sm">{plan.content}</p>
                      <p className="text-muted-foreground text-xs">
                        {plan.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      <div className="space-y-3">
        <h2 className="font-bold">Overview</h2>
        <p className="text-muted-foreground text-sm leading-5">
          {plan?.overview}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Features</h2>
          <Button
            className="text-xs font-semibold text-blue-600"
            variant="link"
          >
            Learn More
            <IconArrowUpRight />
          </Button>
        </div>
        <div className="border-muted-foreground grid grid-cols-6 gap-4 rounded-md border-[1px] p-4">
          {plan?.features.map((feature) => (
            <div key={feature} className="col-span-3 flex items-center gap-2">
              <IconCheck size={18} strokeWidth={1.5} />
              <p className="text-sm">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Additional Resources</h2>
          <Button
            className="text-xs font-semibold text-blue-600"
            variant="link"
          >
            Learn More
            <IconArrowUpRight />
          </Button>
        </div>
        <div className="border-muted-foreground grid grid-cols-6 gap-4 rounded-md border-[1px] p-4">
          {plan?.additionalResources.map((resource) => (
            <div key={resource} className="col-span-3 flex items-center gap-2">
              <IconCheck size={18} strokeWidth={1.5} />
              <p className="text-sm">{resource}</p>
            </div>
          ))}
        </div>
      </div>

      {plan && <SubscribeDrawer plan={plan} />}
    </div>
  )
}

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import CalendarDatePicker from "@/components/calendar-date-picker"
import {
  containsLevelOptions,
  environmentOptions,
  eventTypeOptions,
  Timeline,
  timelines,
} from "../data/data"

export default function Filters() {
  const [timeline, setTimeline] = useState<Timeline>("custom")
  const [containsLevels, setContainLevels] = useState<string[]>([])
  const [environments, setEnvironments] = useState<string[]>([])
  const [eventTypes, setEventTypes] = useState<string[]>([])

  function resetHandler() {
    setContainLevels([])
    setEnvironments([])
    setEventTypes([])
  }

  return (
    <div className="flex h-full flex-col gap-3 md:max-h-[380px]">
      <div className="flex items-center justify-between px-4">
        <h1 className="text-sm font-bold">Filters</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={resetHandler}
                variant="outline"
                className="px-3 text-xs"
              >
                Reset
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Reset Filter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="flex flex-col">
        <Collapsible defaultOpen className="group/log-filter px-2">
          <CollapsibleTrigger asChild>
            <Button
              className="flex w-full items-center justify-start px-2"
              variant="ghost"
            >
              <ChevronRight className="scale-125 transition-transform duration-200 group-data-[state=open]/log-filter:rotate-90" />
              <p className="text-sm">Timeline</p>
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="CollapsibleContent space-y-2 px-2 pt-1 pb-3 duration-75!">
            <Select
              value={timeline}
              onValueChange={(e) => setTimeline(e as Timeline)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timelines.map((timeline) => (
                    <SelectItem key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {timeline === "custom" && (
              <CalendarDatePicker
                className="w-full"
                variant="outline"
                date={{ from: new Date() }}
                onDateSelect={() => {}}
              />
            )}
          </CollapsibleContent>
        </Collapsible>
        <Collapsible defaultOpen className="group/log-filter px-2">
          <CollapsibleTrigger asChild>
            <Button
              className="flex w-full items-center justify-start px-2"
              variant="ghost"
            >
              <ChevronRight className="scale-125 transition-transform duration-200 group-data-[state=open]/log-filter:rotate-90" />
              <p className="text-sm">Contains Level</p>
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="CollapsibleContent space-y-2 px-2 pt-1 pb-3 duration-75!">
            <div className="border-muted flex flex-col overflow-hidden rounded-md border">
              {containsLevelOptions.map((contain_level) => (
                <div
                  className="flex items-center gap-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  key={contain_level.value}
                >
                  <Checkbox
                    checked={containsLevels.includes(contain_level.label)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? setContainLevels([
                            ...containsLevels,
                            contain_level.label,
                          ])
                        : setContainLevels(
                            containsLevels.filter(
                              (value) => value !== contain_level.label
                            )
                          )
                    }}
                    id={contain_level.label}
                  />
                  <Label
                    className="flex h-full flex-1 cursor-pointer items-center justify-between py-2"
                    htmlFor={contain_level.label}
                  >
                    <p className="text-xs">{contain_level.label}</p>
                    <Badge
                      variant="secondary"
                      className="h-6 w-6 rounded-full p-0"
                    >
                      <p className="m-auto text-[10px] opacity-70">
                        {contain_level.value}
                      </p>
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible className="group/log-filter px-2">
          <CollapsibleTrigger asChild>
            <Button
              className="flex w-full items-center justify-start px-2"
              variant="ghost"
            >
              <ChevronRight className="scale-125 transition-transform duration-200 group-data-[state=open]/log-filter:rotate-90" />
              <p className="text-sm">Environment</p>
              <span className="sr-only">Select Environment</span>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="CollapsibleContent space-y-2 px-2 pt-1 pb-3 duration-75!">
            <div className="border-muted flex flex-col overflow-hidden rounded-md border">
              {environmentOptions.map((env) => (
                <div
                  className="flex items-center gap-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  key={env.value}
                >
                  <Checkbox
                    checked={environments.includes(env.label)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? setEnvironments([...environments, env.label])
                        : setEnvironments(
                            environments.filter((value) => value !== env.label)
                          )
                    }}
                    id={env.label}
                  />
                  <Label
                    className="flex flex-1 cursor-pointer items-center justify-between py-2"
                    htmlFor={env.label}
                  >
                    <p className="text-xs">{env.label}</p>
                    <Badge
                      variant="secondary"
                      className="h-6 w-6 rounded-full p-0"
                    >
                      <p className="m-auto text-[10px] opacity-70">
                        {env.value}
                      </p>
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible className="group/log-filter px-2">
          <CollapsibleTrigger asChild>
            <Button
              className="flex w-full items-center justify-start px-2"
              variant="ghost"
            >
              <ChevronRight className="scale-125 transition-transform duration-200 group-data-[state=open]/log-filter:rotate-90" />
              <p className="text-sm">Types</p>
              <span className="sr-only">Select Event Type</span>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="CollapsibleContent space-y-2 px-2 pt-1 pb-3 duration-75!">
            <div className="border-muted flex flex-col overflow-hidden rounded-md border">
              {eventTypeOptions.map((eventType) => (
                <div
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  key={eventType.value}
                >
                  <Checkbox
                    checked={eventTypes.includes(eventType.label)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? setEventTypes([...eventTypes, eventType.label])
                        : setEventTypes(
                            environments.filter(
                              (value) => value !== eventType.label
                            )
                          )
                    }}
                    id={eventType.label}
                  />
                  <Label
                    className="flex flex-1 cursor-pointer items-center justify-between"
                    htmlFor={eventType.label}
                  >
                    <p className="text-xs">{eventType.label}</p>
                    <Badge
                      variant="secondary"
                      className="h-6 w-6 rounded-full p-0"
                    >
                      <p className="m-auto text-[10px] opacity-70">
                        {eventType.value}
                      </p>
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>
    </div>
  )
}

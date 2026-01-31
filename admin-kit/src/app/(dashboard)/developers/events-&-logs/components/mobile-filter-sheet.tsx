"use client"

import * as React from "react"
import { IconFilter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import Filters from "./filters"

export default function MobileFilterSheet() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="block lg:hidden" size="icon" variant="outline">
          <IconFilter className="m-auto" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Events/Logs Filters</DrawerTitle>
          <DrawerDescription>Select & Check Filters.</DrawerDescription>
        </DrawerHeader>
        <Filters />
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

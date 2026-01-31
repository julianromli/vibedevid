import { IconDots } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pageViews, routeViews } from "../data/data"
import ViewAllRouteDialog from "./view-all-routes"

export default function RouteView() {
  return (
    <Card>
      <Tabs defaultValue="pages" className="space-y-0">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <TabsList className="gap-2 bg-transparent">
              <TabsTrigger
                className="outline-foreground/10 data-[state=active]:bg-muted data-[state=active]:outline"
                value="pages"
              >
                Pages
              </TabsTrigger>
              <TabsTrigger
                className="outline-foreground/10 data-[state=active]:bg-muted data-[state=active]:outline"
                value="routes"
              >
                Routes
              </TabsTrigger>
              <TabsTrigger
                disabled
                className="outline-foreground/10 data-[state=active]:bg-muted data-[state=active]:outline"
                value="hostnames"
              >
                Hostnames
              </TabsTrigger>
            </TabsList>
            <h1 className="text-muted-foreground text-xs font-medium">
              VISITORS
            </h1>
          </div>
        </CardHeader>
        <Separator />
        <TabsContent value="pages">
          <CardContent className="px-4 py-3">
            <div className="flex flex-col">
              {pageViews.map((route) => (
                <div
                  key={route.route}
                  className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <p className="text-sm font-medium">{route.route}</p>
                  <p className="text-sm font-semibold">{route.viewCount}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3">
            <div className="m-auto">
              <ViewAllRouteDialog />
            </div>
          </CardFooter>
        </TabsContent>
        <TabsContent value="routes">
          <CardContent className="px-4 py-3">
            <div className="flex flex-col">
              {routeViews.map((route) => (
                <div
                  key={route.route}
                  className="flex cursor-pointer items-center justify-between rounded-md px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <p className="text-sm font-medium">{route.route}</p>
                  <p className="text-sm font-semibold">{route.viewCount}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3">
            <div className="m-auto flex items-center gap-1">
              <ViewAllRouteDialog />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    size="icon"
                  >
                    <IconDots />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardFooter>
        </TabsContent>
        <TabsContent value="hostnames">
          <CardContent className="px-4 py-3">Hostnames</CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

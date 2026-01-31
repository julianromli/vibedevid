import { format } from "date-fns"
import { IconRefresh } from "@tabler/icons-react"
import { Terminal } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/copy-button"
import { CreateApiKeyDialog } from "./components/create-api-key-dialog"

export default function ApiKeysPage() {
  return (
    <>
      <div className="flex w-full flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Developers</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>API Keys</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">API Keys</h2>
            <p className="text-muted-foreground text-sm">
              Secure, manage, and monitor your API keys with ease.
            </p>
          </div>
          <Select>
            <SelectTrigger className="w-fit gap-2 text-sm">
              <SelectValue placeholder="Server" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Server</SelectLabel>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="api" className="my-8">
        <TabsList className="border-muted flex h-auto w-full items-center justify-start rounded-none border-b bg-transparent p-0!">
          <TabsTrigger
            value="api"
            className="rounded-none border-blue-600 py-1 shadow-none! data-[state=active]:border-b-[2px]"
          >
            API Keys
          </TabsTrigger>
          <TabsTrigger
            disabled
            value="account"
            className="rounded-none border-blue-600 py-1 shadow-none! data-[state=active]:border-b-[2px]"
          >
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="api" className="mt-5 w-full max-w-3xl">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">API Version</h2>
              <div className="flex items-center justify-between">
                <h1 className="text-sm font-semibold">Global Version</h1>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {format(new Date(), "dd-MMM-yyyy")}
                  </p>
                  <Badge variant="secondary">Latest Version</Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Secret API Keys</h2>
                <CreateApiKeyDialog />
              </div>
              <Alert className="w-full">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Reminder!</AlertTitle>
                <AlertDescription>
                  Live API keys can only be used for the v1/api-end point.See
                  the{" "}
                  <Link className="underline" href="/">
                    documentation
                  </Link>{" "}
                  for more details.
                </AlertDescription>
              </Alert>

              <div className="my-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-sm font-semibold">Live Environment</h1>
                <div className="flex w-full flex-col items-end gap-2 md:w-fit">
                  <div className="relative w-full md:max-w-[280px]">
                    <Input
                      readOnly
                      placeholder="Live_08234153847256"
                      className="pr-10"
                    />

                    <CopyButton
                      className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2"
                      text="Copt Api Key"
                    />
                  </div>

                  <Button
                    variant="link"
                    className="flex items-center gap-1 p-0 text-green-500 dark:text-green-300"
                  >
                    <IconRefresh strokeWidth={1.5} size={16} />
                    <p className="text-sm font-medium">Refresh</p>
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-sm font-semibold">Test Environment</h1>
                <div className="flex w-full flex-col items-end gap-2 md:w-fit">
                  <div className="relative w-full md:max-w-[280px]">
                    <Input
                      readOnly
                      placeholder="Live_08234153847256"
                      className="pr-10"
                    />

                    <CopyButton
                      className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2"
                      text="Copt Api Key"
                    />
                  </div>

                  <Button
                    variant="link"
                    className="flex items-center gap-1 p-0 text-green-500 dark:text-green-300"
                  >
                    <IconRefresh strokeWidth={1.5} size={16} />
                    <p className="text-sm font-medium">Refresh</p>
                  </Button>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Publishable API Keys</h2>
              <Alert className="w-full">
                <AlertDescription className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                  <Terminal className="h-4 w-4" />
                  <p>
                    Live API keys can only be used for the v1/api-end point.See
                    the{" "}
                    <Link href="/" className="underline">
                      documentation
                    </Link>{" "}
                    for more details.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="my-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-sm font-semibold">Live Environment</h1>
                <div className="flex w-full flex-col items-end gap-2 md:w-fit">
                  <div className="relative w-full md:max-w-[280px]">
                    <Input
                      readOnly
                      placeholder="Live_08234153847256"
                      className="pr-10"
                    />

                    <CopyButton
                      className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2"
                      text="Copt Api Key"
                    />
                  </div>

                  <Button
                    variant="link"
                    className="flex items-center gap-1 p-0 text-green-500 dark:text-green-300"
                  >
                    <IconRefresh strokeWidth={1.5} size={16} />
                    <p className="text-sm font-medium">Refresh</p>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-sm font-semibold">Test Environment</h1>
                <div className="flex w-full flex-col items-end gap-2 md:w-fit">
                  <div className="relative w-full md:max-w-[280px]">
                    <Input
                      readOnly
                      placeholder="Live_08234153847256"
                      className="pr-10"
                    />

                    <CopyButton
                      className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2"
                      text="Copt Api Key"
                    />
                  </div>

                  <Button
                    variant="link"
                    className="flex items-center gap-1 p-0 text-green-500 dark:text-green-300"
                  >
                    <IconRefresh strokeWidth={1.5} size={16} />
                    <p className="text-sm font-medium">Refresh</p>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="account">Account</TabsContent>
      </Tabs>
    </>
  )
}

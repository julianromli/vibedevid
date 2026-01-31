import { format } from "date-fns"
import {
  IconCalendar,
  IconGitBranch,
  IconClockHour4,
  IconArrowRight,
  IconArrowUp,
} from "@tabler/icons-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { priorities, statuses } from "../data/data"
import { taskListSchema } from "../data/schema"
import { tasks } from "../data/tasks"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: Props) {
  // Extract and validate task ID
  const id = (await params).id
  const taskList = taskListSchema.parse(tasks)
  const task = taskList.find((task) => task.id === id)

  if (!task) {
    return redirect(`/tasks`)
  }

  // Get task metadata from data definitions
  const status = statuses.find((s) => s.value === task.status)
  const priority = priorities.find((p) => p.value === task.priority)

  // Mock data for task details
  const assignees = [
    { name: "Michael Kane", image: "/avatars/avatar-1.png", role: "Tech Lead" },
    {
      name: "Olivier Giroud",
      image: "/avatars/avatar-2.png",
      role: "Developer",
    },
    { name: "Isabella Chen", image: "/avatars/avatar-3.png", role: "Designer" },
  ]
  const linkedItems = [
    { type: "PR", id: "#1234", title: "Implement new workflow UI" },
    { type: "Issue", id: "#5678", title: "Database schema updates" },
  ]

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="max-w-3xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/tasks">Tasks</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{task.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="max-w-3xl">
        {/* Task Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          {/* Tags could go here if needed */}
        </div>

        {/* Task Metadata Grid */}
        <div className="bg-card mb-6 grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-6 text-sm md:grid-cols-2">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Priority</span>
              <div className="flex items-center gap-1">
                {priority?.value === "medium" && (
                  <IconArrowRight className="h-3.5 w-3.5 text-orange-700" />
                )}
                {priority?.value === "high" && (
                  <IconArrowUp className="h-3.5 w-3.5 text-red-700" />
                )}
                <Badge
                  className={`text-xs ${
                    priority?.value === "high"
                      ? "bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700"
                      : priority?.value === "medium"
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-100 hover:text-orange-700"
                        : ""
                  }`}
                >
                  {priority?.label}
                </Badge>
              </div>
            </div>

            {/* Team Members */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Assignees</span>
              <div>
                <div className="flex -space-x-2">
                  {assignees.map((assignee, index) => (
                    <Avatar
                      key={index}
                      className="border-background h-5 w-5 border-2"
                    >
                      <AvatarImage src={assignee.image} alt={assignee.name} />
                      <AvatarFallback>
                        {assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Due Date</span>
              <div className="flex items-center gap-1">
                <IconCalendar className="text-muted-foreground h-3.5 w-3.5" />
                <span>{format(task.dueDate, "MMM dd, yyyy")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Created</span>
              <div className="flex items-center gap-1">
                <IconCalendar className="text-muted-foreground h-3.5 w-3.5" />
                <span>{format(task.createdDate, "MMM dd, yyyy")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Project</span>
              <span>Shopify</span>
            </div>
          </div>

          {/* Right Column - Additional Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Status</span>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${
                  status?.value === "done" || status?.value === "completed"
                    ? "border-green-200 bg-green-100 text-green-700"
                    : status?.value === "in progress"
                      ? "border-blue-200 bg-blue-100 text-blue-700"
                      : ""
                }`}
              >
                {status?.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Sprint</span>
              <span>{task.sprintCycle}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24">Est. Time</span>
              <div className="flex items-center gap-1">
                <IconClockHour4 className="text-muted-foreground h-3.5 w-3.5" />
                <span>{task.estimatedTime}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="text-muted-foreground w-24">Linked Items</span>
              <div className="space-y-1">
                {linkedItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <IconGitBranch className="text-muted-foreground h-3.5 w-3.5" />
                    <span className="text-xs">
                      {item.type} {item.id}: {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Task Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="text-sm">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            {/* Task Description Content */}
            <div className="prose prose-sm text-muted-foreground max-w-none">
              <p>
                Currently, when a Member reports a physical card as lost,
                stolen, or damaged, they are automatically issued with a new
                card. This process needs to be redesigned to improve security
                and user experience.
              </p>

              <h3 className="text-foreground mt-4 mb-2 font-semibold">
                Technical Requirements
              </h3>
              <p>
                The new workflow should implement the following security
                measures:
              </p>
              <ul className="mb-4 list-disc pl-4">
                <li>Two-factor authentication for card replacement requests</li>
                <li>Automated fraud detection system integration</li>
                <li>
                  Real-time notification system for both users and
                  administrators
                </li>
                <li>Audit trail for all card replacement requests</li>
              </ul>

              <h3 className="text-foreground mt-4 mb-2 font-semibold">
                Database Changes
              </h3>
              <p>New tables and modifications required:</p>
              <ul className="mb-4 list-disc pl-4">
                <li>card_replacement_requests</li>
                <li>audit_logs</li>
                <li>notification_preferences</li>
              </ul>

              <h3 className="text-foreground mt-4 mb-2 font-semibold">
                API Endpoints
              </h3>
              <p>New REST endpoints to be implemented:</p>
              <ul className="mb-4 list-disc pl-4">
                <li>POST /api/v1/cards/replacement-requests</li>
                <li>GET /api/v1/cards/replacement-status</li>
                <li>PUT /api/v1/cards/replacement-verification</li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="comments">
            <div className="mt-6 space-y-6">
              {/* Comment Input */}
              <div className="flex items-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatars/avatar-1.png" alt="Current User" />
                  <AvatarFallback>CU</AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg border p-1.5">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    className="w-full bg-transparent px-1 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-8">
                {/* Comment 1 */}
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src="/avatars/avatar-2.png"
                      alt="Olivier Giroud"
                    />
                    <AvatarFallback>OG</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Olivier Giroud
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        2 days ago
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      I&apos;ve started working on the API endpoints. We might
                      need to add rate limiting to prevent abuse of the
                      replacement request endpoint.
                    </p>
                    <div className="mt-2 flex gap-4">
                      <button className="text-muted-foreground hover:text-foreground text-[11px]">
                        Reply
                      </button>
                      <button className="text-muted-foreground hover:text-foreground text-[11px]">
                        React
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment 2 */}
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src="/avatars/avatar-1.png"
                      alt="Michael Kane"
                    />
                    <AvatarFallback>MK</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Michael Kane</span>
                      <span className="text-muted-foreground text-[11px]">
                        1 day ago
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Good point about rate limiting. Let&apos;s also make sure
                      we implement proper logging for all replacement requests.
                      I&apos;ll update the technical requirements.
                    </p>
                    <div className="mt-2 flex gap-4">
                      <button className="text-muted-foreground hover:text-foreground text-[11px]">
                        Reply
                      </button>
                      <button className="text-muted-foreground hover:text-foreground text-[11px]">
                        React
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comment 3 */}
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src="/avatars/avatar-3.png"
                      alt="Isabella Chen"
                    />
                    <AvatarFallback>IC</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Isabella Chen</span>
                      <span className="text-muted-foreground text-[11px]">
                        5 hours ago
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      I&apos;ve prepared some mockups for the verification UI.
                      Will share them in tomorrow&apos;s design review. The
                      focus is on making the 2FA process as smooth as possible.
                    </p>
                    <div className="mt-2 flex gap-4">
                      <button className="text-muted-foreground hover:text-foreground text-[11px]">
                        Reply
                      </button>
                      <button className="text-muted-foreground hover:text-foreground text-[11px]">
                        React
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

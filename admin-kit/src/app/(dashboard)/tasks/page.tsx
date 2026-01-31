import { columns } from "./components/tasks-columns"
import { TasksPrimaryActions } from "./components/tasks-primary-actions"
import { TasksTable } from "./components/tasks-table"
import { taskListSchema } from "./data/schema"
import { tasks } from "./data/tasks"

export default function TasksPage() {
  const taskList = taskListSchema.parse(tasks)
  return (
    <>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of your tasks for this month!
          </p>
        </div>
        <TasksPrimaryActions />
      </div>
      <div className="flex-1">
        <TasksTable data={taskList} columns={columns} />
      </div>
    </>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import ProjectDetailsPage from '@/app/project/[slug]/page'

export const Route = createFileRoute('/project/$slug')({
  component: ProjectDetailRoute,
})

function ProjectDetailRoute() {
  const { slug } = Route.useParams()

  return <ProjectDetailsPage params={Promise.resolve({ slug })} />
}

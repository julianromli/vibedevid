import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import ProjectDetailsPage, { type ProjectDetailsData } from '@/app/project/[slug]/page'
import { getComments } from '@/lib/actions/comments'
import { getCategories } from '@/lib/categories'
import { publicPageHead } from '@/lib/seo/page-meta'
import { softwareApplicationSchema } from '@/lib/seo/schema-templates'
import { checkProjectOwnership, getCurrentUser } from '@/lib/server/auth'
import { getOwnedProjectImageKeys, getProjectBySlug } from '@/lib/server/project-public'
import { getProjectByUUID, isUUID } from '@/lib/server/utils'

/**
 * Server-only data fetching for a project detail page. Wrapped in
 * `createServerFn` so server-only Drizzle queries never execute (or get
 * bundled) on the client when the loader re-runs during client-side navigation.
 */
const loadProjectData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }): Promise<ProjectDetailsData> => {
    // Legacy UUID redirect
    if (isUUID(slug)) {
      const legacyProject = await getProjectByUUID(slug)
      if (legacyProject?.slug) {
        throw redirect({ to: '/project/$slug', params: { slug: legacyProject.slug } })
      }
      throw notFound()
    }

    const [currentUser, project, categories] = await Promise.all([
      getCurrentUser(),
      getProjectBySlug(slug),
      getCategories(),
    ])

    if (!project) {
      throw notFound()
    }

    const { comments: initialComments } = await getComments('project', String(project.id))
    const isOwner = currentUser ? await checkProjectOwnership(project.author.username, currentUser.id) : false
    const ownerImageKeys = isOwner && currentUser ? await getOwnedProjectImageKeys(slug, currentUser.id) : []

    return { slug, project, currentUser, categories, initialComments, isOwner, ownerImageKeys }
  })

export const Route = createFileRoute('/project/$slug')({
  loader: async ({ params }): Promise<ProjectDetailsData> => {
    return loadProjectData({ data: { slug: params.slug } })
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project
    if (!project) {
      return { meta: [{ title: 'Project Not Found | VibeDev ID' }] }
    }

    const description = (project.tagline || project.description || '').slice(0, 160)
    const image = project.image || project.faviconUrl || undefined

    return publicPageHead({
      title: `${project.title} | VibeDev ID`,
      description,
      path: `/project/${project.slug}`,
      image,
    })
  },
  component: ProjectDetailRoute,
})

function ProjectDetailRoute() {
  const data = Route.useLoaderData()
  const { project } = data

  const appSchema = project ? softwareApplicationSchema(project) : null

  return (
    <>
      {appSchema && <script type="application/ld+json">{JSON.stringify(appSchema)}</script>}
      <ProjectDetailsPage data={data} />
    </>
  )
}

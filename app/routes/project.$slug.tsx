import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getProjectBySlug } from "@/lib/actions";
import { getComments } from "@/lib/actions/comments";
import { getCategories } from "@/lib/categories";
import { absoluteUrl } from "@/lib/seo/site-url";
import { checkProjectOwnership, getCurrentUser } from "@/lib/server/auth";
import { getProjectByUUID, isUUID } from "@/lib/server/utils";
import ProjectDetailsPage, { type ProjectDetailsData } from "@/app/project/[slug]/page";

/**
 * Server-only data fetching for a project detail page. Wrapped in
 * `createServerFn` so server-only Drizzle queries never execute (or get
 * bundled) on the client when the loader re-runs during client-side navigation.
 */
const loadProjectData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }): Promise<ProjectDetailsData> => {
    // Legacy UUID redirect
    if (isUUID(slug)) {
      const legacyProject = await getProjectByUUID(slug);
      if (legacyProject?.slug) {
        throw redirect({ to: "/project/$slug", params: { slug: legacyProject.slug } });
      }
      throw notFound();
    }

    const [currentUser, { project, error: projectError }, categories] = await Promise.all([
      getCurrentUser(),
      getProjectBySlug(slug),
      getCategories(),
    ]);

    if (projectError || !project) {
      throw notFound();
    }

    const { comments: initialComments } = await getComments("project", String(project.id));
    const isOwner = currentUser
      ? await checkProjectOwnership(project.author.username, currentUser.id)
      : false;

    return { slug, project, currentUser, categories, initialComments, isOwner };
  });

export const Route = createFileRoute("/project/$slug")({
  loader: async ({ params }): Promise<ProjectDetailsData> => {
    return loadProjectData({ data: { slug: params.slug } });
  },
  head: ({ loaderData }) => {
    const project = loaderData?.project;
    if (!project) {
      return { meta: [{ title: "Project Not Found | VibeDev ID" }] };
    }

    const description = (project.tagline || project.description || "").slice(0, 160);
    const url = absoluteUrl(`/project/${project.slug}`);
    const image = project.image || project.faviconUrl || undefined;

    return {
      meta: [
        { title: `${project.title} | VibeDev ID` },
        { name: "description", content: description },
        { property: "og:title", content: project.title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "VibeDev ID" },
        { property: "og:type", content: "website" },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: project.title },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
        { name: "twitter:site", content: "@vibedevid" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  const data = Route.useLoaderData();
  return <ProjectDetailsPage data={data} />;
}

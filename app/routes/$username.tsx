import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import ProfilePage from "@/app/[username]/page";
import { loadProfilePageData } from "@/app/[username]/profile-data";
import { absoluteUrl } from "@/lib/seo/site-url";

/**
 * Server-only profile data fetching. Wrapped in `createServerFn` so the
 * server-only Supabase client never executes (or gets bundled) on the client
 * when the loader re-runs during client-side navigation.
 */
const loadProfile = createServerFn({ method: "GET" })
  .validator(z.object({ username: z.string().min(1) }))
  .handler(async ({ data: { username } }) => {
    return loadProfilePageData(username);
  });

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    const data = await loadProfile({ data: { username: params.username } });
    if (!data.user) {
      throw notFound();
    }
    return data;
  },
  head: ({ loaderData }) => {
    const user = loaderData?.user;
    if (!user) {
      return { meta: [{ title: "User Not Found | VibeDev ID" }] };
    }

    const name = user.display_name || user.username;
    const description = (user.bio || `Profil ${name} di VibeDev ID`).slice(0, 160);
    const url = absoluteUrl(`/${user.username}`);
    const image = user.avatar_url || undefined;

    return {
      meta: [
        { title: `${name} (@${user.username}) | VibeDev ID` },
        { name: "description", content: description },
        { property: "og:title", content: name },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "profile" },
        { property: "og:site_name", content: "VibeDev ID" },
        { property: "og:locale", content: "id_ID" },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: name },
        { name: "twitter:description", content: description },
        { name: "twitter:site", content: "@vibedevid" },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: UsernameRoute,
});

function UsernameRoute() {
  const data = Route.useLoaderData();
  return <ProfilePage key={data.user?.username} data={data} />;
}

import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import ProfilePage from '@/app/[username]/page'
import { loadProfilePageData } from '@/app/[username]/profile-data'
import { isReservedProfileSlug, parseProfileUsernameParam } from '@/lib/reserved-profile-slugs'
import { publicPageHead } from '@/lib/seo/page-meta'
import { profilePageSchema } from '@/lib/seo/schema-templates'
import { NOINDEX_META } from '@/lib/seo/site-url'

/**
 * Server-only profile data fetching. Wrapped in `createServerFn` so the
 * server-only Supabase client never executes (or gets bundled) on the client
 * when the loader re-runs during client-side navigation.
 */
const loadProfile = createServerFn({ method: 'GET' })
  .validator(z.object({ username: z.string().min(1) }))
  .handler(async ({ data: { username } }) => {
    return loadProfilePageData(username)
  })

export const Route = createFileRoute('/$username')({
  params: {
    parse: ({ username }) => parseProfileUsernameParam(username),
  },
  loader: async ({ params }) => {
    if (isReservedProfileSlug(params.username)) {
      throw notFound()
    }
    const data = await loadProfile({ data: { username: params.username } })
    if (!data.user) {
      throw notFound()
    }
    return data
  },
  head: ({ loaderData }) => {
    const user = loaderData?.user
    if (!user) {
      return { meta: [NOINDEX_META] }
    }

    const name = user.display_name || user.username
    const description = (user.bio || `Profil ${name} di VibeDev ID`).slice(0, 160)

    return publicPageHead({
      title: `${name} (@${user.username}) | VibeDev ID`,
      description,
      path: `/${user.username}`,
      image: user.avatar_url,
      type: 'profile',
    })
  },
  component: UsernameRoute,
})

function UsernameRoute() {
  const data = Route.useLoaderData()

  const profileSchema = data.user ? profilePageSchema(data.user) : null

  return (
    <>
      {profileSchema && <script type="application/ld+json">{JSON.stringify(profileSchema)}</script>}
      <ProfilePage
        key={data.user?.username}
        data={data}
      />
    </>
  )
}

import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SubmitProjectForm } from '@/components/ui/submit-project-form'
import type { Category } from '@/lib/categories'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-only data fetching for the project submit page. Wrapped in
 * `createServerFn` so the server-only Supabase client never executes (or gets
 * bundled) on the client when the loader re-runs during client-side navigation.
 */
const loadSubmitData = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = await createClient()
  const redirectTo = '/project/submit'

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    throw redirect({ to: '/user/auth', search: { redirectTo } })
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return {
    userId: data.user.id,
    categories: (categories ?? []) as Category[],
    redirectTo,
  }
})

export const Route = createFileRoute('/project/submit')({
  loader: async () => loadSubmitData(),
  component: ProjectSubmitRoute,
})

function ProjectSubmitRoute() {
  const { userId, categories, redirectTo } = Route.useLoaderData()
  const { t } = useTranslation('projectSubmit')

  return (
    <div className="relative min-h-screen bg-grid-pattern">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

      <div className="container relative mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-3xl">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>

          <SubmitProjectForm
            userId={userId}
            categories={categories}
            redirectTo={redirectTo}
          />
        </div>
      </div>
    </div>
  )
}

import { redirect } from '@/lib/navigation'
import { useTranslation } from 'react-i18next'
import { SubmitProjectForm } from '@/components/ui/submit-project-form'
import type { Category } from '@/lib/categories'
import { createClient } from '@/lib/supabase/server'

export default async function SubmitProjectPage() {
  const supabase = await createClient()
  const redirectTo = '/project/submit'

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect(`/user/auth?redirectTo=${redirectTo}`)
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <SubmitProjectPageContent
      userId={data.user.id}
      categories={(categories ?? []) as Category[]}
      redirectTo={redirectTo}
    />
  )
}

function SubmitProjectPageContent({
  userId,
  categories,
  redirectTo,
}: {
  userId: string
  categories: Category[]
  redirectTo: string
}) {
  const { t } = useTranslation('projectSubmit')

  return (
    <div className="relative min-h-screen bg-grid-pattern">
      {/* Background Gradient Overlay */}
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

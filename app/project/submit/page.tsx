import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SubmitProjectForm } from '@/components/ui/submit-project-form'
import { createClient } from '@/lib/supabase/server'

export default async function SubmitProjectPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/user/auth')
  }

  return <SubmitProjectPageContent userId={data.user.id} />
}

function SubmitProjectPageContent({ userId }: { userId: string }) {
  const t = useTranslations('projectSubmit')

  return (
    <div className="relative min-h-screen bg-grid-pattern">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

      <div className="container relative mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 font-bold text-3xl">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>

          <SubmitProjectForm userId={userId} />
        </div>
      </div>
    </div>
  )
}

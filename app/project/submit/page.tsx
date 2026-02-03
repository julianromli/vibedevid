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
    <div className="bg-grid-pattern relative min-h-screen">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>

          <SubmitProjectForm userId={userId} />
        </div>
      </div>
    </div>
  )
}

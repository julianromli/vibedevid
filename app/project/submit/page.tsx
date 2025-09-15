import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SubmitProjectForm } from '@/components/ui/submit-project-form'

export default async function SubmitProjectPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/user/auth')
  }

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Submit Your Project</h1>
            <p className="text-muted-foreground">
              Share your amazing project with the VibeDev community
            </p>
          </div>

          <SubmitProjectForm userId={data.user.id} />
        </div>
      </div>
    </div>
  )
}

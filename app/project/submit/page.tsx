import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubmitProjectForm } from "@/components/ui/submit-project-form"

export default async function SubmitProjectPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/user/auth")
  }

  return (
    <div className="min-h-screen bg-grid-pattern relative">
      {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Submit Your Project</h1>
            <p className="text-muted-foreground">Share your amazing project with the VibeDev community</p>
          </div>

          <SubmitProjectForm userId={data.user.id} />
        </div>
      </div>
    </div>
  )
}

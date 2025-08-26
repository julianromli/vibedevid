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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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

import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = "/"

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if user profile exists, create if not
        const { data: existingProfile } = await supabase.from("users").select("id").eq("id", user.id).single()

        if (!existingProfile) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            username:
              user.email
                ?.split("@")[0]
                ?.toLowerCase()
                .replace(/[^a-z0-9]/g, "") || `user${user.id.slice(0, 8)}`,
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
          })
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/user/auth?error=Could not authenticate user`)
}

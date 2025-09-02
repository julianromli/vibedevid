import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = "/user/auth"

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if email is confirmed - this is crucial for security
        if (!user.email_confirmed_at) {
          console.log("[Callback] User email not confirmed:", user.email)
          // Sign out the user and redirect to auth page with message
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/user/auth?error=Email not confirmed. Please check your inbox and click the confirmation link.`)
        }

        // Only create profile if email is confirmed
        const { data: existingProfile } = await supabase.from("users").select("id").eq("id", user.id).single()

        if (!existingProfile) {
          console.log("[Callback] Creating profile for confirmed user:", user.email)
          const { error: insertError } = await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            username:
              user.email
                ?.split("@")[0]
                ?.toLowerCase()
                .replace(/[^a-z0-9]/g, "") || `user${user.id.slice(0, 8)}`,
            avatar_url: user.user_metadata?.avatar_url || "/vibedev-guest-avatar.png",
            created_at: new Date().toISOString(),
          })
          
          if (insertError) {
            console.error("[Callback] Profile creation error:", insertError)
            return NextResponse.redirect(`${origin}/user/auth?error=Failed to create user profile`)
          }
        }
        
        console.log("[Callback] User authenticated successfully:", user.email)
        
        // Sign out user after successful email confirmation to make them sign in again
        // This ensures they use the login page after email confirmation
        await supabase.auth.signOut()
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}?success=Email confirmed successfully! You can now sign in.`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}?success=Email confirmed successfully! You can now sign in.`)
      } else {
        return NextResponse.redirect(`${origin}${next}?success=Email confirmed successfully! You can now sign in.`)
      }
    } else {
      console.error("[Callback] Exchange code error:", error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/user/auth?error=Could not authenticate user`)
}

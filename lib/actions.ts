"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Create or update user profile
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          username: user.email?.split("@")[0] || "user",
          display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          updated_at: new Date().toISOString(),
        })
        .select()

      if (profileError) {
        console.error("Profile creation error:", profileError)
      }
    }

    return { success: "Login successful", redirect: "/" }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const firstName = formData.get("firstName")
  const lastName = formData.get("lastName")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}`,
        data: {
          full_name: firstName && lastName ? `${firstName} ${lastName}`.trim() : email.toString().split("@")[0],
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect("/")
}

export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")

  if (!email) {
    return { error: "Email is required" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/user/auth`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Password reset email sent. Check your inbox." }
  } catch (error) {
    console.error("Password reset error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function addComment(formData: FormData) {
  if (!formData) {
    return { error: "Form data is required" }
  }

  const projectId = formData.get("projectId") as string
  const content = formData.get("content") as string
  const authorName = formData.get("authorName") as string

  if (!projectId || !content) {
    return { error: "Project ID and content are required" }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const { error } = await supabase.from("comments").insert({
      project_id: Number.parseInt(projectId),
      user_id: user?.id || null,
      author_name: user ? null : authorName,
      content: content.trim(),
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Comment added successfully" }
  } catch (error) {
    console.error("Add comment error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getComments(projectId: string) {
  const supabase = await createClient()

  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        *,
        users (
          display_name,
          avatar_url
        )
      `)
      .eq("project_id", Number.parseInt(projectId))
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get comments error:", error)
      return { comments: [], error: error.message }
    }

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      author: comment.users?.display_name || comment.author_name || "Anonymous",
      avatar: comment.users?.avatar_url || "/placeholder.svg",
      content: comment.content,
      timestamp: new Date(comment.created_at).toLocaleDateString(),
      isGuest: !comment.user_id,
    }))

    return { comments: formattedComments, error: null }
  } catch (error) {
    console.error("Get comments error:", error)
    return { comments: [], error: "Failed to load comments" }
  }
}

export async function getProject(projectId: string) {
  const supabase = await createClient()

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", Number.parseInt(projectId))
      .single()

    if (projectError) {
      console.error("Get project error:", projectError)
      return { project: null, error: projectError.message }
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username, display_name, avatar_url, bio, location")
      .eq("id", project.author_id)
      .single()

    if (userError) {
      console.error("Get user error:", userError)
      return { project: null, error: userError.message }
    }

    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)

    const { count: viewsCount } = await supabase
      .from("views")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)

    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      fullDescription: project.description, // Use same description for now
      image: project.image_url,
      author: {
        name: user.display_name,
        username: user.username,
        avatar: user.avatar_url || "/placeholder.svg",
        bio: user.bio || "Community member",
        location: user.location || "Unknown location",
      },
      url: project.website_url,
      category: project.category,
      tags: ["Next.js", "React", "TypeScript"], // Default tags for now
      likes: likesCount || 0,
      views: viewsCount || 0,
      createdAt: project.created_at,
    }

    return { project: formattedProject, error: null }
  } catch (error) {
    console.error("Get project error:", error)
    return { project: null, error: "Failed to load project" }
  }
}

export async function incrementProjectViews(projectId: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    await supabase.from("views").insert({
      project_id: Number.parseInt(projectId),
      user_id: session?.user?.id || null,
      ip_address: null, // We'll skip IP tracking for now
    })
  } catch (error) {
    console.error("Increment views error:", error)
  }
}

export async function toggleLike(projectId: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { error: "You must be logged in to like projects" }
  }

  try {
    const projectIdInt = Number.parseInt(projectId)

    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("project_id", projectIdInt)
      .eq("user_id", session.user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return { error: checkError.message }
    }

    if (existingLike) {
      const { error: deleteError } = await supabase.from("likes").delete().eq("id", existingLike.id)

      if (deleteError) {
        return { error: deleteError.message }
      }

      return { success: true, isLiked: false }
    } else {
      const { error: insertError } = await supabase.from("likes").insert({
        project_id: projectIdInt,
        user_id: session.user.id,
      })

      if (insertError) {
        return { error: insertError.message }
      }

      return { success: true, isLiked: true }
    }
  } catch (error) {
    console.error("Toggle like error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function getLikeStatus(projectId: string | number) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    if (
      !projectId ||
      (typeof projectId === "string" && projectId.trim() === "") ||
      (typeof projectId === "number" && isNaN(projectId))
    ) {
      console.error("Get like status error: projectId is required")
      return { totalLikes: 0, isLiked: false, error: "Project ID is required" }
    }

    const projectIdInt = typeof projectId === "number" ? projectId : Number.parseInt(projectId.toString())

    if (isNaN(projectIdInt)) {
      console.error("Get like status error: Invalid project ID format:", projectId)
      return { totalLikes: 0, isLiked: false, error: "Invalid project ID format" }
    }

    const { count: totalLikes, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectIdInt)

    if (countError) {
      console.error("Get likes count error:", countError.message, countError.details)
      return { totalLikes: 0, isLiked: false, error: countError.message }
    }

    let isLiked = false
    if (session?.user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from("likes")
        .select("id")
        .eq("project_id", projectIdInt)
        .eq("user_id", session.user.id)
        .single()

      if (userLikeError && userLikeError.code !== "PGRST116") {
        console.error("Get user like status error:", userLikeError.message, userLikeError.details)
      } else if (userLike) {
        isLiked = true
      }
    }

    return { totalLikes: totalLikes || 0, isLiked, error: null }
  } catch (error) {
    console.error("Get like status error:", error)
    return { totalLikes: 0, isLiked: false, error: "Failed to load like status" }
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    console.error("Google sign in error:", error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithGitHub() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (error) {
    console.error("GitHub sign in error:", error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function getBatchLikeStatus(projectIds: (string | number)[]) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    if (!projectIds || projectIds.length === 0) {
      return { likesData: {}, error: null }
    }

    const projectIdsInt = projectIds
      .map((id) => (typeof id === "number" ? id : Number.parseInt(id.toString())))
      .filter((id) => !isNaN(id))

    if (projectIdsInt.length === 0) {
      return { likesData: {}, error: "No valid project IDs provided" }
    }

    // Get all likes for these projects in one query
    const { data: allLikes, error: likesError } = await supabase
      .from("likes")
      .select("project_id, user_id")
      .in("project_id", projectIdsInt)

    if (likesError) {
      console.error("Get batch likes error:", likesError)
      return { likesData: {}, error: likesError.message }
    }

    // Process the data
    const likesData: Record<string, { totalLikes: number; isLiked: boolean }> = {}

    projectIdsInt.forEach((projectId) => {
      const projectLikes = allLikes?.filter((like) => like.project_id === projectId) || []
      const totalLikes = projectLikes.length
      const isLiked = session?.user ? projectLikes.some((like) => like.user_id === session.user.id) : false

      likesData[projectId.toString()] = { totalLikes, isLiked }
    })

    return { likesData, error: null }
  } catch (error) {
    console.error("Get batch like status error:", error)
    return { likesData: {}, error: "Failed to load likes data" }
  }
}

export async function submitProject(formData: FormData, userId: string) {
  const supabase = await createClient()

  try {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const websiteUrl = formData.get("website_url") as string
    const imageUrl = formData.get("image_url") as string

    if (!title || !description || !category) {
      return { success: false, error: "Title, description, and category are required" }
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        website_url: websiteUrl?.trim() || null,
        image_url: imageUrl?.trim() || null,
        author_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("Submit project error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, projectId: project.id }
  } catch (error) {
    console.error("Submit project error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

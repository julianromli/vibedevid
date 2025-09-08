"use client"

import { createClient } from "@/lib/supabase/client"

export async function getLikeStatusClient(projectIdentifier: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  try {
    let projectId: string;
    
    // Check if it's a UUID or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(projectIdentifier)) {
      // It's a UUID, use directly
      projectId = projectIdentifier;
    } else {
      // It's a slug, resolve to project ID
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", projectIdentifier)
        .single();
      
      if (projectError || !project) {
        return { totalLikes: 0, isLiked: false, error: "Project not found" };
      }
      
      projectId = project.id;
    }

    // Get total likes count using UUID
    const { count: totalLikes, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)

    if (countError) {
      console.error("Get likes count error:", countError)
      return { totalLikes: 0, isLiked: false, error: countError.message }
    }

    // Check if current user liked this project
    let isLiked = false
    if (session?.user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from("likes")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", session.user.id)
        .single()

      if (userLikeError && userLikeError.code !== "PGRST116") {
        console.error("Get user like status error:", userLikeError)
      } else if (userLike) {
        isLiked = true
      }
    }

    return { totalLikes: totalLikes || 0, isLiked, error: null }
  } catch (error) {
    console.error("Get like status client error:", error)
    return { totalLikes: 0, isLiked: false, error: "Failed to load like status" }
  }
}

export async function toggleLikeClient(projectIdentifier: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return { error: "You must be logged in to like projects" }
  }

  try {
    let projectId: string;
    
    // Check if it's a UUID or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(projectIdentifier)) {
      // It's a UUID, use directly
      projectId = projectIdentifier;
    } else {
      // It's a slug, resolve to project ID
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", projectIdentifier)
        .single();
      
      if (projectError || !project) {
        return { error: "Project not found" };
      }
      
      projectId = project.id;
    }

    // Check if user already liked this project
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", session.user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return { error: checkError.message }
    }

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id)

      if (deleteError) {
        return { error: deleteError.message }
      }

      return { success: true, isLiked: false }
    } else {
      // Like
      const { error: insertError } = await supabase
        .from("likes")
        .insert({
          project_id: projectId,
          user_id: session.user.id,
        })

      if (insertError) {
        return { error: insertError.message }
      }

      return { success: true, isLiked: true }
    }
  } catch (error) {
    console.error("Toggle like client error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

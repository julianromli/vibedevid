import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env-config";

export interface BlogAuthor {
  display_name: string;
  avatar_url: string | null;
}

export interface BlogPostTag {
  post_tags: { name: string } | null;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  read_time_minutes: number | null;
  author: BlogAuthor | null;
  author_id?: string;
  tags?: BlogPostTag[];
}

export async function fetchPublishedPosts(): Promise<BlogPostListItem[]> {
  const { url, anonKey } = getSupabaseConfig();
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    },
  });

  const { data } = await supabase
    .from("posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      cover_image,
      published_at,
      read_time_minutes,
      author_id,
      author:users!posts_author_id_fkey(display_name, avatar_url),
      tags:blog_post_tags(post_tags(name))
    `,
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .returns<BlogPostListItem[]>();

  return data || [];
}

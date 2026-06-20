import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BlogViewTracker } from "@/components/blog/blog-view-tracker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/ui/comment-section";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { UserDisplayName } from "@/components/ui/user-display-name";
import type { getComments } from "@/lib/actions/comments";
import { contentToHtml } from "@/lib/blog-utils";
import { slugifyTitle } from "@/lib/slug";

type InitialComments = Awaited<ReturnType<typeof getComments>>["comments"];

interface BlogUserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username: string;
  role: number | null;
}

export interface BlogPostDataProps {
  // biome-ignore lint/suspicious/noExplicitAny: post shape comes from a wide Supabase select
  post: any;
  viewCount: number;
  initialComments: InitialComments;
  isLoggedIn: boolean;
  userData: BlogUserData | null;
  commentUser: { id: string; name: string; avatar?: string } | null;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy page with lots of UI
export default function BlogPostData({
  post,
  viewCount,
  initialComments,
  isLoggedIn,
  userData,
  commentUser,
}: BlogPostDataProps) {
  // Flatten tags from nested structure
  const postTags: string[] =
    post?.tags
      ?.map((t: { post_tags: { name: string } | null }) => t.post_tags?.name)
      .filter(Boolean) ?? [];
  const authorSlug = post.author?.username ? slugifyTitle(post.author.username) : null;
  const authorContent = (
    <>
      <Avatar className="h-8 w-8">
        <AvatarImage src={post.author?.avatar_url ?? undefined} />
        <AvatarFallback>{post.author?.display_name?.charAt(0) ?? "A"}</AvatarFallback>
      </Avatar>
      <UserDisplayName
        name={post.author?.display_name ?? "Anonymous"}
        role={post.author?.role ?? null}
        className="font-medium text-foreground"
      />
    </>
  );

  return (
    <article className="min-h-screen bg-background">
      <BlogViewTracker postId={post.id} />
      <Navbar showNavigation={true} isLoggedIn={isLoggedIn} user={userData ?? undefined} />

      <header className="relative min-h-[60vh] overflow-hidden pt-16">
        {post.cover_image ? (
          /* biome-ignore lint/performance/noImgElement: cover image may be remote and handled by existing setup */
          <img
            src={post.cover_image}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute top-20 left-4 md:left-8 lg:left-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
        </div>

        <div className="absolute right-0 bottom-0 left-0 pb-12 md:pb-20">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <h1 className="mb-6 font-bold text-3xl tracking-tight md:text-5xl">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm">
              {authorSlug ? (
                <Link
                  to="/$username"
                  params={{ username: authorSlug }}
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  {authorContent}
                </Link>
              ) : (
                <span className="flex items-center gap-2">{authorContent}</span>
              )}

              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                </span>
              )}

              {post.read_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.read_time_minutes} min read
                </span>
              )}

              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {(viewCount || 0).toLocaleString()} views
              </span>
            </div>

            {/* Tags Section */}
            {postTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {postTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-foreground/20 bg-background/50 px-3 py-1 text-sm backdrop-blur-sm transition-colors hover:border-foreground/40 hover:bg-background/80"
                  >
                    <span className="text-muted-foreground">#</span>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {post.excerpt && (
          <p className="mb-8 text-muted-foreground text-xl italic">{post.excerpt}</p>
        )}

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          {post.content && typeof post.content === "object" ? (
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: post content is sanitized/serialized before render */
            <div dangerouslySetInnerHTML={{ __html: contentToHtml(post.content) }} />
          ) : (
            <p>{post.content}</p>
          )}
        </div>

        <hr className="my-12 border-border" />

        <CommentSection
          entityType="post"
          entityId={post.id}
          initialComments={initialComments}
          isLoggedIn={isLoggedIn}
          currentUser={commentUser}
          allowGuest={false}
        />
      </div>

      <Footer />
    </article>
  );
}

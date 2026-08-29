import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUser } from "./auth";

// App profile table — 1:1 with Better Auth user (same UUID)
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .references(() => authUser.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  website: text("website"),
  githubUrl: text("github_url"),
  twitterUrl: text("twitter_url"),
  xUrl: text("x_url"),
  instagramUrl: text("instagram_url"),
  threadsUrl: text("threads_url"),
  role: integer("role").notNull().default(2),
  isSuspended: boolean("is_suspended").default(false),
  suspensionReason: text("suspension_reason"),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity({ name: "projects_new_id_seq" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    category: text("category").notNull(),
    websiteUrl: text("website_url"),
    imageUrl: text("image_url"),
    imageUrls: text("image_urls").array(),
    imageKeys: text("image_keys").array(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tagline: text("tagline"),
    faviconUrl: text("favicon_url"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    featured: boolean("featured").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_projects_author_id").on(table.authorId),
    index("idx_projects_category").on(table.category),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: jsonb("content").notNull(),
    excerpt: text("excerpt"),
    coverImage: text("cover_image"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    readTimeMinutes: integer("read_time_minutes"),
    viewCount: integer("view_count").default(0),
    featured: boolean("featured").default(false),
  },
  (table) => [
    uniqueIndex("posts_slug_key").on(table.slug),
    index("idx_posts_status_published_at").on(table.status, table.publishedAt),
  ],
);

export const postTags = pgTable("post_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    authorName: text("author_name"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_comments_project_id").on(table.projectId),
    index("idx_comments_post_id").on(table.postId),
    index("idx_comments_user_id").on(table.userId),
    check("comments_parent_xor", sql`(project_id IS NULL) <> (post_id IS NULL)`),
  ],
);

export const likes = pgTable(
  "likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_likes_project_id").on(table.projectId),
    index("idx_likes_post_id").on(table.postId),
    index("idx_likes_user_id").on(table.userId),
    uniqueIndex("likes_user_project_uidx")
      .on(table.userId, table.projectId)
      .where(sql`${table.projectId} IS NOT NULL`),
    uniqueIndex("likes_user_post_uidx")
      .on(table.userId, table.postId)
      .where(sql`${table.postId} IS NOT NULL`),
    check("likes_parent_xor", sql`(project_id IS NULL) <> (post_id IS NULL)`),
  ],
);

export const views = pgTable(
  "views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    sessionId: text("session_id"),
    viewDate: date("view_date").default(sql`CURRENT_DATE`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_views_project_id").on(table.projectId),
    index("idx_views_post_id").on(table.postId),
    index("idx_views_project_id_view_date").on(table.projectId, table.viewDate),
    check("views_parent_xor", sql`(project_id IS NULL) <> (post_id IS NULL)`),
  ],
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => postTags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const blogReports = pgTable("blog_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    date: date("date").notNull(),
    time: time("time").notNull(),
    endDate: date("end_date"),
    endTime: time("end_time"),
    locationType: text("location_type").notNull(),
    locationDetail: text("location_detail").notNull(),
    organizer: text("organizer").notNull(),
    registrationUrl: text("registration_url").notNull(),
    coverImage: text("cover_image").notNull(),
    category: text("category").notNull(),
    status: text("status").notNull().default("upcoming"),
    approved: boolean("approved").notNull().default(false),
    submittedBy: text("submitted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_events_approved_date").on(table.approved, table.date)],
);

export const vibeVideos = pgTable("vibe_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail").notNull(),
  videoId: text("video_id").notNull().unique(),
  publishedAt: date("published_at").notNull(),
  viewCount: text("view_count").default("0"),
  position: integer("position").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    role: text("role").notNull(),
    body: text("body").notNull(),
    avatarUrl: text("avatar_url").notNull(),
    avatarKey: text("avatar_key").notNull(),
    status: text("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_testimonials_status_approved_at").on(table.status, table.approvedAt),
    check("testimonials_status_check", sql`${table.status} IN ('pending', 'approved', 'rejected')`),
  ],
);

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, { fields: [projects.authorId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
  views: many(views),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
  likes: many(likes),
  views: many(views),
  blogPostTags: many(blogPostTags),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(posts, { fields: [blogPostTags.postId], references: [posts.id] }),
  tag: one(postTags, { fields: [blogPostTags.tagId], references: [postTags.id] }),
}));

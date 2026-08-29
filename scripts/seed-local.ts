/**
 * Load demo rows into a local Neon database.
 *
 *   bun run db:seed
 *   bun run db:seed -- --reset
 */

import postgres from "postgres";
import { loadSeedEnv } from "./seed/env";
import {
  assertSeedFixtures,
  SEED_AVATAR,
  SEED_CATEGORIES,
  SEED_COMMENTS,
  SEED_COVER,
  SEED_EVENTS,
  SEED_FAQS,
  SEED_LIKES,
  SEED_PASSWORD,
  SEED_POST_TAGS,
  SEED_POSTS,
  SEED_PROJECTS,
  SEED_REPORTS,
  SEED_TESTIMONIALS,
  SEED_USERS,
  SEED_VIDEOS,
  SEED_VIEWS,
  seedOwnedIds,
} from "./seed/fixtures";
import { assertSafeSeedTarget } from "./seed/guards";
import { hashSeedPassword } from "./seed/hash";

type SeedSql = postgres.TransactionSql;

function getConnectionUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
}

async function resetSeedRows(sql: SeedSql, owned: ReturnType<typeof seedOwnedIds>) {
  await sql`DELETE FROM blog_reports WHERE id = ANY(${owned.reportIds}::uuid[])`;
  await sql`DELETE FROM views WHERE id = ANY(${owned.viewIds}::uuid[])`;
  await sql`DELETE FROM likes WHERE id = ANY(${owned.likeIds}::uuid[])`;
  await sql`DELETE FROM comments WHERE id = ANY(${owned.commentIds}::uuid[])`;
  await sql`DELETE FROM blog_post_tags WHERE post_id = ANY(${owned.postIds}::uuid[])`;
  await sql`DELETE FROM posts WHERE id = ANY(${owned.postIds}::uuid[]) OR slug = ANY(${owned.postSlugs})`;
  await sql`DELETE FROM post_tags WHERE id = ANY(${owned.postTagIds}::uuid[])`;
  await sql`DELETE FROM projects WHERE slug = ANY(${owned.projectSlugs})`;
  await sql`DELETE FROM events WHERE id = ANY(${owned.eventIds}::uuid[])`;
  await sql`DELETE FROM vibe_videos WHERE id = ANY(${owned.videoIds}::uuid[])`;
  await sql`DELETE FROM faqs WHERE id = ANY(${owned.faqIds}::uuid[])`;
  await sql`DELETE FROM testimonials WHERE id = ANY(${owned.testimonialIds}::uuid[])`;
  await sql`DELETE FROM categories WHERE id = ANY(${owned.categoryIds}::uuid[]) OR name = ANY(${owned.categoryNames})`;
  await sql`DELETE FROM session WHERE user_id = ANY(${owned.userIds})`;
  await sql`DELETE FROM account WHERE user_id = ANY(${owned.userIds})`;
  await sql`DELETE FROM users WHERE id = ANY(${owned.userIds})`;
  await sql`DELETE FROM "user" WHERE id = ANY(${owned.userIds})`;
}

async function seedUsers(sql: SeedSql, passwordHash: string) {
  for (const user of SEED_USERS) {
    await sql`
      INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
      VALUES (${user.id}, ${user.name}, ${user.email}, true, ${SEED_AVATAR}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        email_verified = true,
        image = EXCLUDED.image,
        updated_at = NOW()
    `;

    await sql`
      INSERT INTO users (
        id, username, display_name, bio, avatar_url, location, website, github_url, role, updated_at
      )
      VALUES (
        ${user.id}, ${user.username}, ${user.displayName}, ${user.bio}, ${SEED_AVATAR},
        ${user.location}, ${user.website}, ${user.githubUrl}, ${user.role}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        location = EXCLUDED.location,
        website = EXCLUDED.website,
        github_url = EXCLUDED.github_url,
        role = EXCLUDED.role,
        updated_at = NOW()
    `;

    const accountId = `seed-account-${user.id}`;
    await sql`
      INSERT INTO account (
        id, account_id, provider_id, user_id, password, created_at, updated_at
      )
      VALUES (
        ${accountId}, ${user.id}, 'credential', ${user.id}, ${passwordHash}, NOW(), NOW()
      )
      ON CONFLICT (user_id, provider_id) DO UPDATE SET
        password = EXCLUDED.password,
        updated_at = NOW()
    `;
  }
}

async function seedLookupRows(sql: SeedSql) {
  for (const category of SEED_CATEGORIES) {
    await sql`
      INSERT INTO categories (id, name, display_name, description, icon, color, sort_order, is_active)
      VALUES (
        ${category.id}::uuid, ${category.name}, ${category.displayName}, ${category.description},
        ${category.icon}, ${category.color}, ${category.sortOrder}, true
      )
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order,
        is_active = true,
        updated_at = NOW()
    `;
  }

  for (const tag of SEED_POST_TAGS) {
    await sql`
      INSERT INTO post_tags (id, name, slug)
      VALUES (${tag.id}::uuid, ${tag.name}, ${tag.slug})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `;
  }
}

async function seedProjects(sql: SeedSql): Promise<Map<string, number>> {
  const bySlug = new Map<string, number>();

  for (const project of SEED_PROJECTS) {
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO projects (
        title, slug, description, category, website_url, image_url, image_urls, image_keys,
        tags, tagline, author_id, featured
      )
      VALUES (
        ${project.title}, ${project.slug}, ${project.description}, ${project.category},
        ${project.websiteUrl}, ${SEED_COVER}, ${[SEED_COVER]}, ${["seed-cover"]},
        ${project.tags}, ${project.tagline}, ${project.authorId}, ${project.featured}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        website_url = EXCLUDED.website_url,
        image_url = EXCLUDED.image_url,
        image_urls = EXCLUDED.image_urls,
        image_keys = EXCLUDED.image_keys,
        tags = EXCLUDED.tags,
        tagline = EXCLUDED.tagline,
        author_id = EXCLUDED.author_id,
        featured = EXCLUDED.featured,
        updated_at = NOW()
      RETURNING id
    `;
    if (!row) throw new Error(`Failed to upsert project ${project.slug}`);
    bySlug.set(project.slug, row.id);
  }

  return bySlug;
}

async function seedPosts(sql: SeedSql) {
  const tagBySlug = new Map(SEED_POST_TAGS.map((tag) => [tag.slug, tag.id]));

  for (const post of SEED_POSTS) {
    const publishedAt = post.status === "published" ? sql`NOW()` : sql`NULL`;
    await sql`
      INSERT INTO posts (
        id, title, slug, content, excerpt, cover_image, author_id, status,
        published_at, read_time_minutes, featured
      )
      VALUES (
        ${post.id}::uuid, ${post.title}, ${post.slug}, ${sql.json(JSON.parse(JSON.stringify(post.content)))}, ${post.excerpt},
        ${SEED_COVER}, ${post.authorId}, ${post.status}, ${publishedAt}, ${post.readTimeMinutes},
        ${post.featured}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        cover_image = EXCLUDED.cover_image,
        author_id = EXCLUDED.author_id,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at,
        read_time_minutes = EXCLUDED.read_time_minutes,
        featured = EXCLUDED.featured,
        updated_at = NOW()
    `;

    for (const tagSlug of post.tags) {
      const tagId = tagBySlug.get(tagSlug);
      if (!tagId) throw new Error(`Unknown post tag ${tagSlug}`);
      await sql`
        INSERT INTO blog_post_tags (post_id, tag_id)
        VALUES (${post.id}::uuid, ${tagId}::uuid)
        ON CONFLICT DO NOTHING
      `;
    }
  }
}

function parentIds(
  row: { projectSlug?: string; postSlug?: string },
  projects: Map<string, number>,
): { projectId: number | null; postId: string | null } {
  if (row.projectSlug) {
    const projectId = projects.get(row.projectSlug);
    if (projectId === undefined) throw new Error(`Unknown project slug ${row.projectSlug}`);
    return { projectId, postId: null };
  }
  if (row.postSlug) {
    const post = SEED_POSTS.find((item) => item.slug === row.postSlug);
    if (!post) throw new Error(`Unknown post slug ${row.postSlug}`);
    return { projectId: null, postId: post.id };
  }
  throw new Error("Seed parent row is missing a project or post");
}

async function seedEngagement(sql: SeedSql, projects: Map<string, number>) {
  for (const comment of SEED_COMMENTS) {
    const parent = parentIds(comment, projects);
    await sql`
      INSERT INTO comments (id, project_id, post_id, user_id, author_name, content)
      VALUES (
        ${comment.id}::uuid, ${parent.projectId}, ${parent.postId}::uuid, ${comment.userId},
        ${comment.authorName ?? null}, ${comment.content}
      )
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
    `;
  }

  for (const like of SEED_LIKES) {
    const parent = parentIds(like, projects);
    await sql`
      INSERT INTO likes (id, project_id, post_id, user_id)
      VALUES (${like.id}::uuid, ${parent.projectId}, ${parent.postId}::uuid, ${like.userId})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const view of SEED_VIEWS) {
    const parent = parentIds(view, projects);
    await sql`
      INSERT INTO views (id, project_id, post_id, user_id, session_id)
      VALUES (
        ${view.id}::uuid, ${parent.projectId}, ${parent.postId}::uuid, ${view.userId},
        ${`seed-session-${view.id}`}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedCommunity(sql: SeedSql) {
  for (const event of SEED_EVENTS) {
    await sql`
      INSERT INTO events (
        id, slug, name, description, date, time, location_type, location_detail,
        organizer, registration_url, cover_image, category, status, approved, submitted_by
      )
      VALUES (
        ${event.id}::uuid, ${event.slug}, ${event.name}, ${event.description},
        ${event.date}::date, ${event.time}::time, ${event.locationType}, ${event.locationDetail},
        ${event.organizer}, ${event.registrationUrl}, ${SEED_COVER}, ${event.category},
        ${event.status}, ${event.approved}, ${event.submittedBy}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        location_type = EXCLUDED.location_type,
        location_detail = EXCLUDED.location_detail,
        approved = EXCLUDED.approved,
        status = EXCLUDED.status,
        updated_at = NOW()
    `;
  }

  for (const faq of SEED_FAQS) {
    await sql`
      INSERT INTO faqs (id, question, answer, is_active, sort_order)
      VALUES (${faq.id}::uuid, ${faq.question}, ${faq.answer}, true, ${faq.sortOrder})
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        answer = EXCLUDED.answer,
        sort_order = EXCLUDED.sort_order,
        is_active = true
    `;
  }

  for (const video of SEED_VIDEOS) {
    await sql`
      INSERT INTO vibe_videos (
        id, title, description, thumbnail, video_id, published_at, view_count, position
      )
      VALUES (
        ${video.id}::uuid, ${video.title}, ${video.description},
        ${`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`},
        ${video.videoId}, ${video.publishedAt}::date, ${video.viewCount}, ${video.position}
      )
      ON CONFLICT (video_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        thumbnail = EXCLUDED.thumbnail,
        position = EXCLUDED.position
    `;
  }

  for (const row of SEED_TESTIMONIALS) {
    const approvedAt = row.status === "approved" ? sql`NOW()` : sql`NULL`;
    await sql`
      INSERT INTO testimonials (
        id, full_name, role, body, avatar_url, avatar_key, status, approved_at
      )
      VALUES (
        ${row.id}::uuid, ${row.fullName}, ${row.role}, ${row.body},
        ${SEED_AVATAR}, ${`seed-avatar-${row.id}`}, ${row.status}, ${approvedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        body = EXCLUDED.body,
        status = EXCLUDED.status,
        approved_at = EXCLUDED.approved_at
    `;
  }

  for (const report of SEED_REPORTS) {
    await sql`
      INSERT INTO blog_reports (id, comment_id, reporter_id, reason, status)
      VALUES (
        ${report.id}::uuid, ${report.commentId}::uuid, ${report.reporterId},
        ${report.reason}, ${report.status}
      )
      ON CONFLICT (id) DO UPDATE SET
        reason = EXCLUDED.reason,
        status = EXCLUDED.status
    `;
  }
}

function printSummary() {
  console.log("\nLocal seed complete.\n");
  console.log("Accounts (shared password):");
  for (const user of SEED_USERS) {
    const role = user.role === 0 ? "admin" : user.role === 1 ? "moderator" : "member";
    console.log(`  ${user.email}  (${role}, /${user.username})`);
  }
  console.log(`  password: ${SEED_PASSWORD}`);
  console.log("\nAdmin: http://localhost:3000/dashboard");
  console.log(
    "OAuth, UploadThing, Resend, and OpenRouter are optional for browse + email login.\n",
  );
}

async function main() {
  loadSeedEnv();
  assertSeedFixtures();
  assertSafeSeedTarget({
    siteUrls: [process.env.VITE_SITE_URL, process.env.NEXT_PUBLIC_SITE_URL],
    allowProduction: process.env.SEED_ALLOW_PRODUCTION === "1",
  });

  const reset = process.argv.includes("--reset");
  const url = getConnectionUrl();
  if (!url) {
    throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL in .env.local");
  }

  const sql = postgres(url, { max: 1 });
  const passwordHash = await hashSeedPassword(SEED_PASSWORD);
  const owned = seedOwnedIds();

  try {
    await sql.begin(async (tx) => {
      if (reset) {
        console.log("Resetting seed-owned rows...");
        await resetSeedRows(tx, owned);
      }
      console.log("Seeding users...");
      await seedUsers(tx, passwordHash);
      console.log("Seeding categories and tags...");
      await seedLookupRows(tx);
      console.log("Seeding projects...");
      const projects = await seedProjects(tx);
      console.log("Seeding posts...");
      await seedPosts(tx);
      console.log("Seeding comments, likes, and views...");
      await seedEngagement(tx, projects);
      console.log("Seeding events, faqs, videos, testimonials, and reports...");
      await seedCommunity(tx);
    });
    printSummary();
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.log(error instanceof Error ? error.message : error);
  process.exit(1);
});

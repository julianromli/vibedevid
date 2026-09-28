import { and, inArray, or, type SQL, sql } from 'drizzle-orm'
import { type Db, getDb } from '@/lib/db'
import {
  authUser,
  authVerification,
  blogReports,
  categories,
  comments,
  events,
  faqs,
  likes,
  posts,
  postTags,
  projects,
  testimonials,
  users,
  vibeVideos,
  views,
} from '@/lib/db/schema'
import { invalidateCached, SHORT_TTL_CACHE_KEYS } from '@/lib/server/short-ttl-cache'
import {
  SEED_CATEGORIES,
  SEED_COMMENTS,
  SEED_DESCRIPTION_MARKER,
  SEED_EVENTS,
  SEED_FAQS,
  SEED_POST_TAGS,
  SEED_POSTS,
  SEED_PROJECTS,
  SEED_REPORTS,
  SEED_TESTIMONIALS,
  SEED_USERS,
  SEED_VIDEOS,
} from '@/scripts/seed/fixtures'
import { requestUrlIsProduction } from '@/scripts/seed/guards'

const seedUserIds = SEED_USERS.map((user) => user.id)
const seedEmails = SEED_USERS.map((user) => user.email)
const projectSlugs = SEED_PROJECTS.map((project) => project.slug)
const postIds = SEED_POSTS.map((post) => post.id)
const postSlugs = SEED_POSTS.map((post) => post.slug)
const eventIds = SEED_EVENTS.map((event) => event.id)
const eventSlugs = SEED_EVENTS.map((event) => event.slug)
const faqIds = SEED_FAQS.map((faq) => faq.id)
const faqQuestions = SEED_FAQS.map((faq) => faq.question)
const videoIds = SEED_VIDEOS.map((video) => video.id)
const videoYtIds = SEED_VIDEOS.map((video) => video.videoId)
const videoDescriptions = SEED_VIDEOS.map((video) => video.description)
const categoryIds = SEED_CATEGORIES.map((category) => category.id)
const postTagIds = SEED_POST_TAGS.map((tag) => tag.id)
const commentIds = SEED_COMMENTS.map((comment) => comment.id)
const reportIds = SEED_REPORTS.map((report) => report.id)
const testimonialIds = SEED_TESTIMONIALS.map((row) => row.id)
const descriptionLike = `%${SEED_DESCRIPTION_MARKER}%`

function requiredSql(value: SQL | undefined): SQL {
  if (!value) throw new Error('Expected a SQL condition')
  return value
}

function matchAny(conditions: SQL[]): SQL {
  if (conditions.length === 1) return conditions[0]
  return requiredSql(or(...conditions))
}

function matchBoth(left: SQL, right: SQL): SQL {
  return requiredSql(and(left, right))
}

function testimonialWhere(): SQL {
  return matchAny([
    inArray(testimonials.id, testimonialIds),
    ...SEED_TESTIMONIALS.map((row) =>
      matchBoth(sql`${testimonials.fullName} = ${row.fullName}`, sql`${testimonials.body} = ${row.body}`),
    ),
  ])
}

function videoWhere(): SQL {
  return matchAny([
    inArray(vibeVideos.id, videoIds),
    inArray(vibeVideos.videoId, videoYtIds),
    inArray(vibeVideos.description, videoDescriptions),
  ])
}

async function findSeedUserIds(db: Db): Promise<string[]> {
  const [fromAuth, fromProfiles] = await Promise.all([
    db
      .select({ id: authUser.id })
      .from(authUser)
      .where(requiredSql(or(inArray(authUser.id, seedUserIds), inArray(authUser.email, seedEmails)))),
    db.select({ id: users.id }).from(users).where(inArray(users.id, seedUserIds)),
  ])

  return [...new Set([...fromAuth, ...fromProfiles].map((row) => row.id))]
}

async function seedRowsRemain(db: Db): Promise<boolean> {
  const checks = await Promise.all([
    db.select({ id: projects.id }).from(projects).where(inArray(projects.slug, projectSlugs)).limit(1),
    db.select({ id: projects.id }).from(projects).where(sql`${projects.description} like ${descriptionLike}`).limit(1),
    db
      .select({ id: authUser.id })
      .from(authUser)
      .where(requiredSql(or(inArray(authUser.id, seedUserIds), inArray(authUser.email, seedEmails))))
      .limit(1),
    db.select({ id: users.id }).from(users).where(inArray(users.id, seedUserIds)).limit(1),
    db.select({ id: posts.id }).from(posts).where(inArray(posts.slug, postSlugs)).limit(1),
    db.select({ id: events.id }).from(events).where(inArray(events.slug, eventSlugs)).limit(1),
    db.select({ id: vibeVideos.id }).from(vibeVideos).where(videoWhere()).limit(1),
    db.select({ id: testimonials.id }).from(testimonials).where(testimonialWhere()).limit(1),
    db
      .select({ id: faqs.id })
      .from(faqs)
      .where(requiredSql(or(inArray(faqs.id, faqIds), inArray(faqs.question, faqQuestions))))
      .limit(1),
  ])

  return checks.some((rows) => rows.length > 0)
}

async function deleteSeedRows(db: Db, userIds: string[]): Promise<void> {
  const projectMatch = matchAny([
    inArray(projects.slug, projectSlugs),
    sql`${projects.description} like ${descriptionLike}`,
    ...(userIds.length > 0 ? [inArray(projects.authorId, userIds)] : []),
  ])
  const postMatch = matchAny([
    inArray(posts.slug, postSlugs),
    inArray(posts.id, postIds),
    ...(userIds.length > 0 ? [inArray(posts.authorId, userIds)] : []),
  ])

  const [projectRows, postRows] = await Promise.all([
    db.select({ id: projects.id }).from(projects).where(projectMatch),
    db.select({ id: posts.id }).from(posts).where(postMatch),
  ])
  const projectIds = projectRows.map((row) => row.id)
  const matchedPostIds = postRows.map((row) => row.id)

  const commentMatch = matchAny([
    inArray(comments.id, commentIds),
    ...(userIds.length > 0 ? [inArray(comments.userId, userIds)] : []),
    ...(projectIds.length > 0 ? [inArray(comments.projectId, projectIds)] : []),
    ...(matchedPostIds.length > 0 ? [inArray(comments.postId, matchedPostIds)] : []),
  ])

  await db
    .delete(blogReports)
    .where(
      matchAny([
        inArray(blogReports.id, reportIds),
        ...(userIds.length > 0 ? [inArray(blogReports.reporterId, userIds)] : []),
        sql`${blogReports.commentId} in (select ${comments.id} from ${comments} where ${commentMatch})`,
      ]),
    )
  await db.delete(comments).where(commentMatch)
  const likeMatch = [
    ...(userIds.length > 0 ? [inArray(likes.userId, userIds)] : []),
    ...(projectIds.length > 0 ? [inArray(likes.projectId, projectIds)] : []),
    ...(matchedPostIds.length > 0 ? [inArray(likes.postId, matchedPostIds)] : []),
  ]
  if (likeMatch.length > 0) {
    await db.delete(likes).where(matchAny(likeMatch))
  }
  const viewMatch = [
    ...(userIds.length > 0 ? [inArray(views.userId, userIds)] : []),
    ...(projectIds.length > 0 ? [inArray(views.projectId, projectIds)] : []),
    ...(matchedPostIds.length > 0 ? [inArray(views.postId, matchedPostIds)] : []),
  ]
  if (viewMatch.length > 0) {
    await db.delete(views).where(matchAny(viewMatch))
  }

  await db.delete(projects).where(projectMatch)
  await db.delete(posts).where(postMatch)
  await db.delete(events).where(requiredSql(or(inArray(events.id, eventIds), inArray(events.slug, eventSlugs))))
  await db.delete(faqs).where(requiredSql(or(inArray(faqs.id, faqIds), inArray(faqs.question, faqQuestions))))
  await db.delete(vibeVideos).where(videoWhere())
  await db.delete(testimonials).where(testimonialWhere())

  await db
    .delete(categories)
    .where(
      matchBoth(
        inArray(categories.id, categoryIds),
        sql`not exists (select 1 from projects where projects.category = categories.name)`,
      ),
    )
  await db
    .delete(postTags)
    .where(
      matchBoth(
        inArray(postTags.id, postTagIds),
        sql`not exists (select 1 from blog_post_tags where blog_post_tags.tag_id = post_tags.id)`,
      ),
    )

  await db.delete(authVerification).where(inArray(authVerification.identifier, seedEmails))
  if (userIds.length > 0) {
    await db.delete(authUser).where(inArray(authUser.id, userIds))
    await db.delete(users).where(inArray(users.id, userIds))
  }
}

/**
 * Delete demo rows inserted by `bun run db:seed`.
 * Real members, projects, posts, events, videos, and testimonials stay.
 * Categories and tags stay when a non-seed row still uses them.
 */
export async function purgeSeedRows(): Promise<{ removed: boolean }> {
  const db = getDb()
  if (!(await seedRowsRemain(db))) return { removed: false }

  const userIds = await findSeedUserIds(db)
  await deleteSeedRows(db, userIds)
  await invalidateCached(SHORT_TTL_CACHE_KEYS.vibeVideos)
  await invalidateCached(SHORT_TTL_CACHE_KEYS.testimonials)
  console.log('[purge-seed] removed demo seed rows from the database')
  return { removed: true }
}

let pendingPurge: Promise<void> | null = null

/**
 * On the production host, remove seed rows once per isolate.
 * Local requests are skipped so `bun run db:seed` still works.
 */
export function ensureProductionSeedPurged(request: Request): Promise<void> {
  if (!requestUrlIsProduction(request.url)) return Promise.resolve()
  if (!pendingPurge) {
    pendingPurge = purgeSeedRows()
      .then(() => undefined)
      .catch((error: unknown) => {
        pendingPurge = null
        console.log('[purge-seed] failed:', error instanceof Error ? error.message : String(error))
      })
  }
  return pendingPurge
}

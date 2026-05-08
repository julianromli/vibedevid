'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { slugifyTitle } from '@/lib/slug'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { deleteUploadthingFiles } from '@/lib/uploadthing'

type CompetitionFieldName =
  | 'competition_id'
  | 'category_id'
  | 'title'
  | 'tagline'
  | 'description'
  | 'process_summary'
  | 'ai_tools_used'
  | 'tech_stacks'
  | 'demo_url'
  | 'repo_url'
  | 'thumbnail_url'
  | 'gallery_urls'
  | 'video_url'

type CompetitionFieldErrors = Partial<Record<CompetitionFieldName, string[]>>

interface CompetitionActionResult {
  success: boolean
  slug?: string
  error?: string
  fieldErrors?: CompetitionFieldErrors
}

interface CompetitionVoteResult {
  success: boolean
  hasVoted?: boolean
  voteCount?: number
  error?: string
}

interface CompetitionSummaryRow {
  id: string
  slug: string
  status: 'draft' | 'active' | 'closed' | 'archived'
  starts_at: string
  ends_at: string
}

interface CompetitionEntryRow {
  id: string
  competition_id: string
  user_id: string
  slug: string
  status: 'published' | 'hidden' | 'disqualified'
  title: string
  thumbnail_key: string | null
  gallery_keys: string[] | null
  vote_count: number | null
  comments_locked?: boolean | null
  competition?: CompetitionSummaryRow | CompetitionSummaryRow[] | null
}

interface CompetitionCategoryRow {
  id: string
  competition_id: string
}

interface CompetitionEntryInput {
  competitionId: string
  categoryId: string
  title: string
  tagline: string
  description: string
  processSummary: string
  aiToolsUsed: string[]
  techStacks: string[]
  demoUrl: string
  repoUrl: string
  thumbnailUrl: string
  thumbnailKey: string | null
  galleryUrls: string[]
  galleryKeys: string[]
  videoUrl: string | null
}

interface CompetitionValidationSuccess {
  success: true
  data: CompetitionEntryInput
}

interface CompetitionValidationFailure {
  success: false
  result: CompetitionActionResult
}

const COMPETITION_ROOT_PATH = '/competition'
const COMPETITION_LIST_PATH = '/competition/list'
const UNEXPECTED_ERROR_MESSAGE = 'Terjadi kesalahan tak terduga.'
const MAX_TITLE_LENGTH = 120
const MAX_TAGLINE_LENGTH = 160
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_PROCESS_SUMMARY_LENGTH = 3000
const MAX_GALLERY_IMAGE_COUNT = 5
const MAX_TECH_STACK_COUNT = 8
const MAX_AI_TOOL_COUNT = 12
const MAX_LIST_ITEM_LENGTH = 40
const MAX_ENTRIES_PER_COMPETITION = 3
const FIELD_NAME_MAP: Record<string, CompetitionFieldName> = {
  competitionId: 'competition_id',
  categoryId: 'category_id',
  title: 'title',
  tagline: 'tagline',
  description: 'description',
  processSummary: 'process_summary',
  aiToolsUsed: 'ai_tools_used',
  techStacks: 'tech_stacks',
  demoUrl: 'demo_url',
  repoUrl: 'repo_url',
  thumbnailUrl: 'thumbnail_url',
  galleryUrls: 'gallery_urls',
  videoUrl: 'video_url',
}

const getFormValue = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName)
  return typeof value === 'string' ? value.trim() : ''
}

const normalizeZodIssues = (error: z.ZodError): CompetitionFieldErrors => {
  const fieldErrors: CompetitionFieldErrors = {}

  for (const issue of error.issues) {
    const path = issue.path[0]
    if (typeof path !== 'string') {
      continue
    }

    const fieldName = FIELD_NAME_MAP[path]
    if (!fieldName) {
      continue
    }

    const messages = fieldErrors[fieldName] ?? []
    if (!messages.includes(issue.message)) {
      messages.push(issue.message)
    }

    fieldErrors[fieldName] = messages
  }

  return fieldErrors
}

const buildValidationErrorResult = (error: z.ZodError): CompetitionActionResult => {
  const fieldErrors = normalizeZodIssues(error)
  const firstFieldError = Object.values(fieldErrors).flat()[0]

  return {
    success: false,
    error: firstFieldError || 'Periksa kembali data submission Anda.',
    fieldErrors,
  }
}

const addArrayIssue = (ctx: z.RefinementCtx, message: string) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
  })
}

const parseJsonStringArray = (
  value: string,
  ctx: z.RefinementCtx,
  options: {
    requiredMessage: string
    invalidMessage: string
    maxItems: number
    itemLabel: string
    maxItemLength?: number
    minItems?: number
  },
): string[] | typeof z.NEVER => {
  if (!value) {
    if ((options.minItems ?? 1) > 0) {
      addArrayIssue(ctx, options.requiredMessage)
      return z.NEVER
    }
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      addArrayIssue(ctx, options.invalidMessage)
      return z.NEVER
    }

    const normalized = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)

    if (normalized.length < (options.minItems ?? 1)) {
      addArrayIssue(ctx, options.requiredMessage)
      return z.NEVER
    }

    if (normalized.length > options.maxItems) {
      addArrayIssue(ctx, `Maksimal ${options.maxItems} ${options.itemLabel}.`)
      return z.NEVER
    }

    const uniqueItems = [...new Set(normalized)]
    const maxItemLength = options.maxItemLength ?? MAX_LIST_ITEM_LENGTH

    for (const item of uniqueItems) {
      if (item.length > maxItemLength) {
        addArrayIssue(ctx, `${options.itemLabel} tidak boleh melebihi ${maxItemLength} karakter.`)
        return z.NEVER
      }
    }

    return uniqueItems
  } catch {
    addArrayIssue(ctx, options.invalidMessage)
    return z.NEVER
  }
}

const parseOptionalJsonStringArray = (
  value: string,
  ctx: z.RefinementCtx,
  options: {
    invalidMessage: string
    maxItems: number
    itemLabel: string
  },
): string[] | typeof z.NEVER => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      addArrayIssue(ctx, options.invalidMessage)
      return z.NEVER
    }

    const normalized = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)

    if (normalized.length > options.maxItems) {
      addArrayIssue(ctx, `Maksimal ${options.maxItems} ${options.itemLabel}.`)
      return z.NEVER
    }

    return normalized
  } catch {
    addArrayIssue(ctx, options.invalidMessage)
    return z.NEVER
  }
}

const normalizeHttpsUrl = (value: string, ctx: z.RefinementCtx, fieldLabel: string): string | typeof z.NEVER => {
  if (!value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} wajib diisi.`,
    })
    return z.NEVER
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${fieldLabel} harus menggunakan https://.`,
      })
      return z.NEVER
    }

    return url.toString()
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${fieldLabel} tidak valid.`,
    })
    return z.NEVER
  }
}

const normalizeOptionalHttpsUrl = (
  value: string,
  ctx: z.RefinementCtx,
  fieldLabel: string,
): string | null | typeof z.NEVER => {
  if (!value) {
    return null
  }

  return normalizeHttpsUrl(value, ctx, fieldLabel)
}

const buildCompetitionEntrySchema = (validCategoryIds: readonly string[]) => {
  const categoryIdSet = new Set(validCategoryIds)

  return z
    .object({
      competitionId: z.string().uuid('Kompetisi tidak valid.'),
      categoryId: z.string().uuid('Kategori wajib dipilih.'),
      title: z
        .string()
        .trim()
        .min(3, 'Judul minimal 3 karakter.')
        .max(MAX_TITLE_LENGTH, `Judul maksimal ${MAX_TITLE_LENGTH} karakter.`),
      tagline: z
        .string()
        .trim()
        .min(3, 'Tagline minimal 3 karakter.')
        .max(MAX_TAGLINE_LENGTH, `Tagline maksimal ${MAX_TAGLINE_LENGTH} karakter.`),
      description: z
        .string()
        .trim()
        .min(40, 'Deskripsi minimal 40 karakter.')
        .max(MAX_DESCRIPTION_LENGTH, `Deskripsi maksimal ${MAX_DESCRIPTION_LENGTH} karakter.`),
      processSummary: z
        .string()
        .trim()
        .min(30, 'Ringkasan proses minimal 30 karakter.')
        .max(MAX_PROCESS_SUMMARY_LENGTH, `Ringkasan proses maksimal ${MAX_PROCESS_SUMMARY_LENGTH} karakter.`),
      aiToolsUsed: z.string().transform((value, ctx) =>
        parseJsonStringArray(value, ctx, {
          requiredMessage: 'Minimal satu AI tool wajib diisi.',
          invalidMessage: 'Daftar AI tool tidak valid.',
          maxItems: MAX_AI_TOOL_COUNT,
          itemLabel: 'AI tool',
        }),
      ),
      techStacks: z.string().transform((value, ctx) =>
        parseJsonStringArray(value, ctx, {
          requiredMessage: 'Minimal satu tech stack wajib diisi.',
          invalidMessage: 'Daftar tech stack tidak valid.',
          maxItems: MAX_TECH_STACK_COUNT,
          itemLabel: 'tech stack',
        }),
      ),
      demoUrl: z.string().transform((value, ctx) => normalizeHttpsUrl(value.trim(), ctx, 'Demo URL')),
      repoUrl: z.string().transform((value, ctx) => normalizeHttpsUrl(value.trim(), ctx, 'Repo URL')),
      thumbnailUrl: z.string().transform((value, ctx) => normalizeHttpsUrl(value.trim(), ctx, 'Thumbnail')),
      thumbnailKey: z.string().trim().nullable().optional(),
      galleryUrls: z.string().transform((value, ctx) =>
        parseOptionalJsonStringArray(value, ctx, {
          invalidMessage: 'Galeri tidak valid.',
          maxItems: MAX_GALLERY_IMAGE_COUNT,
          itemLabel: 'gambar galeri',
        }),
      ),
      galleryKeys: z.string().transform((value, ctx) =>
        parseOptionalJsonStringArray(value, ctx, {
          invalidMessage: 'Kunci galeri tidak valid.',
          maxItems: MAX_GALLERY_IMAGE_COUNT,
          itemLabel: 'kunci galeri',
        }),
      ),
      videoUrl: z.string().transform((value, ctx) => normalizeOptionalHttpsUrl(value.trim(), ctx, 'Video URL')),
    })
    .superRefine((input, ctx) => {
      if (!categoryIdSet.has(input.categoryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoryId'],
          message: 'Kategori tidak tersedia untuk kompetisi aktif.',
        })
      }

      if (input.galleryUrls.length === 0 && !input.videoUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['galleryUrls'],
          message: 'Tambahkan minimal satu gambar galeri atau video demo.',
        })
      }

      if (input.galleryKeys.length > input.galleryUrls.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['galleryUrls'],
          message: 'Kunci upload galeri tidak sinkron dengan daftar gambar.',
        })
      }
    })
}

export async function validateCompetitionEntryInput(
  formData: FormData,
  validCategoryIds: readonly string[],
): Promise<CompetitionValidationSuccess | CompetitionValidationFailure> {
  const rawInput = {
    competitionId: getFormValue(formData, 'competition_id'),
    categoryId: getFormValue(formData, 'category_id'),
    title: getFormValue(formData, 'title'),
    tagline: getFormValue(formData, 'tagline'),
    description: getFormValue(formData, 'description'),
    processSummary: getFormValue(formData, 'process_summary'),
    aiToolsUsed: getFormValue(formData, 'ai_tools_used'),
    techStacks: getFormValue(formData, 'tech_stacks'),
    demoUrl: getFormValue(formData, 'demo_url'),
    repoUrl: getFormValue(formData, 'repo_url'),
    thumbnailUrl: getFormValue(formData, 'thumbnail_url'),
    thumbnailKey: getFormValue(formData, 'thumbnail_key') || null,
    galleryUrls: getFormValue(formData, 'gallery_urls'),
    galleryKeys: getFormValue(formData, 'gallery_keys'),
    videoUrl: getFormValue(formData, 'video_url'),
  }

  const schema = buildCompetitionEntrySchema(validCategoryIds)
  const parsedInput = schema.safeParse(rawInput)

  if (!parsedInput.success) {
    return {
      success: false,
      result: buildValidationErrorResult(parsedInput.error),
    }
  }

  return {
    success: true,
    data: parsedInput.data,
  }
}

export function validateCompetitionMedia(
  input: Pick<CompetitionEntryInput, 'thumbnailUrl' | 'galleryUrls' | 'videoUrl'>,
) {
  if (!input.thumbnailUrl) {
    throw new Error('Thumbnail wajib diisi.')
  }

  if (input.galleryUrls.length === 0 && !input.videoUrl) {
    throw new Error('Tambahkan minimal satu gambar galeri atau video demo.')
  }
}

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? (value[0] ?? null) : value
}

function isCompetitionOpen(competition: CompetitionSummaryRow, now: Date = new Date()): boolean {
  const startsAt = new Date(competition.starts_at)
  const endsAt = new Date(competition.ends_at)
  return competition.status === 'active' && now >= startsAt && now < endsAt
}

export function assertCompetitionIsActive(competition: CompetitionSummaryRow): void {
  if (!isCompetitionOpen(competition)) {
    throw new Error('Kompetisi belum dibuka atau sudah ditutup.')
  }
}

export function assertUserCanVote({ entry, userId }: { entry: CompetitionEntryRow; userId: string }): void {
  if (entry.user_id === userId) {
    throw new Error('Kamu tidak bisa vote entry milik sendiri.')
  }

  if (entry.status !== 'published') {
    throw new Error('Entry ini tidak tersedia untuk voting.')
  }

  const competition = asSingle(entry.competition)
  if (!competition) {
    throw new Error('Kompetisi tidak ditemukan.')
  }

  assertCompetitionIsActive(competition)
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Kamu harus login untuk melakukan aksi ini.')
  }

  return { supabase, user }
}

async function checkCompetitionAdminAccess() {
  const { supabase, user } = await getAuthenticatedUser()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()

  if (!profile || ![0, 1].includes(profile.role ?? 2)) {
    throw new Error('Akses admin diperlukan.')
  }

  return user
}

async function getCompetitionForSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  competitionId: string,
): Promise<CompetitionSummaryRow | null> {
  const { data } = await supabase
    .from('competitions')
    .select('id, slug, status, starts_at, ends_at')
    .eq('id', competitionId)
    .maybeSingle()

  return (data as CompetitionSummaryRow | null) ?? null
}

async function getCompetitionCategoryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  competitionId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('competition_categories')
    .select('id')
    .eq('competition_id', competitionId)
    .eq('is_active', true)

  return (data as CompetitionCategoryRow[] | null)?.map((category) => category.id) ?? []
}

async function ensureUniqueCompetitionEntrySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
): Promise<string> {
  const baseSlug = slugifyTitle(title, 80) || 'entry'
  let slug = baseSlug
  let suffix = 1

  while (suffix <= 100) {
    const { data } = await supabase.from('competition_entries').select('id').eq('slug', slug).limit(1)
    if (!data || data.length === 0) {
      return slug
    }

    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }

  return `${baseSlug}-${Date.now()}`
}

function revalidateCompetition(entrySlug?: string, competitionId?: string, entryId?: string) {
  revalidatePath(COMPETITION_ROOT_PATH)
  revalidatePath(COMPETITION_LIST_PATH)
  revalidatePath('/competition/submit')

  if (entrySlug) {
    revalidatePath(`/competition/${entrySlug}`)
  }

  revalidateTag('competition:active', 'max')

  if (competitionId) {
    revalidateTag(`competition:landing:${competitionId}`, 'max')
    revalidateTag(`competition:entries:${competitionId}`, 'max')
  }

  if (entryId) {
    revalidateTag(`competition:entry:${entryId}`, 'max')
  }
}

async function syncCompetitionEntryVoteCount(entryId: string): Promise<number> {
  const adminClient = createAdminClient()
  const { count } = await adminClient
    .from('competition_votes')
    .select('id', { count: 'exact', head: true })
    .eq('competition_entry_id', entryId)

  const voteCount = count ?? 0
  await adminClient.from('competition_entries').update({ vote_count: voteCount }).eq('id', entryId)
  return voteCount
}

export async function getCurrentUserCompetitionEntryCount(
  competitionId: string,
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const { count, error } = await supabase
      .from('competition_entries')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', competitionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (error) {
      return { success: false, error: 'Gagal mengambil jumlah submission.' }
    }

    return { success: true, count: count ?? 0 }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : UNEXPECTED_ERROR_MESSAGE,
    }
  }
}

export async function submitCompetitionEntry(formData: FormData): Promise<CompetitionActionResult> {
  let uploadKeysToCleanup: string[] = []

  try {
    const { supabase, user } = await getAuthenticatedUser()
    const competitionId = getFormValue(formData, 'competition_id')

    const competition = await getCompetitionForSubmission(supabase, competitionId)
    if (!competition) {
      return { success: false, error: 'Kompetisi aktif tidak ditemukan.' }
    }

    assertCompetitionIsActive(competition)

    const validCategoryIds = await getCompetitionCategoryIds(supabase, competition.id)
    const validationResult = await validateCompetitionEntryInput(formData, validCategoryIds)

    if (!validationResult.success) {
      return validationResult.result
    }

    const input = validationResult.data
    validateCompetitionMedia(input)
    uploadKeysToCleanup = [input.thumbnailKey, ...input.galleryKeys].filter(Boolean) as string[]

    const { count } = await supabase
      .from('competition_entries')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', input.competitionId)
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if ((count ?? 0) >= MAX_ENTRIES_PER_COMPETITION) {
      return {
        success: false,
        error: `Maksimal ${MAX_ENTRIES_PER_COMPETITION} submission per kompetisi.`,
      }
    }

    const slug = await ensureUniqueCompetitionEntrySlug(supabase, input.title)
    const { data, error } = await supabase
      .from('competition_entries')
      .insert({
        competition_id: input.competitionId,
        user_id: user.id,
        category_id: input.categoryId,
        slug,
        title: input.title,
        tagline: input.tagline,
        description: input.description,
        process_summary: input.processSummary,
        ai_tools_used: input.aiToolsUsed,
        tech_stacks: input.techStacks,
        demo_url: input.demoUrl,
        repo_url: input.repoUrl,
        thumbnail_url: input.thumbnailUrl,
        thumbnail_key: input.thumbnailKey,
        gallery_urls: input.galleryUrls,
        gallery_keys: input.galleryKeys,
        video_url: input.videoUrl,
        status: 'published',
        submitted_at: new Date().toISOString(),
      })
      .select('id, slug')
      .single()

    if (error || !data) {
      await deleteUploadthingFiles(uploadKeysToCleanup)
      return {
        success: false,
        error: 'Gagal menyimpan submission kompetisi.',
      }
    }

    revalidateCompetition(data.slug, input.competitionId, data.id)
    return {
      success: true,
      slug: data.slug,
    }
  } catch (error) {
    if (uploadKeysToCleanup.length > 0) {
      await deleteUploadthingFiles(uploadKeysToCleanup)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : UNEXPECTED_ERROR_MESSAGE,
    }
  }
}

export async function deleteCompetitionEntry(entryId: string): Promise<CompetitionActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const { data: entry } = await supabase
      .from('competition_entries')
      .select(
        'id, competition_id, user_id, slug, thumbnail_key, gallery_keys, competition:competitions(id, slug, status, starts_at, ends_at)',
      )
      .eq('id', entryId)
      .maybeSingle()

    const competitionEntry = entry as CompetitionEntryRow | null
    if (!competitionEntry) {
      return { success: false, error: 'Entry tidak ditemukan.' }
    }

    if (competitionEntry.user_id !== user.id) {
      return { success: false, error: 'Kamu tidak bisa menghapus entry ini.' }
    }

    const competition = asSingle(competitionEntry.competition)
    if (!competition) {
      return { success: false, error: 'Kompetisi tidak ditemukan.' }
    }

    assertCompetitionIsActive(competition)

    const { error } = await supabase.from('competition_entries').delete().eq('id', entryId)
    if (error) {
      return { success: false, error: 'Gagal menghapus entry.' }
    }

    const keysToDelete = [competitionEntry.thumbnail_key, ...(competitionEntry.gallery_keys ?? [])].filter(
      Boolean,
    ) as string[]
    if (keysToDelete.length > 0) {
      await deleteUploadthingFiles(keysToDelete)
    }

    revalidateCompetition(competitionEntry.slug, competition.id, competitionEntry.id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : UNEXPECTED_ERROR_MESSAGE,
    }
  }
}

export async function toggleCompetitionVote(entryId: string): Promise<CompetitionVoteResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const { data: entry } = await supabase
      .from('competition_entries')
      .select(
        'id, competition_id, user_id, slug, status, vote_count, competition:competitions(id, slug, status, starts_at, ends_at)',
      )
      .eq('id', entryId)
      .maybeSingle()

    const competitionEntry = entry as CompetitionEntryRow | null
    if (!competitionEntry) {
      return { success: false, error: 'Entry tidak ditemukan.' }
    }

    assertUserCanVote({
      entry: competitionEntry,
      userId: user.id,
    })

    const existingVote = await supabase
      .from('competition_votes')
      .select('id')
      .eq('competition_entry_id', entryId)
      .eq('user_id', user.id)
      .maybeSingle()

    let hasVoted = false

    if (existingVote.data?.id) {
      const { error } = await supabase.from('competition_votes').delete().eq('id', existingVote.data.id)
      if (error) {
        return { success: false, error: 'Gagal membatalkan vote.' }
      }
    } else {
      const { error } = await supabase.from('competition_votes').insert({
        competition_entry_id: entryId,
        competition_id: competitionEntry.competition_id,
        user_id: user.id,
      })

      if (error) {
        if (error.code === '23505') {
          return { success: true, hasVoted: true, voteCount: competitionEntry.vote_count ?? 0 }
        }

        return { success: false, error: 'Gagal menyimpan vote.' }
      }

      hasVoted = true
    }

    const nextVoteCount = await syncCompetitionEntryVoteCount(entryId)
    revalidateCompetition(competitionEntry.slug, competitionEntry.competition_id, competitionEntry.id)

    return {
      success: true,
      hasVoted,
      voteCount: nextVoteCount,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : UNEXPECTED_ERROR_MESSAGE,
    }
  }
}

export async function reportCompetitionEntry(entryId: string, reason: string): Promise<CompetitionActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const normalizedReason = reason.trim()

    if (!normalizedReason) {
      return { success: false, error: 'Alasan laporan wajib diisi.' }
    }

    const { error } = await supabase.from('competition_entry_reports').insert({
      competition_entry_id: entryId,
      reporter_user_id: user.id,
      reason: normalizedReason,
    })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Kamu sudah melaporkan entry ini.' }
      }

      return { success: false, error: 'Gagal mengirim laporan.' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : UNEXPECTED_ERROR_MESSAGE,
    }
  }
}

async function updateCompetitionEntryAdminState(
  entryId: string,
  updates: Record<string, unknown>,
): Promise<CompetitionActionResult> {
  try {
    await checkCompetitionAdminAccess()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('competition_entries')
      .update(updates)
      .eq('id', entryId)
      .select('id, slug, competition_id')
      .single()

    if (error || !data) {
      return { success: false, error: 'Gagal memperbarui status entry.' }
    }

    revalidateCompetition(data.slug, data.competition_id, data.id)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : UNEXPECTED_ERROR_MESSAGE,
    }
  }
}

export async function hideCompetitionEntry(entryId: string) {
  return updateCompetitionEntryAdminState(entryId, { status: 'hidden' })
}

export async function disqualifyCompetitionEntry(entryId: string, reason?: string) {
  return updateCompetitionEntryAdminState(entryId, {
    status: 'disqualified',
    moderation_reason: reason?.trim() || null,
  })
}

export async function featureCompetitionEntry(entryId: string, featured: boolean) {
  return updateCompetitionEntryAdminState(entryId, { is_featured: featured })
}

export async function lockCompetitionEntryComments(entryId: string, locked: boolean) {
  return updateCompetitionEntryAdminState(entryId, { comments_locked: locked })
}

export async function markCompetitionEntryFinalist(entryId: string, finalist: boolean) {
  return updateCompetitionEntryAdminState(entryId, { is_finalist: finalist })
}

export async function markCompetitionEntryWinner(entryId: string, winner: boolean) {
  return updateCompetitionEntryAdminState(entryId, { is_winner: winner })
}

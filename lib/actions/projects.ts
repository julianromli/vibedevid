'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { fetchFavicon } from '../favicon-utils'
import { normalizeProjectWebsiteUrl } from '../project-url'
import { ensureUniqueSlug, slugifyTitle } from '../slug'
import { createClient } from '../supabase/server'
import { deleteUploadthingFiles } from '../uploadthing'

type SubmitProjectFieldName = 'title' | 'tagline' | 'description' | 'category' | 'website_url' | 'image_urls' | 'tags'

type SubmitProjectFieldErrors = Partial<Record<SubmitProjectFieldName, string[]>>

interface SubmitProjectResult {
  success: boolean
  slug?: string
  error?: string
  fieldErrors?: SubmitProjectFieldErrors
}

interface SubmitProjectInput {
  title: string
  description: string
  category: string
  websiteUrl: string | null
  imageUrls: string[]
  imageKeys: string[]
  tagline: string
  tags: string[]
}

interface ProvisionalUploadCleanupResult {
  success: boolean
  deletedCount: number
}

const DEFAULT_FAVICON = '/default-favicon.svg'
const PROJECT_LIST_PATH = '/project/list'
const UNEXPECTED_ERROR_MESSAGE = 'An unexpected error occurred'
const VALIDATION_ERROR_MESSAGE = 'Please fix the highlighted fields and try again'
const MAX_TITLE_LENGTH = 120
const MIN_TITLE_LENGTH = 3
const MAX_TAGLINE_LENGTH = 160
const MIN_TAGLINE_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 1600
const MIN_DESCRIPTION_LENGTH = 30
const MIN_DESCRIPTION_WORDS = 5
const MAX_TAG_COUNT = 10
const MAX_TAG_LENGTH = 32
const FIELD_NAME_MAP: Record<string, SubmitProjectFieldName> = {
  title: 'title',
  tagline: 'tagline',
  description: 'description',
  category: 'category',
  websiteUrl: 'website_url',
  imageUrls: 'image_urls',
  tags: 'tags',
}

interface SubmitProjectRawInput {
  title: string
  description: string
  category: string
  websiteUrl: string
  imageUrls: string
  imageKeys: string
  tagline: string
  tags: string
}

interface ActiveCategoryRow {
  name: string
}

interface SubmitProjectValidationSuccess {
  success: true
  data: SubmitProjectInput
}

interface SubmitProjectValidationFailure {
  success: false
  result: SubmitProjectResult
}

const getFormValue = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName)
  return typeof value === 'string' ? value.trim() : ''
}

const hasLettersOrNumbers = (value: string): boolean => /[a-z0-9]/i.test(value)

const hasMeaningfulDescription = (value: string): boolean => {
  const words = value.match(/[a-z0-9][a-z0-9'’+.#/-]*/gi) ?? []
  return words.length >= MIN_DESCRIPTION_WORDS
}

const normalizeZodIssues = (error: z.ZodError): SubmitProjectFieldErrors => {
  const fieldErrors: SubmitProjectFieldErrors = {}

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

const buildValidationErrorResult = (error: z.ZodError): SubmitProjectResult => {
  const fieldErrors = normalizeZodIssues(error)
  const firstFieldError = Object.values(fieldErrors).flat()[0]

  return {
    success: false,
    error: firstFieldError || VALIDATION_ERROR_MESSAGE,
    fieldErrors,
  }
}

const addTagIssue = (ctx: z.RefinementCtx, message: string) => {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
  })
}

const parseTagList = (value: string, ctx: z.RefinementCtx): unknown[] | typeof z.NEVER => {
  if (!value) {
    addTagIssue(ctx, 'Add at least one tag')
    return z.NEVER
  }

  try {
    const parsedTags: unknown = JSON.parse(value)
    if (Array.isArray(parsedTags)) {
      return parsedTags
    }
  } catch {
    // Fall through to shared validation error below.
  }

  addTagIssue(ctx, 'Tags must be a valid list')
  return z.NEVER
}

const normalizeTagValue = (rawTag: unknown, ctx: z.RefinementCtx): string | null => {
  if (typeof rawTag !== 'string') {
    addTagIssue(ctx, 'Each tag must be text')
    return null
  }

  const normalizedTag = rawTag.trim().toLowerCase()
  if (!normalizedTag) {
    addTagIssue(ctx, 'Tags cannot be blank')
    return null
  }

  if (!hasLettersOrNumbers(normalizedTag)) {
    addTagIssue(ctx, 'Tags must include letters or numbers')
    return null
  }

  if (normalizedTag.length > MAX_TAG_LENGTH) {
    addTagIssue(ctx, `Each tag must be ${MAX_TAG_LENGTH} characters or fewer`)
    return null
  }

  return normalizedTag
}

const normalizeTags = (value: string, ctx: z.RefinementCtx): string[] | typeof z.NEVER => {
  const parsedTags = parseTagList(value, ctx)
  if (parsedTags === z.NEVER) {
    return z.NEVER
  }

  if (parsedTags.length > MAX_TAG_COUNT) {
    addTagIssue(ctx, `Use ${MAX_TAG_COUNT} tags or fewer`)
  }

  const normalizedTags: string[] = []
  const seenTags = new Set<string>()

  for (const rawTag of parsedTags) {
    const normalizedTag = normalizeTagValue(rawTag, ctx)
    if (!normalizedTag || seenTags.has(normalizedTag)) {
      continue
    }

    seenTags.add(normalizedTag)
    normalizedTags.push(normalizedTag)
  }

  if (normalizedTags.length === 0) {
    addTagIssue(ctx, 'Add at least one tag')
    return z.NEVER
  }

  return normalizedTags
}

const normalizeWebsiteUrl = (value: string, ctx: z.RefinementCtx): string | null | typeof z.NEVER => {
  if (!value) {
    return null
  }

  const normalizedWebsiteUrl = normalizeProjectWebsiteUrl(value)
  if (!normalizedWebsiteUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid website URL',
    })
    return z.NEVER
  }

  return normalizedWebsiteUrl
}

const MAX_IMAGE_COUNT = 10

const parseImageArray = (value: string, ctx: z.RefinementCtx): string[] | typeof z.NEVER => {
  if (!value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one project screenshot is required',
    })
    return z.NEVER
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Image URLs must be a valid list',
      })
      return z.NEVER
    }

    if (parsed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one project screenshot is required',
      })
      return z.NEVER
    }

    if (parsed.length > MAX_IMAGE_COUNT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Maximum ${MAX_IMAGE_COUNT} images allowed`,
      })
      return z.NEVER
    }

    return parsed.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid image URLs format',
    })
    return z.NEVER
  }
}

const parseImageKeysArray = (value: string, _ctx: z.RefinementCtx): string[] => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((key): key is string => typeof key === 'string' && key.trim().length > 0)
  } catch {
    return []
  }
}

const buildSubmitProjectSchema = (activeCategoryNames: readonly string[]) => {
  const activeCategorySet = new Set(activeCategoryNames)

  return z
    .object({
      title: z
        .string()
        .trim()
        .min(MIN_TITLE_LENGTH, `Title must be at least ${MIN_TITLE_LENGTH} characters`)
        .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`)
        .refine(hasLettersOrNumbers, 'Title must include letters or numbers'),
      tagline: z
        .string()
        .trim()
        .max(MAX_TAGLINE_LENGTH, `Tagline must be ${MAX_TAGLINE_LENGTH} characters or fewer`)
        .refine(
          (value) => value.length === 0 || value.length >= MIN_TAGLINE_LENGTH,
          `Tagline must be at least ${MIN_TAGLINE_LENGTH} characters or left empty`,
        )
        .refine((value) => value.length === 0 || hasLettersOrNumbers(value), 'Tagline must include letters or numbers'),
      description: z
        .string()
        .trim()
        .min(MIN_DESCRIPTION_LENGTH, `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
        .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`)
        .refine(hasMeaningfulDescription, 'Description must clearly explain what your project does'),
      category: z.string().trim().min(1, 'Category is required'),
      websiteUrl: z.string().trim().transform(normalizeWebsiteUrl),
      imageUrls: z.string().transform(parseImageArray),
      imageKeys: z.string().transform(parseImageKeysArray),
      tags: z.string().transform(normalizeTags),
    })
    .superRefine((input, ctx) => {
      if (!activeCategorySet.has(input.category)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['category'],
          message: 'Choose an active category',
        })
      }
    })
}

const readSubmitProjectInput = (formData: FormData): SubmitProjectRawInput => ({
  title: getFormValue(formData, 'title'),
  description: getFormValue(formData, 'description'),
  category: getFormValue(formData, 'category'),
  websiteUrl: getFormValue(formData, 'website_url'),
  imageUrls: getFormValue(formData, 'image_urls'),
  imageKeys: getFormValue(formData, 'image_keys'),
  tagline: getFormValue(formData, 'tagline'),
  tags: getFormValue(formData, 'tags'),
})

export async function validateAndNormalizeSubmitProjectInput(
  formData: FormData,
  activeCategoryNames: readonly string[],
): Promise<SubmitProjectValidationSuccess | SubmitProjectValidationFailure> {
  const rawInput = readSubmitProjectInput(formData)
  const schema = buildSubmitProjectSchema(activeCategoryNames)
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

const getFaviconOrDefault = async (websiteUrl: string): Promise<string> => {
  if (!websiteUrl) {
    return DEFAULT_FAVICON
  }

  try {
    return await fetchFavicon(websiteUrl)
  } catch {
    return DEFAULT_FAVICON
  }
}

const cleanupProvisionalUploadByKey = async (
  imageKey: string | null | undefined,
): Promise<ProvisionalUploadCleanupResult> => {
  const normalizedKey = imageKey?.trim()

  if (!normalizedKey) {
    return {
      success: true,
      deletedCount: 0,
    }
  }

  try {
    return await deleteUploadthingFiles(normalizedKey)
  } catch {
    return {
      success: false,
      deletedCount: 0,
    }
  }
}

const cleanupProvisionalUploadByKeys = async (
  imageKeys: string[] | null | undefined,
): Promise<ProvisionalUploadCleanupResult> => {
  if (!imageKeys || imageKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    }
  }

  const normalizedKeys = imageKeys.map((key) => key?.trim()).filter(Boolean) as string[]

  if (normalizedKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    }
  }

  try {
    return await deleteUploadthingFiles(normalizedKeys)
  } catch {
    return {
      success: false,
      deletedCount: 0,
    }
  }
}

const revalidateProjectCreationPaths = (slug: string) => {
  revalidatePath(PROJECT_LIST_PATH)
  revalidatePath(`/project/${slug}`)
}

const getActiveCategoryNames = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ data: string[]; error: string | null }> => {
  const { data, error } = await supabase.from('categories').select('name').eq('is_active', true)

  if (error) {
    return {
      data: [],
      error: 'Unable to validate project category right now',
    }
  }

  return {
    data: (data as ActiveCategoryRow[] | null)?.map((category) => category.name).filter(Boolean) ?? [],
    error: null,
  }
}

const resolveAuthorId = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  authenticatedUserId: string,
  providedUserId: string,
): Promise<string> => {
  const candidateUserId = providedUserId.trim() === authenticatedUserId ? providedUserId.trim() : authenticatedUserId
  const { data: profile } = await supabase.from('users').select('id').eq('id', candidateUserId).single()

  return profile?.id || authenticatedUserId
}

const insertProject = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SubmitProjectInput,
  authorId: string,
  faviconUrl: string,
  slug: string,
) => {
  return supabase
    .from('projects')
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      website_url: input.websiteUrl,
      image_urls: input.imageUrls,
      image_keys: input.imageKeys,
      tagline: input.tagline || null,
      favicon_url: faviconUrl,
      author_id: authorId,
      tags: input.tags,
      slug,
    })
    .select('slug')
    .single()
}

const isSlugConflict = (error: { code?: string | null; message?: string | null } | null): boolean => {
  return error?.code === '23505' && error.message?.includes('slug') === true
}

const createProjectWithRetry = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SubmitProjectInput,
  authorId: string,
  faviconUrl: string,
): Promise<SubmitProjectResult> => {
  const baseSlug = slugifyTitle(input.title)
  const slug = await ensureUniqueSlug(baseSlug)
  const initialInsert = await insertProject(supabase, input, authorId, faviconUrl, slug)

  if (!initialInsert.error) {
    return { success: true, slug: initialInsert.data?.slug || slug }
  }

  if (!isSlugConflict(initialInsert.error)) {
    return { success: false, error: initialInsert.error.message }
  }

  const retrySlug = await ensureUniqueSlug(baseSlug)
  const retryInsert = await insertProject(supabase, input, authorId, faviconUrl, retrySlug)

  if (retryInsert.error) {
    return { success: false, error: retryInsert.error.message }
  }

  return { success: true, slug: retryInsert.data?.slug || retrySlug }
}

export async function cleanupProjectProvisionalUpload(imageKey: string): Promise<ProvisionalUploadCleanupResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      deletedCount: 0,
    }
  }

  return cleanupProvisionalUploadByKey(imageKey)
}

export async function cleanupReplacedProjectProvisionalUpload(
  previousImageKey: string,
  nextImageKey: string,
): Promise<ProvisionalUploadCleanupResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      deletedCount: 0,
    }
  }

  const normalizedPreviousKey = previousImageKey.trim()
  const normalizedNextKey = nextImageKey.trim()

  if (!normalizedPreviousKey || normalizedPreviousKey === normalizedNextKey) {
    return {
      success: true,
      deletedCount: 0,
    }
  }

  return cleanupProvisionalUploadByKey(normalizedPreviousKey)
}

export async function submitProject(formData: FormData, userId: string): Promise<SubmitProjectResult> {
  let provisionalImageKeys: string[] = []

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to submit projects' }
    }

    const activeCategories = await getActiveCategoryNames(supabase)
    if (activeCategories.error) {
      return { success: false, error: activeCategories.error }
    }

    const validationResult = await validateAndNormalizeSubmitProjectInput(formData, activeCategories.data)
    if (!validationResult.success) {
      return validationResult.result
    }

    const input = validationResult.data
    provisionalImageKeys = input.imageKeys

    const [faviconUrl, authorId] = await Promise.all([
      getFaviconOrDefault(input.websiteUrl ?? ''),
      resolveAuthorId(supabase, user.id, userId),
    ])

    const result = await createProjectWithRetry(supabase, input, authorId, faviconUrl)
    if (!result.success || !result.slug) {
      await cleanupProvisionalUploadByKeys(input.imageKeys)
      return result
    }

    revalidateProjectCreationPaths(result.slug)
    return result
  } catch {
    await cleanupProvisionalUploadByKeys(provisionalImageKeys)
    return { success: false, error: UNEXPECTED_ERROR_MESSAGE }
  }
}

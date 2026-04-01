'use client'

import { UploadButton } from '@uploadthing/react'
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MultipleSelector, { type Option } from '@/components/ui/multiselect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cleanupProjectProvisionalUpload, submitProject } from '@/lib/actions/projects'
import type { Category } from '@/lib/categories'
import { getFaviconUrl } from '@/lib/favicon-utils'
import { isValidProjectWebsiteUrl, normalizeProjectWebsiteUrl } from '@/lib/project-url'
import type { OurFileRouter } from '@/lib/uploadthing'

const techOptions: Option[] = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'tailwindcss', label: 'Tailwind CSS' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'express', label: 'Express.js' },
  { value: 'fastify', label: 'Fastify' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'python', label: 'Python' },
  { value: 'django', label: 'Django' },
  { value: 'flask', label: 'Flask' },
  { value: 'fastapi', label: 'FastAPI' },
  { value: 'java', label: 'Java' },
  { value: 'spring', label: 'Spring Boot' },
  { value: 'csharp', label: 'C#' },
  { value: 'dotnet', label: '.NET' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'laravel', label: 'Laravel' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'redis', label: 'Redis' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'firebase', label: 'Firebase' },
  { value: 'aws', label: 'AWS' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'netlify', label: 'Netlify' },
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'apollo', label: 'Apollo' },
  { value: 'trpc', label: 'tRPC' },
  { value: 'prisma', label: 'Prisma' },
  { value: 'drizzle', label: 'Drizzle' },
  { value: 'shadcn', label: 'shadcn/ui' },
  { value: 'chakra', label: 'Chakra UI' },
  { value: 'mantine', label: 'Mantine' },
  { value: 'antd', label: 'Ant Design' },
  { value: 'material-ui', label: 'Material-UI' },
]

interface SubmitProjectFormProps {
  userId: string
  categories: Category[]
  redirectTo: string
}

const MAX_TITLE_LENGTH = 120
const MIN_TITLE_LENGTH = 3
const MAX_TAGLINE_LENGTH = 160
const MIN_TAGLINE_LENGTH = 10
const MAX_DESCRIPTION_LENGTH = 1600
const MIN_DESCRIPTION_LENGTH = 30

interface GitHubImportData {
  title?: string
  tagline?: string
  description?: string
  website_url?: string
  favicon_url?: string
  preview_image_url?: string
  image_url?: string
  tags?: string[]
  repo?: {
    name?: string
    full_name?: string
    html_url?: string
    owner?: string
  }
}

interface UploadResult {
  serverData?: {
    key?: string
    url?: string
  }
  url?: string
  key?: string
}

interface SubmitFormState {
  title: string
  tagline: string
  description: string
  uploadedImageUrls: string[]
  importedImageUrl: string
  uploadedImageKeys: string[]
  selectedTags: Option[]
  websiteUrl: string
  faviconUrl: string
  githubRepoUrl: string
  category: string
  currentStep: number
}

interface StoredSubmitProjectDraft {
  version: number
  savedAt: number
  state: SubmitFormState
}

interface DraftNoticeState {
  kind: 'available' | 'restored'
  savedAt?: number
}

interface ReviewSectionSummary {
  id: string
  title: string
  description: string
  stepIndex: number
  issues: string[]
}

const DRAFT_STORAGE_VERSION = 1
const DRAFT_STORAGE_KEY_PREFIX = 'submit-project-draft'
const DRAFT_WRITE_DEBOUNCE_MS = 500
const AUTH_REQUIRED_ERROR_MESSAGE = 'You must be logged in to submit projects'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function formatImportedTagLabel(value: string): string {
  return value.replace(/(^|\s|[-_])(\w)/g, (_match, prefix: string, letter: string) => {
    return (prefix || '') + letter.toUpperCase()
  })
}

function applyImportedValue(current: string, imported: string | undefined): string {
  if (current.trim()) return current
  return imported?.trim() || current
}

function mergeImportedTextState(setState: Dispatch<SetStateAction<string>>, imported: string | undefined): void {
  setState((current) => applyImportedValue(current, imported))
}

function mergeImportedTags(selectedTags: Option[], importedTags: string[] | undefined): Option[] {
  if (!Array.isArray(importedTags) || importedTags.length === 0) {
    return selectedTags
  }

  const existing = new Set(selectedTags.map((tag) => tag.value))
  const next: Option[] = [...selectedTags]

  for (const rawTag of importedTags) {
    const value = String(rawTag).toLowerCase()
    if (existing.has(value)) continue

    const found = techOptions.find((tag) => tag.value.toLowerCase() === value)
    if (found) {
      next.push(found)
    } else {
      next.push({ value, label: formatImportedTagLabel(value) })
    }

    existing.add(value)
  }

  return next.slice(0, 10)
}

async function importGitHubRepo(repoUrl: string): Promise<GitHubImportData> {
  const response = await fetch('/api/github-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  })

  const data = (await response.json()) as GitHubImportData & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || 'Failed to import repo')
  }

  return data
}

function buildSubmitFormData(state: SubmitFormState): FormData {
  const formData = new FormData()

  if (state.title) formData.set('title', state.title)
  if (state.tagline) formData.set('tagline', state.tagline)
  if (state.description) formData.set('description', state.description)

  const allImageUrls = [...state.uploadedImageUrls]
  if (state.importedImageUrl && !allImageUrls.includes(state.importedImageUrl)) {
    allImageUrls.push(state.importedImageUrl)
  }

  if (allImageUrls.length > 0) {
    formData.set('image_urls', JSON.stringify(allImageUrls))
  }

  if (state.uploadedImageKeys.length > 0) {
    formData.set('image_keys', JSON.stringify(state.uploadedImageKeys))
  }

  formData.set('tags', JSON.stringify(state.selectedTags.map((tag) => tag.value)))

  if (state.websiteUrl) {
    formData.set('website_url', state.websiteUrl)
  }

  if (state.category) {
    formData.set('category', state.category)
  }

  return formData
}

function getDraftStorageKey(redirectTo: string): string {
  return `${DRAFT_STORAGE_KEY_PREFIX}:${redirectTo}`
}

function isValidWebsiteUrl(value: string): boolean {
  return isValidProjectWebsiteUrl(value)
}

function clampStepIndex(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Math.min(Math.max(Math.round(value), 0), STEPS.length - 1)
}

function normalizeDraftTags(value: unknown): Option[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized: Option[] = []
  const seen = new Set<string>()

  for (const tag of value) {
    if (!tag || typeof tag !== 'object') {
      continue
    }

    const rawValue = 'value' in tag && typeof tag.value === 'string' ? tag.value.trim() : ''
    if (!rawValue) {
      continue
    }

    const normalizedValue = rawValue.toLowerCase()
    if (seen.has(normalizedValue)) {
      continue
    }

    const label =
      'label' in tag && typeof tag.label === 'string' && tag.label.trim()
        ? tag.label.trim()
        : formatImportedTagLabel(normalizedValue)

    normalized.push({
      value: normalizedValue,
      label,
    })
    seen.add(normalizedValue)
  }

  return normalized.slice(0, 10)
}

function hasMeaningfulDraft(state: SubmitFormState): boolean {
  return Boolean(
    state.currentStep > 0 ||
      state.title.trim() ||
      state.tagline.trim() ||
      state.description.trim() ||
      state.uploadedImageUrls.length > 0 ||
      state.importedImageUrl.trim() ||
      state.uploadedImageKeys.length > 0 ||
      state.selectedTags.length > 0 ||
      state.websiteUrl.trim() ||
      state.faviconUrl.trim() ||
      state.githubRepoUrl.trim() ||
      state.category.trim(),
  )
}

function parseStoredDraft(rawValue: string | null): StoredSubmitProjectDraft | null {
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredSubmitProjectDraft>
    if (parsed.version !== DRAFT_STORAGE_VERSION || !parsed.state || typeof parsed.state !== 'object') {
      return null
    }

    const state = parsed.state as Partial<SubmitFormState>
    const normalizedState: SubmitFormState = {
      title: typeof state.title === 'string' ? state.title : '',
      tagline: typeof state.tagline === 'string' ? state.tagline : '',
      description: typeof state.description === 'string' ? state.description : '',
      uploadedImageUrls: Array.isArray(state.uploadedImageUrls) ? state.uploadedImageUrls : [],
      importedImageUrl: typeof state.importedImageUrl === 'string' ? state.importedImageUrl : '',
      uploadedImageKeys: Array.isArray(state.uploadedImageKeys) ? state.uploadedImageKeys : [],
      selectedTags: normalizeDraftTags(state.selectedTags),
      websiteUrl: typeof state.websiteUrl === 'string' ? state.websiteUrl : '',
      faviconUrl: typeof state.faviconUrl === 'string' ? state.faviconUrl : '',
      githubRepoUrl: typeof state.githubRepoUrl === 'string' ? state.githubRepoUrl : '',
      category: typeof state.category === 'string' ? state.category : '',
      currentStep: clampStepIndex(state.currentStep),
    }

    if (!hasMeaningfulDraft(normalizedState)) {
      return null
    }

    return {
      version: DRAFT_STORAGE_VERSION,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      state: normalizedState,
    }
  } catch {
    return null
  }
}

function getUploadImageUrl(uploadResult: UploadResult | undefined): string | null {
  return uploadResult?.serverData?.url || uploadResult?.url || null
}

function getUploadImageKey(uploadResult: UploadResult | undefined): string | null {
  return uploadResult?.serverData?.key || uploadResult?.key || null
}

const STEPS = [
  { id: 'source', title: 'Source' },
  { id: 'basics', title: 'Basics' },
  { id: 'links-media', title: 'Links & Media' },
  { id: 'review', title: 'Review & Submit' },
]

export function SubmitProjectForm({ userId, categories, redirectTo }: SubmitProjectFormProps) {
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [importedImageUrl, setImportedImageUrl] = useState<string>('')
  const [uploadedImageKeys, setUploadedImageKeys] = useState<string[]>([])
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null)
  const [selectedTags, setSelectedTags] = useState<Option[]>([])
  const [title, setTitle] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [websiteUrl, setWebsiteUrl] = useState<string>('')
  const [faviconUrl, setFaviconUrl] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [pendingDraft, setPendingDraft] = useState<StoredSubmitProjectDraft | null>(null)
  const [draftNotice, setDraftNotice] = useState<DraftNoticeState | null>(null)

  const router = useRouter()

  const draftStorageKey = getDraftStorageKey(redirectTo)
  const activeImageUrls = uploadedImageUrls.length > 0 ? uploadedImageUrls : importedImageUrl ? [importedImageUrl] : []
  const normalizedWebsiteUrl = normalizeProjectWebsiteUrl(websiteUrl)
  const trimmedWebsiteUrl = websiteUrl.trim()
  const normalizedWebsitePreview =
    normalizedWebsiteUrl && normalizedWebsiteUrl !== trimmedWebsiteUrl ? normalizedWebsiteUrl : null

  const getCurrentDraftState = useCallback(
    (): SubmitFormState => ({
      title,
      tagline,
      description,
      uploadedImageUrls,
      importedImageUrl,
      uploadedImageKeys,
      selectedTags,
      websiteUrl,
      faviconUrl,
      githubRepoUrl,
      category,
      currentStep,
    }),
    [
      category,
      currentStep,
      description,
      faviconUrl,
      githubRepoUrl,
      importedImageUrl,
      selectedTags,
      tagline,
      title,
      uploadedImageKeys,
      uploadedImageUrls,
      websiteUrl,
    ],
  )

  useEffect(() => {
    setMounted(true)
    const restoredDraft = parseStoredDraft(sessionStorage.getItem(draftStorageKey))
    if (restoredDraft) {
      setPendingDraft(restoredDraft)
      setDraftNotice({ kind: 'available', savedAt: restoredDraft.savedAt })
    }
  }, [draftStorageKey])

  useEffect(() => {
    if (!mounted) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const nextDraftState = getCurrentDraftState()

      if (!hasMeaningfulDraft(nextDraftState)) {
        if (!pendingDraft) {
          sessionStorage.removeItem(draftStorageKey)
        }
        return
      }

      const storedDraft: StoredSubmitProjectDraft = {
        version: DRAFT_STORAGE_VERSION,
        savedAt: Date.now(),
        state: nextDraftState,
      }

      sessionStorage.setItem(draftStorageKey, JSON.stringify(storedDraft))
    }, DRAFT_WRITE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [draftStorageKey, getCurrentDraftState, mounted, pendingDraft])

  const persistDraftNow = (state: SubmitFormState = getCurrentDraftState()) => {
    if (!mounted || !hasMeaningfulDraft(state)) {
      return
    }

    const storedDraft: StoredSubmitProjectDraft = {
      version: DRAFT_STORAGE_VERSION,
      savedAt: Date.now(),
      state,
    }

    sessionStorage.setItem(draftStorageKey, JSON.stringify(storedDraft))
  }

  const clearSavedDraft = () => {
    if (mounted) {
      sessionStorage.removeItem(draftStorageKey)
    }

    setPendingDraft(null)
    setDraftNotice(null)
  }

  const restoreDraft = () => {
    if (!pendingDraft) {
      return
    }

    const restoredState = pendingDraft.state
    setTitle(restoredState.title)
    setTagline(restoredState.tagline)
    setDescription(restoredState.description)
    setUploadedImageUrls(restoredState.uploadedImageUrls || [])
    setImportedImageUrl(restoredState.importedImageUrl)
    setUploadedImageKeys(restoredState.uploadedImageKeys || [])
    setSelectedTags(restoredState.selectedTags)
    setWebsiteUrl(restoredState.websiteUrl)
    setFaviconUrl(restoredState.faviconUrl)
    setGithubRepoUrl(restoredState.githubRepoUrl)
    setCategory(restoredState.category)
    setCurrentStep(restoredState.currentStep)
    setError(null)
    setPendingDraft(null)
    setDraftNotice({ kind: 'restored' })
    toast.success('Recovered your saved submit draft')
  }

  const dismissDraftNotice = () => {
    setDraftNotice(null)
  }

  const discardPendingDraft = () => {
    clearSavedDraft()
    toast.success('Saved draft discarded')
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(clampStepIndex(stepIndex))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getBasicsIssues = (): string[] => {
    const issues: string[] = []

    if (!title.trim()) {
      issues.push('Add a project title')
    } else if (title.trim().length < MIN_TITLE_LENGTH) {
      issues.push(`Title needs at least ${MIN_TITLE_LENGTH} characters`)
    } else if (title.length > MAX_TITLE_LENGTH) {
      issues.push(`Title must stay under ${MAX_TITLE_LENGTH} characters`)
    }

    if (tagline.trim() && tagline.trim().length < MIN_TAGLINE_LENGTH) {
      issues.push(`Tagline needs at least ${MIN_TAGLINE_LENGTH} characters or should be left empty`)
    } else if (tagline.length > MAX_TAGLINE_LENGTH) {
      issues.push(`Tagline must stay under ${MAX_TAGLINE_LENGTH} characters`)
    }

    if (!description.trim()) {
      issues.push('Add a project description')
    } else if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      issues.push(`Description needs at least ${MIN_DESCRIPTION_LENGTH} characters`)
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      issues.push(`Description must stay under ${MAX_DESCRIPTION_LENGTH} characters`)
    }

    if (!category) {
      issues.push('Choose a category')
    } else if (!categories.some((item) => item.name === category)) {
      issues.push('Choose an active category')
    }

    return issues
  }

  const getLinksAndMediaIssues = (): string[] => {
    const issues: string[] = []

    if (selectedTags.length === 0) {
      issues.push('Add at least one tag')
    }

    if (!isValidWebsiteUrl(websiteUrl)) {
      issues.push('Enter a valid website URL or leave it empty')
    }

    if (activeImageUrls.length === 0) {
      issues.push('Add at least one project screenshot before submitting')
    }

    return issues
  }

  const reviewSections: ReviewSectionSummary[] = [
    {
      id: 'source',
      title: 'Source',
      description: githubRepoUrl.trim() ? githubRepoUrl.trim() : 'Manual entry',
      stepIndex: 0,
      issues: [],
    },
    {
      id: 'basics',
      title: 'Basics',
      description: title.trim() || 'Title, description, and category summary',
      stepIndex: 1,
      issues: getBasicsIssues(),
    },
    {
      id: 'links-media',
      title: 'Links & Media',
      description:
        activeImageUrls.length > 0 ? 'Link, tags, and screenshots ready for review' : 'Link, tags, and screenshots',
      stepIndex: 2,
      issues: getLinksAndMediaIssues(),
    },
  ]

  const firstReviewIssue = reviewSections.find((section) => section.issues.length > 0)

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      // Basics
      if (!title.trim() || !description.trim() || !category) {
        toast.error('Please fill in all required fields (Title, Description, Category)')
        return false
      }

      if (title.trim().length < MIN_TITLE_LENGTH) {
        toast.error(`Title must be at least ${MIN_TITLE_LENGTH} characters`)
        return false
      }
      if (title.length > MAX_TITLE_LENGTH) {
        toast.error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`)
        return false
      }

      if (tagline.trim() && tagline.trim().length < MIN_TAGLINE_LENGTH) {
        toast.error(`Tagline must be at least ${MIN_TAGLINE_LENGTH} characters`)
        return false
      }
      if (tagline.length > MAX_TAGLINE_LENGTH) {
        toast.error(`Tagline cannot exceed ${MAX_TAGLINE_LENGTH} characters`)
        return false
      }

      if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
        toast.error(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
        return false
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        toast.error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`)
        return false
      }

      const isValidCategory = categories.some((c) => c.name === category)
      if (!isValidCategory) {
        toast.error('Please select a valid, active category')
        return false
      }
    }

    if (currentStep === 2) {
      if (!isValidWebsiteUrl(websiteUrl)) {
        toast.error('Please enter a valid website URL or leave it empty')
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      goToStep(Math.min(currentStep + 1, STEPS.length - 1))
    }
  }

  const handleBack = () => {
    goToStep(Math.max(currentStep - 1, 0))
  }

  const handleSubmitResultError = (result: Awaited<ReturnType<typeof submitProject>>) => {
    if (result.error === AUTH_REQUIRED_ERROR_MESSAGE) {
      persistDraftNow()
      toast.error('Your session expired. Sign in again to continue your submission.')
      router.push(`/user/auth?redirectTo=${redirectTo}`)
      return
    }

    const fieldToStepMap: Record<string, number> = {
      title: 1,
      tagline: 1,
      description: 1,
      category: 1,
      website_url: 2,
      image_url: 2,
      tags: 2,
    }

    const firstFieldWithError = result.fieldErrors ? Object.keys(result.fieldErrors)[0] : null
    if (firstFieldWithError && fieldToStepMap[firstFieldWithError] !== undefined) {
      goToStep(fieldToStepMap[firstFieldWithError])
    }

    toast.error(result.error || 'Waduh, ada error nih! 😅 Coba lagi ya!')
    setError(result.error || 'Failed to submit project')
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    if (firstReviewIssue) {
      toast.error(firstReviewIssue.issues[0])
      goToStep(firstReviewIssue.stepIndex)
      return
    }

    setIsLoading(true)
    setError(null)
    persistDraftNow()

    try {
      const formData = buildSubmitFormData({
        title,
        tagline,
        description,
        uploadedImageUrls,
        importedImageUrl,
        uploadedImageKeys,
        selectedTags,
        websiteUrl,
        category,
        faviconUrl,
        githubRepoUrl,
        currentStep,
      })

      const result = await submitProject(formData, userId)
      if (result.success) {
        clearSavedDraft()
        toast.success('Mantap! 🚀 Project lo berhasil di-submit!')
        setUploadedImageUrls([])
        setUploadedImageKeys([])
        router.push(`/project/${result.slug}`)
      } else {
        handleSubmitResultError(result)
      }
    } catch (_err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubImportClick = async () => {
    const repoUrl = githubRepoUrl.trim()
    if (!repoUrl) return

    setIsImporting(true)
    setError(null)

    try {
      const data = await importGitHubRepo(repoUrl)

      mergeImportedTextState(setTitle, data.title)
      mergeImportedTextState(setTagline, data.tagline)
      mergeImportedTextState(setDescription, data.description)

      mergeImportedTextState(setWebsiteUrl, data.website_url)
      mergeImportedTextState(setFaviconUrl, data.favicon_url)
      mergeImportedTextState(setImportedImageUrl, data.preview_image_url || data.image_url)

      setSelectedTags((currentTags) => mergeImportedTags(currentTags, data.tags))

      toast.success('Imported GitHub repo metadata ✔')
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to import from GitHub'))
      toast.error('Failed to import from GitHub')
    } finally {
      setIsImporting(false)
    }
  }

  const handleUploadBegin = (_name: string) => {
    setIsUploading(true)
    setError(null)

    if (uploadTimeout) {
      clearTimeout(uploadTimeout)
    }

    const timeoutId = setTimeout(() => {
      setIsUploading(false)
      setError('Upload timed out. Please try again.')
    }, 120000)

    setUploadTimeout(timeoutId)
  }

  const handleUploadComplete = (res: UploadResult[] | undefined) => {
    if (uploadTimeout) {
      clearTimeout(uploadTimeout)
      setUploadTimeout(null)
    }

    setIsUploading(false)
    setError(null)

    if (!res || res.length === 0) {
      setError('Upload completed but no files were received. Please try again.')
      return
    }

    const newImageUrls: string[] = []
    const newImageKeys: string[] = []

    for (const uploadResult of res) {
      const imageUrl = getUploadImageUrl(uploadResult)
      const imageKey = getUploadImageKey(uploadResult)

      if (imageUrl && imageKey) {
        newImageUrls.push(imageUrl)
        newImageKeys.push(imageKey)
      }
    }

    if (newImageUrls.length > 0) {
      setUploadedImageUrls((prev) => [...prev, ...newImageUrls])
      setUploadedImageKeys((prev) => [...prev, ...newImageKeys])
      return
    }

    setError('Upload completed but response format is invalid. Please try again.')
  }

  const cleanupActiveUpload = async () => {
    if (uploadedImageKeys.length === 0) {
      return true
    }

    try {
      const result = await cleanupProjectProvisionalUpload(uploadedImageKeys[uploadedImageKeys.length - 1])
      if (result.success) {
        setUploadedImageUrls([])
        setUploadedImageKeys([])
        return true
      }
    } catch {
      // Ignore cleanup error but still return false
    }

    setError('Failed to clean up the uploaded screenshot. Please try again.')
    toast.error('Failed to clean up the uploaded screenshot')
    return false
  }

  const handleUploadError = (error: Error) => {
    if (uploadTimeout) {
      clearTimeout(uploadTimeout)
      setUploadTimeout(null)
    }

    setIsUploading(false)
    setError(`Upload failed: ${error.message}`)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto flex flex-col relative overflow-visible">
      <CardHeader className="bg-muted/50 border-b pb-6">
        <CardTitle className="text-2xl">Project Details</CardTitle>
        <div className="mt-6 flex items-start justify-between gap-2 px-2">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep
            const isCompleted = idx < currentStep

            return (
              <div
                key={step.id}
                className="relative flex min-w-0 flex-1 flex-col"
              >
                <div className="flex items-center justify-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground border-2'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                </div>
                <div className="text-center mt-3 text-xs font-medium text-muted-foreground px-1">
                  <span className={`${isActive ? 'text-foreground' : ''}`}>{step.title}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="absolute top-4 left-1/2 w-full h-[2px] -z-0">
                    <div className={`h-full bg-muted transition-all`} />
                    <div
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-10 pb-24">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/20 mb-6">{error}</div>}

        {draftNotice && (
          <div
            className="mb-6 rounded-lg border bg-muted/40 p-4"
            data-testid="draft-recovery-notice"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {draftNotice.kind === 'available'
                    ? 'We found a saved draft from this browser session.'
                    : 'Your project draft has been restored.'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {draftNotice.kind === 'available'
                    ? 'Restore it to continue where you left off, or discard it if you want a fresh start.'
                    : 'Review the restored details before you submit.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {draftNotice.kind === 'available' ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      data-testid="draft-restore-button"
                      onClick={restoreDraft}
                    >
                      Restore draft
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid="draft-dismiss-button"
                      onClick={dismissDraftNotice}
                    >
                      Not now
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      data-testid="draft-discard-button"
                      onClick={discardPendingDraft}
                    >
                      Discard draft
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="draft-restored-dismiss-button"
                    onClick={dismissDraftNotice}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className="space-y-6"
          data-redirect-to={redirectTo}
        >
          {/* STEP 0: SOURCE */}
          <div className={currentStep === 0 ? 'block' : 'hidden'}>
            {mounted && (
              <div
                className="space-y-4"
                data-testid="github-import"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="github_repo"
                    className="text-lg font-medium"
                  >
                    Import from GitHub
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Save time by importing project details from your repository.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Input
                      id="github_repo"
                      placeholder="owner/repo or https://github.com/owner/repo"
                      className="flex-1"
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                      disabled={isLoading || isUploading || isImporting}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGitHubImportClick}
                      disabled={isLoading || isUploading || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        'Import'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    We’ll pull name, description, homepage, tags, and preview. You can manually edit these in the next
                    steps.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1: BASICS */}
          <div className={currentStep === 1 ? 'block' : 'hidden space-y-6'}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="form-label-enhanced"
                >
                  Project Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter your project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input-enhanced"
                  required
                  disabled={isLoading || isUploading}
                  maxLength={MAX_TITLE_LENGTH}
                />
                <div className="flex items-center justify-between text-sm">
                  <p className="form-helper-text mt-1 text-xs">
                    {title.trim().length === 0
                      ? `Required. Minimum ${MIN_TITLE_LENGTH} characters.`
                      : title.trim().length < MIN_TITLE_LENGTH
                        ? `Needs ${MIN_TITLE_LENGTH - title.trim().length} more characters.`
                        : title.length > MAX_TITLE_LENGTH
                          ? `Exceeds maximum ${MAX_TITLE_LENGTH} characters.`
                          : 'Looking good! ✨'}
                  </p>
                  <span
                    className={`font-medium text-xs ${
                      title.length > MAX_TITLE_LENGTH
                        ? 'text-red-500'
                        : title.length > 0 && title.trim().length < MIN_TITLE_LENGTH
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {title.length}/{MAX_TITLE_LENGTH}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tagline"
                  className="form-label-enhanced"
                >
                  Tagline
                </Label>
                <Input
                  id="tagline"
                  name="tagline"
                  placeholder="A short tagline that describes your project in one sentence"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="form-input-enhanced"
                  disabled={isLoading || isUploading}
                  maxLength={MAX_TAGLINE_LENGTH}
                />
                <div className="flex items-center justify-between text-sm">
                  <p className="form-helper-text mt-1 text-xs">
                    {tagline.trim().length === 0
                      ? `Optional. At least ${MIN_TAGLINE_LENGTH} characters if provided.`
                      : tagline.trim().length < MIN_TAGLINE_LENGTH
                        ? `Needs ${MIN_TAGLINE_LENGTH - tagline.trim().length} more characters.`
                        : tagline.length > MAX_TAGLINE_LENGTH
                          ? `Exceeds maximum ${MAX_TAGLINE_LENGTH} characters.`
                          : 'Looking good! ✨'}
                  </p>
                  <span
                    className={`font-medium text-xs ${
                      tagline.length > MAX_TAGLINE_LENGTH
                        ? 'text-red-500'
                        : tagline.length > 0 && tagline.trim().length < MIN_TAGLINE_LENGTH
                          ? 'text-amber-500'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {tagline.length}/{MAX_TAGLINE_LENGTH}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="form-label-enhanced"
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project, its features, and what makes it special"
                  className="form-input-enhanced"
                  rows={4}
                  required
                  disabled={isLoading || isUploading}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <div className="flex items-center justify-between text-sm">
                  <p className="form-helper-text mt-1 text-xs">
                    {description.trim().length === 0
                      ? `Required. Explain your project (min ${MIN_DESCRIPTION_LENGTH} chars, max ${MAX_DESCRIPTION_LENGTH} chars).`
                      : description.trim().length < MIN_DESCRIPTION_LENGTH
                        ? `Needs ${MIN_DESCRIPTION_LENGTH - description.trim().length} more characters to reach the ${MIN_DESCRIPTION_LENGTH} minimum.`
                        : description.length > MAX_DESCRIPTION_LENGTH
                          ? `Exceeds maximum ${MAX_DESCRIPTION_LENGTH} characters.`
                          : 'Looking good! ✨'}
                  </p>
                  <span
                    className={`font-medium text-xs ${
                      description.length > MAX_DESCRIPTION_LENGTH
                        ? 'text-red-500'
                        : description.length > 0 && description.trim().length < MIN_DESCRIPTION_LENGTH
                          ? 'text-amber-500'
                          : description.length > 1500
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                    }`}
                  >
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="form-label-enhanced"
                >
                  Category *
                </Label>
                <Select
                  name="category"
                  required
                  disabled={isLoading || isUploading}
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.name}
                        >
                          {cat.display_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem
                        value="no-categories"
                        disabled
                      >
                        No categories available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="form-helper-text mt-1 text-xs text-muted-foreground">
                  {!category
                    ? 'Required. Select a category that best fits your project.'
                    : categories.find((c) => c.name === category)?.description || 'Looking good! ✨'}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: LINKS & MEDIA */}
          <div className={currentStep === 2 ? 'block' : 'hidden space-y-6'}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="website_url"
                  className="form-label-enhanced"
                >
                  Website URL
                </Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="your-project.com"
                  className="form-input-enhanced"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={isLoading || isUploading}
                />
                <p className="form-helper-text mt-1 text-xs">
                  {!trimmedWebsiteUrl
                    ? 'Optional. You can paste a full URL or just type google.com and we’ll save it as https://google.com.'
                    : normalizedWebsitePreview
                      ? `Will be saved as ${normalizedWebsitePreview}`
                      : isValidWebsiteUrl(websiteUrl)
                        ? 'Looking good! ✨'
                        : 'Enter a valid website URL or leave it empty'}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="favicon_url"
                  className="form-label-enhanced"
                >
                  Favicon URL
                </Label>
                <div className="flex items-center gap-2">
                  {(faviconUrl || (websiteUrl && getFaviconUrl(websiteUrl))) && (
                    <Image
                      src={faviconUrl || getFaviconUrl(websiteUrl)}
                      alt="Website favicon"
                      className="h-4 w-4 flex-shrink-0"
                      onError={() => setFaviconUrl('')}
                      width={16}
                      height={16}
                    />
                  )}
                  <Input
                    id="favicon_url"
                    name="favicon_url"
                    type="url"
                    placeholder={
                      websiteUrl
                        ? 'Auto-fetch dari website atau manual URL'
                        : 'https://example.com/favicon.ico atau https://example.com/favicon.svg'
                    }
                    className="form-input-enhanced"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    disabled={isLoading || isUploading}
                  />
                </div>
                <p className="form-helper-text mt-1 text-xs">
                  {websiteUrl
                    ? 'Favicon akan otomatis ke-fetch dari website ini! 🌐 Atau masukkan URL manual untuk override.'
                    : 'Masukkan URL favicon manual untuk project lo! Icon kecil yang muncul di browser tab 🎯'}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="form-label-enhanced">Tech Stack / Tags</Label>
                <MultipleSelector
                  value={selectedTags}
                  onChange={setSelectedTags}
                  defaultOptions={techOptions}
                  placeholder="Select technologies used in your project..."
                  emptyIndicator={<p className="text-muted-foreground text-center text-sm">No technologies found.</p>}
                  creatable
                  maxSelected={10}
                  disabled={isLoading || isUploading}
                  commandProps={{
                    label: 'Select tech stack',
                  }}
                />
                <p className="form-helper-text mt-1 text-xs">
                  Pilih teknologi yang lo pakai di project ini. Bisa nambah sendiri kalau gak ada! 🚀
                </p>
              </div>

              <div className="space-y-2">
                <Label className="form-label-enhanced">Project Screenshots (up to 10)</Label>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-600">
                  {uploadedImageUrls.length > 0 && (
                    <div className="space-y-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {uploadedImageUrls.map((url, index) => (
                          <div
                            key={url}
                            className="relative"
                          >
                            <AspectRatio ratio={16 / 9}>
                              <Image
                                src={url}
                                alt={`Uploaded screenshot ${index + 1}`}
                                className="h-full w-full rounded-lg object-cover shadow-md"
                                width={300}
                                height={169}
                              />
                            </AspectRatio>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              data-testid={`remove-uploaded-image-${index}`}
                              onClick={() => {
                                setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index))
                                setUploadedImageKeys((prev) => prev.filter((_, i) => i !== index))
                              }}
                              disabled={isLoading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          {uploadedImageUrls.length} uploaded screenshot{uploadedImageUrls.length !== 1 ? 's' : ''}{' '}
                          active
                        </span>
                      </div>
                    </div>
                  )}

                  {importedImageUrl && !uploadedImageUrls.includes(importedImageUrl) && (
                    <div className="space-y-4 mb-4">
                      <div className="relative opacity-80 border border-muted-foreground/30 rounded-lg overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={importedImageUrl}
                            alt="Imported preview"
                            className="h-full w-full object-cover"
                            width={300}
                            height={169}
                          />
                        </AspectRatio>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setImportedImageUrl('')}
                          >
                            Remove Imported Preview
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Using imported preview</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      {isUploading ? (
                        <div className="space-y-2">
                          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
                          <div className="bg-primary text-primary-foreground rounded-md px-4 py-2 inline-block">
                            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                            Uploading...
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Please wait while your images are being uploaded
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <UploadButton<OurFileRouter, 'projectImageUploader'>
                            endpoint="projectImageUploader"
                            onUploadBegin={handleUploadBegin}
                            onClientUploadComplete={handleUploadComplete}
                            onUploadError={handleUploadError}
                            onUploadProgress={() => {}}
                            config={{
                              mode: 'auto',
                            }}
                            content={{
                              button({ ready }) {
                                if (ready) {
                                  const remaining = 10 - uploadedImageUrls.length
                                  return <div>Add More Images ({remaining} left)</div>
                                }
                                return 'Getting ready...'
                              },
                              allowedContent({ ready, fileTypes, isUploading }) {
                                if (!ready) return 'Checking what you allow'
                                if (isUploading) return 'Uploading...'
                                return `${fileTypes.join(', ')} (max 10 images)`
                              },
                            }}
                            appearance={{
                              button: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md',
                              allowedContent: 'text-sm text-muted-foreground mt-2',
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload screenshots of your project. You can add up to 10 images.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: REVIEW */}
          <div className={currentStep === 3 ? 'block' : 'hidden space-y-6'}>
            <div className="space-y-6">
              <div className="rounded-lg border bg-background p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Ready to submit?</h3>
                  <p className="text-muted-foreground text-sm">
                    Review each section below. If something is missing, jump straight back to the right step.
                  </p>
                </div>

                {firstReviewIssue ? (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                    <p className="font-medium">A few things still need attention before you submit.</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {reviewSections
                        .filter((section) => section.issues.length > 0)
                        .flatMap((section) => section.issues.map((issue) => ({ issue, key: `${section.id}-${issue}` })))
                        .map((item) => (
                          <li key={item.key}>{item.issue}</li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-900 dark:text-green-100">
                    Everything looks ready for submission.
                  </div>
                )}

                <div className="grid gap-3">
                  {reviewSections.map((section) => {
                    const hasIssues = section.issues.length > 0

                    return (
                      <div
                        key={section.id}
                        className="rounded-lg border p-4"
                        data-testid={`review-section-${section.id}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{section.title}</h4>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  hasIssues
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-200'
                                    : 'bg-green-500/15 text-green-700 dark:text-green-200'
                                }`}
                              >
                                {hasIssues ? 'Needs attention' : 'Ready'}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">{section.description}</p>
                            {hasIssues && (
                              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-200">
                                {section.issues.map((issue) => (
                                  <li key={issue}>{issue}</li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-testid={`review-jump-${section.id}`}
                            onClick={() => goToStep(section.stepIndex)}
                          >
                            {hasIssues ? 'Fix this section' : 'Edit section'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Review Project Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Title</span>
                    <span className="font-medium">{title || <span className="text-red-500">Missing</span>}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Tagline</span>
                    <span className="font-medium">{tagline || '-'}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-muted-foreground block text-xs">Description</span>
                    <span className="font-medium line-clamp-2">
                      {description || <span className="text-red-500">Missing</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Category</span>
                    <span className="font-medium">
                      {categories.find((c) => c.name === category)?.display_name || (
                        <span className="text-red-500">Missing</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Website URL</span>
                    <span className="font-medium truncate">{websiteUrl || '-'}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-muted-foreground block text-xs">Tech Stack</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTags.length > 0 ? (
                        selectedTags.map((tag) => (
                          <span
                            key={tag.value}
                            className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs"
                          >
                            {tag.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-red-500">Missing</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 mt-2">
                    <span className="text-muted-foreground block text-xs mb-2">Screenshots</span>
                    {activeImageUrls.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {activeImageUrls.map((url, index) => (
                          <div
                            key={url}
                            className="relative overflow-hidden rounded border"
                          >
                            <AspectRatio ratio={16 / 9}>
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="object-cover"
                                fill
                              />
                            </AspectRatio>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-red-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        No screenshots provided. At least one is required for final submit.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Sticky Mobile Footer for Actions */}
      <CardFooter className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t p-4 sm:absolute sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none flex justify-between">
        <Button
          type="button"
          variant="outline"
          data-testid="prev-step-button"
          onClick={async () => {
            if (currentStep === 0) {
              const cleanedUp = await cleanupActiveUpload()
              if (!cleanedUp) return
              router.back()
            } else {
              handleBack()
            }
          }}
          disabled={isLoading || isUploading}
        >
          {currentStep === 0 ? (
            'Cancel'
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </>
          )}
        </Button>

        {currentStep < 3 ? (
          <Button
            type="button"
            data-testid="next-step-button"
            onClick={handleNext}
            disabled={isLoading || isUploading}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            data-testid="submit-project-button"
            onClick={handleSubmit}
            disabled={isLoading || isUploading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Project'
            )}
          </Button>
        )}
      </CardFooter>
      {/* Spacer to avoid footer overlap on mobile */}
      <div className="h-20 sm:hidden"></div>
    </Card>
  )
}

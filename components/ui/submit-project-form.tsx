'use client'

import { UploadButton } from '@uploadthing/react'
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MultipleSelector, { type Option } from '@/components/ui/multiselect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  cleanupProjectProvisionalUpload,
  cleanupReplacedProjectProvisionalUpload,
  submitProject,
} from '@/lib/actions/projects'
import type { Category } from '@/lib/categories'
import { getFaviconUrl } from '@/lib/favicon-utils'
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

const MAX_DESCRIPTION_LENGTH = 1600

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
  uploadedImageUrl: string
  uploadedImageKey: string
  selectedTags: Option[]
  websiteUrl: string
  category: string
}

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

  if (state.uploadedImageUrl) {
    formData.set('image_url', state.uploadedImageUrl)
  }

  if (state.uploadedImageKey) {
    formData.set('image_key', state.uploadedImageKey)
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

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [uploadedImageKey, setUploadedImageKey] = useState<string>('')
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null)
  const [selectedTags, setSelectedTags] = useState<Option[]>([])
  const [title, setTitle] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [websiteUrl, setWebsiteUrl] = useState<string>('')
  const [faviconUrl, setFaviconUrl] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      // Basics
      if (!title.trim() || !description.trim() || !category) {
        toast.error('Please fill in all required fields (Title, Description, Category)')
        return false
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        toast.error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`)
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = buildSubmitFormData({
        title,
        tagline,
        description,
        uploadedImageUrl,
        uploadedImageKey,
        selectedTags,
        websiteUrl,
        category,
      })

      const result = await submitProject(formData, userId)
      if (result.success) {
        toast.success('Mantap! 🚀 Project lo berhasil di-submit!')
        setUploadedImageKey('')
        router.push(`/project/${result.slug}`)
      } else {
        toast.error('Waduh, ada error nih! 😅 Coba lagi ya!')
        setError(result.error || 'Failed to submit project')
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
      mergeImportedTextState(setUploadedImageUrl, data.preview_image_url || data.image_url)

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

    const uploadResult = Array.isArray(res) ? res[0] : undefined
    const imageUrl = getUploadImageUrl(uploadResult)
    const imageKey = getUploadImageKey(uploadResult)

    if (imageUrl && imageKey) {
      if (uploadedImageKey && uploadedImageKey !== imageKey) {
        void cleanupReplacedProjectProvisionalUpload(uploadedImageKey, imageKey)
      }

      setUploadedImageUrl(imageUrl)
      setUploadedImageKey(imageKey)
      return
    }

    setError('Upload completed but response format is invalid. Please try again.')
  }

  const cleanupActiveUpload = async () => {
    const currentImageKey = uploadedImageKey.trim()
    if (!currentImageKey) {
      return true
    }

    const result = await cleanupProjectProvisionalUpload(currentImageKey)
    if (result.success) {
      setUploadedImageKey('')
      return true
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
      <CardHeader className="bg-muted/50 border-b pb-8">
        <CardTitle className="text-2xl">Project Details</CardTitle>
        <div className="mt-6 flex items-center justify-between gap-2 px-2">
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep
            const isCompleted = idx < currentStep

            return (
              <div
                key={step.id}
                className="flex flex-col flex-1 relative"
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
                <div className="text-center mt-2 text-xs font-medium text-muted-foreground absolute w-full top-8 pt-1">
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
                />
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
                />
                <p className="form-helper-text mt-1 text-xs">
                  Tagline singkat yang describe project lo dalam satu kalimat! ✨
                </p>
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
                    {`Description maksimal ${MAX_DESCRIPTION_LENGTH} karakter untuk konsistensi!`}
                  </p>
                  <span
                    className={`font-medium ${
                      description.length > MAX_DESCRIPTION_LENGTH
                        ? 'text-red-500'
                        : description.length > 1500
                          ? 'text-yellow-500'
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
                  type="url"
                  placeholder="https://your-project.com"
                  className="form-input-enhanced"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={isLoading || isUploading}
                />
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
                <Label className="form-label-enhanced">Project Screenshot</Label>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-600">
                  {uploadedImageUrl ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={uploadedImageUrl || '/placeholder.svg'}
                            alt="Project screenshot preview"
                            className="h-full w-full rounded-lg object-cover shadow-md"
                            width={16}
                            height={16}
                          />
                        </AspectRatio>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={async () => {
                            const cleanedUp = await cleanupActiveUpload()
                            if (!cleanedUp) {
                              return
                            }

                            setUploadedImageUrl('')
                            setError(null)
                          }}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>Image ready!</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {isUploading ? (
                        <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
                      ) : (
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="mt-4">
                        {isUploading ? (
                          <div className="space-y-2">
                            <div className="bg-primary text-primary-foreground rounded-md px-4 py-2">
                              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                              Uploading...
                            </div>
                            <p className="text-muted-foreground text-sm">
                              Please wait while your image is being uploaded
                            </p>
                          </div>
                        ) : (
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
                                if (ready) return <div>Choose File</div>
                                return 'Getting ready...'
                              },
                              allowedContent({ ready, fileTypes, isUploading }) {
                                if (!ready) return 'Checking what you allow'
                                if (isUploading) return 'Uploading...'
                                return `Image (${fileTypes.join(', ')})`
                              },
                            }}
                            appearance={{
                              button: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md',
                              allowedContent: 'text-sm text-muted-foreground mt-2',
                            }}
                          />
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {isUploading ? 'Uploading your screenshot...' : 'Upload a screenshot of your project (max 4MB)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: REVIEW */}
          <div className={currentStep === 3 ? 'block' : 'hidden space-y-6'}>
            <div className="space-y-6">
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
                        <span>-</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 mt-2">
                    <span className="text-muted-foreground block text-xs mb-2">Screenshot</span>
                    {uploadedImageUrl ? (
                      <div className="w-full max-w-sm overflow-hidden rounded border relative">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={uploadedImageUrl}
                            alt="Preview"
                            className="object-cover"
                            fill
                          />
                        </AspectRatio>
                      </div>
                    ) : (
                      <div className="text-amber-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        No screenshot provided. It may be required depending on your category.
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
            onClick={handleNext}
            disabled={isLoading || isUploading}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
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

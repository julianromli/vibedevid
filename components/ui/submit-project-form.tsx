'use client'

import { UploadButton } from '@uploadthing/react'
import { CheckCircle, Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MultipleSelector, { type Option } from '@/components/ui/multiselect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { submitProject } from '@/lib/actions'
import { type Category, getCategories } from '@/lib/categories'
import { getFaviconUrl } from '@/lib/favicon-utils'
import type { OurFileRouter } from '@/lib/uploadthing'

// Common tech stack options for the multiselect
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
}

const MAX_DESCRIPTION_LENGTH = 1600

export function SubmitProjectForm({ userId }: SubmitProjectFormProps) {
  // Ensure client-only blocks don't render on the server to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [selectedTags, setSelectedTags] = useState<Option[]>([])
  const [title, setTitle] = useState<string>('')
  const [tagline, setTagline] = useState<string>('')
  const [websiteUrl, setWebsiteUrl] = useState<string>('')
  const [faviconUrl, setFaviconUrl] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>('')
  const router = useRouter()

  // Fetch categories from database
  useEffect(() => {
    setMounted(true)
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const dbCategories = await getCategories()
        setCategories(dbCategories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setError('Failed to load categories. Please refresh the page.')
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Ensure controlled fields are reflected in formData
      if (title) formData.set('title', title)
      if (tagline) formData.set('tagline', tagline)
      if (description) formData.set('description', description)

      if (uploadedImageUrl) {
        formData.set('image_url', uploadedImageUrl)
      }

      // Add selected tags as JSON string
      const tagsValues = selectedTags.map((tag) => tag.value)
      formData.set('tags', JSON.stringify(tagsValues))

      // Add website URL to form data (for backend favicon fetching)
      if (websiteUrl) {
        formData.set('website_url', websiteUrl)
      }

      const result = await submitProject(formData, userId)
      if (result.success) {
        toast.success('Mantap! 🚀 Project lo berhasil di-submit!')
        router.push(`/project/${result.slug}`)
      } else {
        toast.error('Waduh, ada error nih! 😅 Coba lagi ya!')
        setError(result.error || 'Failed to submit project')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* GitHub Import (client-only to avoid hydration mismatch) */}
          {mounted && (
            <div
              className="space-y-2"
              data-testid="github-import"
            >
              <Label
                htmlFor="github_repo"
                className="form-label-enhanced"
              >
                Import from GitHub
              </Label>
              <div className="flex gap-2">
                <Input
                  id="github_repo"
                  placeholder="owner/repo or https://github.com/owner/repo"
                  className="form-input-enhanced flex-1"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  disabled={isLoading || isUploading || isImporting}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!githubRepoUrl.trim()) return
                    setIsImporting(true)
                    setError(null)
                    try {
                      const res = await fetch('/api/github-import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ repoUrl: githubRepoUrl.trim() }),
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data?.error || 'Failed to import repo')

                      setTitle(data.title || '')
                      setTagline(data.tagline || '')
                      setDescription(data.description || '')
                      if (data.website_url) setWebsiteUrl(data.website_url)
                      if (data.favicon_url) setFaviconUrl(data.favicon_url)
                      if (data.image_url) setUploadedImageUrl(data.image_url)

                      // Merge tags into selector
                      if (Array.isArray(data.tags)) {
                        const existing = new Set(selectedTags.map((t) => t.value))
                        const next: Option[] = [...selectedTags]
                        for (const raw of data.tags as string[]) {
                          const value = String(raw).toLowerCase()
                          if (existing.has(value)) continue
                          // Try to find matching default option for proper label
                          const found = techOptions.find((t) => t.value.toLowerCase() === value)
                          if (found) {
                            next.push(found)
                            existing.add(value)
                          } else {
                            // Fallback: capitalize for label
                            const label = value.replace(
                              /(^|\s|[-_])(\w)/g,
                              (m, p1, p2) => (p1 || '') + p2.toUpperCase(),
                            )
                            next.push({ value, label })
                            existing.add(value)
                          }
                        }
                        setSelectedTags(next.slice(0, 10))
                      }

                      toast.success('Imported GitHub repo metadata ✔')
                    } catch (err: any) {
                      console.error(err)
                      setError(err.message || 'Failed to import from GitHub')
                      toast.error('Failed to import from GitHub')
                    } finally {
                      setIsImporting(false)
                    }
                  }}
                  disabled={isLoading || isUploading || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import</>
                  )}
                </Button>
              </div>
              <p className="form-helper-text mt-1 text-xs">
                We’ll pull name, description, homepage, tags, and preview.
              </p>
            </div>
          )}
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {loadingCategories ? (
                  <SelectItem
                    value="loading"
                    disabled
                  >
                    Loading categories...
                  </SelectItem>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.name}
                    >
                      {category.display_name}
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
                      onClick={() => {
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
                    <span>Image uploaded successfully!</span>
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
                        <p className="text-muted-foreground text-sm">Please wait while your image is being uploaded</p>
                      </div>
                    ) : (
                      <UploadButton<OurFileRouter, 'projectImageUploader'>
                        endpoint="projectImageUploader"
                        onUploadBegin={(name) => {
                          console.log('[v0] Upload started for file:', name)
                          setIsUploading(true)
                          setError(null)

                          // Clear existing timeout if any
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout)
                          }

                          // Set a fallback timeout to prevent stuck state (2 minutes)
                          const timeoutId = setTimeout(() => {
                            console.log('[v0] Upload timeout - resetting state')
                            setIsUploading(false)
                            setError('Upload timed out. Please try again.')
                          }, 120000)

                          setUploadTimeout(timeoutId)
                        }}
                        onClientUploadComplete={(res) => {
                          console.log('[v0] Client upload completed:', res)
                          console.log('[v0] Full response object:', JSON.stringify(res, null, 2))

                          // Clear timeout since upload completed
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout)
                            setUploadTimeout(null)
                          }

                          // Always set uploading to false first and clear any previous errors
                          setIsUploading(false)
                          setError(null)

                          // Check if we have a valid response
                          if (res && Array.isArray(res) && res.length > 0) {
                            const uploadResult = res[0]
                            console.log('[v0] Upload result:', uploadResult)

                            // Try to get URL from different possible locations (prioritize new ufsUrl)
                            const imageUrl = uploadResult.ufsUrl || uploadResult.url || uploadResult.key

                            if (imageUrl) {
                              console.log('[v0] Setting image URL:', imageUrl)
                              setUploadedImageUrl(imageUrl)
                            } else {
                              console.error('[v0] No URL found in upload result:', uploadResult)
                              setError('Upload completed but no URL received. Please try again.')
                            }
                          } else {
                            console.error('[v0] Invalid response format:', res)
                            setError('Upload completed but response format is invalid. Please try again.')
                          }
                        }}
                        onUploadError={(error: Error) => {
                          console.error('[v0] Upload error:', error)

                          // Clear timeout since upload failed
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout)
                            setUploadTimeout(null)
                          }

                          setIsUploading(false)
                          setError(`Upload failed: ${error.message}`)
                        }}
                        onUploadProgress={(progress) => {
                          console.log('[v0] Upload progress:', progress)
                        }}
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

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/20">{error}</div>}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
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
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

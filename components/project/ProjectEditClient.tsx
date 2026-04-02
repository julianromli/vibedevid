'use client'

import { UploadButton } from '@uploadthing/react'
import { Edit, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MultipleSelector, { type Option } from '@/components/ui/multiselect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { editProject } from '@/lib/actions'
import type { Category } from '@/lib/categories'
import { getFaviconUrl } from '@/lib/favicon-utils'
import { isValidProjectWebsiteUrl, normalizeProjectWebsiteUrl } from '@/lib/project-url'
import type { OurFileRouter } from '@/lib/uploadthing'

const MAX_DESCRIPTION_LENGTH = 1600

const techOptions: Option[] = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'tailwindcss', label: 'Tailwind CSS' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'django', label: 'Django' },
  { value: 'flask', label: 'Flask' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'firebase', label: 'Firebase' },
  { value: 'vercel', label: 'Vercel' },
]

interface ProjectEditClientProps {
  project: {
    title: string
    description: string
    tagline: string
    categoryRaw: string
    url: string | null
    imageUrls: string[]
    image: string | null
    imageKeys: string[]
    tags: string[]
    faviconUrl: string
  }
  categories: Category[]
  projectSlug: string
  isOwner: boolean
}

interface UploadResult {
  serverData?: {
    key?: string
    url?: string
  }
  url?: string
  key?: string
}

export function ProjectEditClient({ project, categories, projectSlug, isOwner }: ProjectEditClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [, setIsUploading] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    tagline: '',
    category: '',
    website_url: '',
  })
  const [editImageUrls, setEditImageUrls] = useState<string[]>([])
  const [editImageKeys, setEditImageKeys] = useState<string[]>([])
  const [selectedEditTags, setSelectedEditTags] = useState<Option[]>([])
  const [editWebsiteUrl, setEditWebsiteUrl] = useState<string>('')
  const [editFaviconUrl, setEditFaviconUrl] = useState<string>('')

  if (!isOwner) return null

  const handleEditProject = () => {
    const projectImageUrls = project?.imageUrls || (project?.image ? [project.image] : [])
    const projectImageKeys = project?.imageKeys || []

    setEditFormData({
      title: project?.title || '',
      description: project?.description || '',
      tagline: project?.tagline || '',
      category: project?.categoryRaw || '',
      website_url: project?.url || '',
    })

    setEditImageUrls(projectImageUrls)
    setEditImageKeys(projectImageKeys)

    const existingTags = project?.tags ? project.tags.map((tag: string) => ({ value: tag, label: tag })) : []
    setSelectedEditTags(existingTags)

    setEditWebsiteUrl(project?.url || '')
    setEditFaviconUrl(project?.faviconUrl || '')

    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!projectSlug) return

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append('title', editFormData.title)
      formData.append('description', editFormData.description)
      formData.append('tagline', editFormData.tagline)
      formData.append('category', editFormData.category)
      formData.append('website_url', editWebsiteUrl)
      formData.append('favicon_url', editFaviconUrl)
      formData.append('image_urls', JSON.stringify(editImageUrls))
      formData.append('image_keys', JSON.stringify(editImageKeys))

      const tagsValues = selectedEditTags.map((tag) => tag.value)
      formData.append('tags', JSON.stringify(tagsValues))

      const result = await editProject(projectSlug, formData)

      if (result.success) {
        toast.success('Project updated successfully')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update project')
      }
    } catch (_error) {
      toast.error('Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData({
      title: '',
      description: '',
      tagline: '',
      category: '',
      website_url: '',
    })
    setEditImageUrls([])
    setEditImageKeys([])
  }

  const handleUploadComplete = (res: UploadResult[] | undefined) => {
    setIsUploading(false)

    if (!res || res.length === 0) {
      toast.error('Upload completed but no files were received.')
      return
    }

    const newUrls: string[] = []
    const newKeys: string[] = []

    for (const uploadResult of res) {
      const url = uploadResult?.serverData?.url || uploadResult?.url
      const key = uploadResult?.serverData?.key || uploadResult?.key

      if (url && key) {
        newUrls.push(url)
        newKeys.push(key)
      }
    }

    if (newUrls.length > 0) {
      setEditImageUrls((prev) => [...prev, ...newUrls])
      setEditImageKeys((prev) => [...prev, ...newKeys])
      toast.success(`Added ${newUrls.length} image${newUrls.length !== 1 ? 's' : ''}`)
    }
  }

  const handleUploadBegin = () => {
    setIsUploading(true)
  }

  const handleUploadError = (error: Error) => {
    setIsUploading(false)
    toast.error(`Upload failed: ${error.message}`)
  }

  const removeImage = (index: number) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== index))
    setEditImageKeys((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      {!isEditing && (
        <div className="mb-4 flex justify-center md:justify-start">
          <Button
            onClick={handleEditProject}
            variant="outline"
            size="sm"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>
      )}

      {isEditing && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-6 text-xl font-semibold">Edit Project</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-title"
                  className="form-label-enhanced"
                >
                  Project Title *
                </Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter project title"
                  className="form-input-enhanced"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-tagline"
                  className="form-label-enhanced"
                >
                  Tagline
                </Label>
                <Input
                  id="edit-tagline"
                  value={editFormData.tagline}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      tagline: e.target.value,
                    })
                  }
                  placeholder="A short tagline that describes your project"
                  className="form-input-enhanced"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-description"
                  className="form-label-enhanced"
                >
                  Description *
                </Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your project, its features, and what makes it special"
                  className="form-input-enhanced"
                  rows={4}
                  disabled={isSaving}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Max {MAX_DESCRIPTION_LENGTH} characters</p>
                  <span
                    className={`font-medium ${
                      editFormData.description.length > MAX_DESCRIPTION_LENGTH
                        ? 'text-red-500'
                        : editFormData.description.length > 1500
                          ? 'text-yellow-500'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {editFormData.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
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
                <Label htmlFor="edit-website">Website URL</Label>
                <Input
                  id="edit-website"
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={editWebsiteUrl}
                  onChange={(e) => {
                    const url = e.target.value
                    setEditWebsiteUrl(url)
                    setEditFormData({
                      ...editFormData,
                      website_url: url,
                    })
                  }}
                  placeholder="your-project.com"
                  disabled={isSaving}
                />
                <p className="form-helper-text mt-1 text-xs text-muted-foreground">
                  {!editWebsiteUrl.trim() ? (
                    "Optional. You can paste a full URL or just type google.com and we'll save it as https://google.com."
                  ) : normalizeProjectWebsiteUrl(editWebsiteUrl) &&
                    normalizeProjectWebsiteUrl(editWebsiteUrl) !== editWebsiteUrl.trim() ? (
                    `Will be saved as ${normalizeProjectWebsiteUrl(editWebsiteUrl)}`
                  ) : isValidProjectWebsiteUrl(editWebsiteUrl) ? (
                    'Looking good! ✨'
                  ) : (
                    <span className="text-destructive">Enter a valid website URL or leave it empty</span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-favicon">Favicon URL</Label>
                <div className="flex items-center gap-2">
                  {(editFaviconUrl || (editWebsiteUrl && getFaviconUrl(editWebsiteUrl))) && (
                    <Image
                      src={editFaviconUrl || getFaviconUrl(editWebsiteUrl)}
                      alt="Website favicon"
                      className="h-4 w-4 flex-shrink-0"
                      onError={() => setEditFaviconUrl('')}
                      width={16}
                      height={16}
                    />
                  )}
                  <Input
                    id="edit-favicon"
                    type="url"
                    value={editFaviconUrl}
                    onChange={(e) => setEditFaviconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tech Stack / Tags</Label>
                <MultipleSelector
                  value={selectedEditTags}
                  onChange={setSelectedEditTags}
                  defaultOptions={techOptions}
                  placeholder="Select technologies..."
                  emptyIndicator={<p className="text-muted-foreground text-center text-sm">No technologies found.</p>}
                  creatable
                  maxSelected={10}
                  disabled={isSaving}
                  commandProps={{
                    label: 'Select tech stack',
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Project Screenshots (up to 10)</Label>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  {editImageUrls.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {editImageUrls.map((url, index) => (
                          <div
                            key={url}
                            className="relative"
                          >
                            <AspectRatio ratio={16 / 9}>
                              <Image
                                src={url}
                                alt={`Screenshot ${index + 1}`}
                                fill
                                className="rounded-lg object-cover"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            </AspectRatio>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => removeImage(index)}
                              disabled={isSaving}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>
                      {editImageUrls.length} image{editImageUrls.length !== 1 ? 's' : ''}
                    </span>
                    {editImageUrls.length < 10 && <span>{10 - editImageUrls.length} more can be added</span>}
                  </div>

                  {editImageUrls.length < 10 && (
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
                          if (ready) return <div>Add Images</div>
                          return 'Getting ready...'
                        },
                        allowedContent({ ready, fileTypes, isUploading }) {
                          if (!ready) return 'Checking what you allow'
                          if (isUploading) return 'Uploading...'
                          return `${fileTypes.join(', ')} (max 10 total)`
                        },
                      }}
                      appearance={{
                        button: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md',
                        allowedContent: 'text-sm text-muted-foreground mt-2',
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  disabled={
                    !editFormData.title.trim() ||
                    !editFormData.description.trim() ||
                    editFormData.description.length > MAX_DESCRIPTION_LENGTH ||
                    editImageUrls.length === 0 ||
                    isSaving
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

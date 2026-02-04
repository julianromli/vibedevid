'use client'

import { Edit, Loader2 } from 'lucide-react'
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
  project: any
  categories: Category[]
  projectSlug: string
  isOwner: boolean
}

export function ProjectEditClient({ project, categories, projectSlug, isOwner }: ProjectEditClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    tagline: '',
    category: '',
    website_url: '',
    image_url: '',
  })
  const [selectedEditTags, setSelectedEditTags] = useState<Option[]>([])
  const [editWebsiteUrl, setEditWebsiteUrl] = useState<string>('')
  const [editFaviconUrl, setEditFaviconUrl] = useState<string>('')

  if (!isOwner) return null

  const handleEditProject = () => {
    // Initialize form data with existing project data
    setEditFormData({
      title: project?.title || '',
      description: project?.description || '',
      tagline: project?.tagline || '',
      category: project?.categoryRaw || '',
      website_url: project?.url || '',
      image_url: project?.image || '',
    })

    // Initialize tech stack tags
    const existingTags = project?.tags ? project.tags.map((tag: string) => ({ value: tag, label: tag })) : []
    setSelectedEditTags(existingTags)

    // Initialize website URL and favicon
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
      formData.append('image_url', editFormData.image_url)
      formData.append('favicon_url', editFaviconUrl)

      // Add selected tags as JSON string
      const tagsValues = selectedEditTags.map((tag) => tag.value)
      formData.append('tags', JSON.stringify(tagsValues))

      const result = await editProject(projectSlug, formData)

      if (result.success) {
        toast.success('Project updated successfully')
        // Reload the page to show updated project data
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update project')
      }
    } catch (error) {
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
      image_url: '',
    })
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
              {/* Title */}
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

              {/* Tagline */}
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

              {/* Description */}
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

              {/* Category */}
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

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website URL</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={editWebsiteUrl}
                  onChange={(e) => {
                    const url = e.target.value
                    setEditWebsiteUrl(url)
                    setEditFormData({
                      ...editFormData,
                      website_url: url,
                    })
                  }}
                  placeholder="https://your-project.com"
                  disabled={isSaving}
                />
              </div>

              {/* Favicon URL */}
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

              {/* Tech Stack / Tags */}
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

              {/* Image URL (simplified - no upload for now) */}
              <div className="space-y-2">
                <Label htmlFor="edit-image-url">Image URL</Label>
                <Input
                  id="edit-image-url"
                  type="url"
                  value={editFormData.image_url}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      image_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/image.png"
                  disabled={isSaving}
                />
                {editFormData.image_url && (
                  <div className="relative mt-2">
                    <AspectRatio ratio={16 / 9}>
                      <Image
                        src={editFormData.image_url}
                        alt="Project preview"
                        fill
                        className="rounded-lg object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </AspectRatio>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveEdit}
                  disabled={
                    !editFormData.title.trim() ||
                    !editFormData.description.trim() ||
                    editFormData.description.length > MAX_DESCRIPTION_LENGTH ||
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

'use client'

import { Loader2, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CompetitionSubmitPreview,
  type CompetitionDraftSubmission,
} from '@/components/competition/competition-submit-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitCompetitionEntry } from '@/lib/actions/competition'
import { UploadButton } from '@/lib/uploadthing-client'
import type { CompetitionCategory } from '@/types/competition'

interface CompetitionSubmitFormProps {
  competitionId: string
  categories: CompetitionCategory[]
}

interface FormState {
  categoryId: string
  title: string
  tagline: string
  description: string
  processSummary: string
  aiToolsInput: string
  techStacksInput: string
  demoUrl: string
  repoUrl: string
  thumbnailUrl: string
  thumbnailKey: string
  galleryUrls: string[]
  galleryKeys: string[]
  videoUrl: string
}

const INITIAL_STATE: FormState = {
  categoryId: '',
  title: '',
  tagline: '',
  description: '',
  processSummary: '',
  aiToolsInput: '',
  techStacksInput: '',
  demoUrl: '',
  repoUrl: '',
  thumbnailUrl: '',
  thumbnailKey: '',
  galleryUrls: [],
  galleryKeys: [],
  videoUrl: '',
}

function parseListInput(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildPreviewDraft(
  formState: FormState,
  categories: CompetitionCategory[],
  competitionId: string,
): CompetitionDraftSubmission {
  return {
    competitionId,
    categoryId: formState.categoryId,
    categoryLabel: categories.find((category) => category.id === formState.categoryId)?.label || 'Belum dipilih',
    title: formState.title.trim(),
    tagline: formState.tagline.trim(),
    description: formState.description.trim(),
    processSummary: formState.processSummary.trim(),
    aiToolsUsed: parseListInput(formState.aiToolsInput),
    techStacks: parseListInput(formState.techStacksInput),
    demoUrl: formState.demoUrl.trim(),
    repoUrl: formState.repoUrl.trim(),
    thumbnailUrl: formState.thumbnailUrl,
    thumbnailKey: formState.thumbnailKey,
    galleryUrls: formState.galleryUrls,
    galleryKeys: formState.galleryKeys,
    videoUrl: formState.videoUrl.trim(),
  }
}

export function CompetitionSubmitForm({ competitionId, categories }: CompetitionSubmitFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewDraft = useMemo(
    () => buildPreviewDraft(formState, categories, competitionId),
    [competitionId, categories, formState],
  )

  const validateBeforePreview = () => {
    const errors: Record<string, string[]> = {}

    if (!previewDraft.categoryId) errors.category_id = ['Pilih kategori terlebih dahulu.']
    if (!previewDraft.title) errors.title = ['Judul wajib diisi.']
    if (!previewDraft.tagline) errors.tagline = ['Tagline wajib diisi.']
    if (!previewDraft.description) errors.description = ['Deskripsi wajib diisi.']
    if (!previewDraft.processSummary) errors.process_summary = ['Ringkasan proses wajib diisi.']
    if (!previewDraft.demoUrl) errors.demo_url = ['Demo URL wajib diisi.']
    if (!previewDraft.repoUrl) errors.repo_url = ['Repo URL wajib diisi.']
    if (!previewDraft.thumbnailUrl) errors.thumbnail_url = ['Thumbnail wajib diupload.']
    if (previewDraft.aiToolsUsed.length === 0) errors.ai_tools_used = ['Isi minimal satu AI tool.']
    if (previewDraft.techStacks.length === 0) errors.tech_stacks = ['Isi minimal satu tech stack.']
    if (previewDraft.galleryUrls.length === 0 && !previewDraft.videoUrl) {
      errors.gallery_urls = ['Tambahkan minimal satu gambar galeri atau video demo.']
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error('Lengkapi data wajib sebelum lanjut ke preview.')
      return false
    }

    return true
  }

  const submitDraft = async () => {
    setIsSubmitting(true)
    setFieldErrors({})

    const formData = new FormData()
    formData.set('competition_id', competitionId)
    formData.set('category_id', previewDraft.categoryId)
    formData.set('title', previewDraft.title)
    formData.set('tagline', previewDraft.tagline)
    formData.set('description', previewDraft.description)
    formData.set('process_summary', previewDraft.processSummary)
    formData.set('ai_tools_used', JSON.stringify(previewDraft.aiToolsUsed))
    formData.set('tech_stacks', JSON.stringify(previewDraft.techStacks))
    formData.set('demo_url', previewDraft.demoUrl)
    formData.set('repo_url', previewDraft.repoUrl)
    formData.set('thumbnail_url', previewDraft.thumbnailUrl)
    formData.set('thumbnail_key', previewDraft.thumbnailKey)
    formData.set('gallery_urls', JSON.stringify(previewDraft.galleryUrls))
    formData.set('gallery_keys', JSON.stringify(previewDraft.galleryKeys))
    formData.set('video_url', previewDraft.videoUrl)

    const result = await submitCompetitionEntry(formData)

    if (!result.success) {
      setFieldErrors((result.fieldErrors ?? {}) as Record<string, string[]>)
      toast.error(result.error ?? 'Gagal menyimpan submission.')
      setIsSubmitting(false)
      setIsPreviewing(false)
      return
    }

    toast.success('Entry kompetisi berhasil dipublikasikan.')
    router.push(`/competition/${result.slug}`)
    router.refresh()
  }

  if (isPreviewing) {
    return (
      <CompetitionSubmitPreview
        draft={previewDraft}
        isSubmitting={isSubmitting}
        onBack={() => setIsPreviewing(false)}
        onSubmit={() => {
          void submitDraft()
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category_id">Kategori</Label>
            <select
              id="category_id"
              className="w-full rounded-md border-2 border-border bg-card px-3 py-2 text-sm"
              value={formState.categoryId}
              onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.label}
                </option>
              ))}
            </select>
            {fieldErrors.category_id?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              type="text"
              value={formState.title}
              onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
              placeholder="Nama proyek atau eksperimenmu"
            />
            {fieldErrors.title?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            type="text"
            value={formState.tagline}
            onChange={(event) => setFormState((current) => ({ ...current, tagline: event.target.value }))}
            placeholder="Satu kalimat pendek yang menjelaskan value utamamu"
          />
          {fieldErrors.tagline?.map((error) => (
            <p
              key={error}
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={formState.description}
            onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
            placeholder="Jelaskan produkmu, masalah yang diselesaikan, dan kenapa ini menarik."
            className="min-h-36"
          />
          {fieldErrors.description?.map((error) => (
            <p
              key={error}
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="process_summary">Ringkasan proses vibe coding</Label>
          <Textarea
            id="process_summary"
            value={formState.processSummary}
            onChange={(event) => setFormState((current) => ({ ...current, processSummary: event.target.value }))}
            placeholder="Ceritakan bagaimana AI membantu proses build kamu."
            className="min-h-32"
          />
          {fieldErrors.process_summary?.map((error) => (
            <p
              key={error}
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="demo_url">Demo URL (https)</Label>
            <Input
              id="demo_url"
              type="url"
              value={formState.demoUrl}
              onChange={(event) => setFormState((current) => ({ ...current, demoUrl: event.target.value }))}
              placeholder="https://demo.example.com"
            />
            {fieldErrors.demo_url?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo_url">Repo URL (https)</Label>
            <Input
              id="repo_url"
              type="url"
              value={formState.repoUrl}
              onChange={(event) => setFormState((current) => ({ ...current, repoUrl: event.target.value }))}
              placeholder="https://github.com/user/repo"
            />
            {fieldErrors.repo_url?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ai_tools">AI tools (pisahkan dengan koma)</Label>
            <Textarea
              id="ai_tools"
              value={formState.aiToolsInput}
              onChange={(event) => setFormState((current) => ({ ...current, aiToolsInput: event.target.value }))}
              placeholder="Cursor, Claude, v0, Bolt"
            />
            {fieldErrors.ai_tools_used?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech_stacks">Tech stack (pisahkan dengan koma)</Label>
            <Textarea
              id="tech_stacks"
              value={formState.techStacksInput}
              onChange={(event) => setFormState((current) => ({ ...current, techStacksInput: event.target.value }))}
              placeholder="Next.js, Supabase, Tailwind CSS"
            />
            {fieldErrors.tech_stacks?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video_url">Video demo (opsional)</Label>
          <Input
            id="video_url"
            type="url"
            value={formState.videoUrl}
            onChange={(event) => setFormState((current) => ({ ...current, videoUrl: event.target.value }))}
            placeholder="https://loom.com/... atau https://youtube.com/..."
          />
          {fieldErrors.video_url?.map((error) => (
            <p
              key={error}
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border p-4">
            <div className="space-y-1">
              <h3 className="font-medium">Thumbnail utama</h3>
              <p className="text-sm text-muted-foreground">
                Upload satu gambar utama untuk kartu feed dan halaman detail.
              </p>
            </div>

            {formState.thumbnailUrl ? (
              <div className="relative overflow-hidden rounded-xl border">
                <Image
                  src={formState.thumbnailUrl}
                  alt="Thumbnail entry"
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <UploadButton
              endpoint="projectImageUploader"
              appearance={{
                button: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2',
                allowedContent: 'text-sm text-muted-foreground mt-2',
              }}
              content={{
                button: () => (
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {formState.thumbnailUrl ? 'Ganti thumbnail' : 'Upload thumbnail'}
                  </span>
                ),
                allowedContent: () => 'Gambar JPG/PNG/WebP',
              }}
              onClientUploadComplete={(files) => {
                const uploadedFile = files?.[0]
                if (!uploadedFile) {
                  return
                }

                setFormState((current) => ({
                  ...current,
                  thumbnailUrl: uploadedFile.url,
                  thumbnailKey: uploadedFile.key,
                }))
                toast.success('Thumbnail siap dipakai.')
              }}
              onUploadError={(error) => {
                toast.error(error.message)
              }}
            />

            {fieldErrors.thumbnail_url?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-border p-4">
            <div className="space-y-1">
              <h3 className="font-medium">Galeri screenshot</h3>
              <p className="text-sm text-muted-foreground">
                Tambah hingga 5 screenshot. Jika belum ada galeri, isi Video URL.
              </p>
            </div>

            {formState.galleryUrls.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {formState.galleryUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="space-y-2"
                  >
                    <div className="relative overflow-hidden rounded-xl border">
                      <Image
                        src={url}
                        alt={`Galeri ${index + 1}`}
                        width={1280}
                        height={720}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormState((current) => ({
                          ...current,
                          galleryUrls: current.galleryUrls.filter((_, currentIndex) => currentIndex !== index),
                          galleryKeys: current.galleryKeys.filter((_, currentIndex) => currentIndex !== index),
                        }))
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            <UploadButton
              endpoint="projectImageUploader"
              appearance={{
                button: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2',
                allowedContent: 'text-sm text-muted-foreground mt-2',
              }}
              content={{
                button: () => (
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload galeri
                  </span>
                ),
                allowedContent: () => 'Maksimal 5 gambar',
              }}
              onClientUploadComplete={(files) => {
                let addedAny = false

                setFormState((current) => {
                  const availableSlots = Math.max(0, 5 - current.galleryUrls.length)
                  const nextFiles = files.slice(0, availableSlots)

                  if (nextFiles.length > 0) {
                    addedAny = true
                  }

                  return {
                    ...current,
                    galleryUrls: [...current.galleryUrls, ...nextFiles.map((file) => file.url)].slice(0, 5),
                    galleryKeys: [...current.galleryKeys, ...nextFiles.map((file) => file.key)].slice(0, 5),
                  }
                })

                if (addedAny) {
                  toast.success('Galeri berhasil ditambahkan.')
                } else {
                  toast.error('Galeri sudah mencapai batas maksimum 5 gambar.')
                }
              }}
              onUploadError={(error) => {
                toast.error(error.message)
              }}
            />

            {fieldErrors.gallery_urls?.map((error) => (
              <p
                key={error}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormState(INITIAL_STATE)
              setFieldErrors({})
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (validateBeforePreview()) {
                setIsPreviewing(true)
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Lanjut ke preview
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

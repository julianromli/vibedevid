import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface CompetitionDraftSubmission {
  competitionId: string
  categoryId: string
  categoryLabel: string
  title: string
  tagline: string
  description: string
  processSummary: string
  aiToolsUsed: string[]
  techStacks: string[]
  demoUrl: string
  repoUrl: string
  thumbnailUrl: string
  thumbnailKey: string
  galleryUrls: string[]
  galleryKeys: string[]
  videoUrl: string
}

interface CompetitionSubmitPreviewProps {
  draft: CompetitionDraftSubmission
  isSubmitting: boolean
  onBack: () => void
  onSubmit: () => void
}

export function CompetitionSubmitPreview({ draft, isSubmitting, onBack, onSubmit }: CompetitionSubmitPreviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review sebelum submit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Kategori</p>
            <p className="font-medium">{draft.categoryLabel}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Judul & tagline</p>
            <div>
              <h3 className="font-semibold text-xl">{draft.title}</h3>
              <p className="text-muted-foreground">{draft.tagline}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Demo URL</p>
              <p className="break-all text-sm">{draft.demoUrl}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Repo URL</p>
              <p className="break-all text-sm">{draft.repoUrl}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Thumbnail</p>
            <div className="relative overflow-hidden rounded-xl border">
              <Image
                src={draft.thumbnailUrl}
                alt={draft.title}
                width={1280}
                height={720}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {draft.galleryUrls.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Galeri</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {draft.galleryUrls.map((url) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-xl border"
                  >
                    <Image
                      src={url}
                      alt="Galeri entry"
                      width={1280}
                      height={720}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">AI tools</p>
              <p className="text-sm">{draft.aiToolsUsed.join(', ')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tech stack</p>
              <p className="text-sm">{draft.techStacks.join(', ')}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Deskripsi</p>
            <div className="whitespace-pre-line text-sm leading-6">{draft.description}</div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ringkasan proses</p>
            <div className="whitespace-pre-line text-sm leading-6">{draft.processSummary}</div>
          </div>

          {draft.videoUrl ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Video demo</p>
              <p className="break-all text-sm">{draft.videoUrl}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Kembali edit
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Submit sekarang'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

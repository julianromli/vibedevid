'use client'

import { UploadButton } from '@uploadthing/react'
import { Image as ImageIcon, Link as LinkIcon, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OurFileRouter } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

interface CoverImageUploaderProps {
  value: string
  onChange: (value: string) => void
  isUploading: boolean
  onUploadStart: () => void
  onUploadComplete: (url: string) => void
  onUploadError: (error: Error) => void
  disabled?: boolean
}

function getFirstUploadUrl(res: unknown): string | null {
  if (!Array.isArray(res) || res.length === 0) return null

  const first = res[0]
  if (!first || typeof first !== 'object') return null

  const record = first as Record<string, unknown>
  const ufsUrl = record.ufsUrl
  if (typeof ufsUrl === 'string') return ufsUrl

  const url = record.url
  if (typeof url === 'string') return url

  return null
}

function UrlInputSection({
  value,
  onChange,
  disabled,
  isUploading,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  isUploading: boolean
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="cover-url"
        className="flex items-center gap-2 text-sm font-medium"
      >
        <LinkIcon className="h-4 w-4" />
        <span>Or paste image URL</span>
      </Label>
      <div className="relative">
        <Input
          id="cover-url"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isUploading}
          className={cn(
            'pr-10 transition-all duration-200',
            value && 'ring-primary/20 ring-offset-background ring-2 ring-offset-2',
          )}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange('')}
            disabled={disabled || isUploading}
            className="hover:bg-muted absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">Paste a direct image link from any URL</p>
    </div>
  )
}

function UploadZone({ isUploading }: { isUploading: boolean }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300',
        'border-border hover:border-primary/50 hover:bg-muted/30',
        isUploading && 'pointer-events-none opacity-50',
      )}
    >
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div
          className={cn(
            'relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300',
            'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
          )}
        >
          {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
        </div>

        <div className="space-y-1">
          <p className="font-serif text-lg font-medium">Drag & drop an image</p>
          <p className="text-muted-foreground text-sm">or click to browse from your device</p>
        </div>

        <div className="text-muted-foreground/70 flex items-center gap-2 text-xs">
          <span className="bg-muted rounded-full px-2 py-1">PNG</span>
          <span className="bg-muted rounded-full px-2 py-1">JPG</span>
          <span className="bg-muted rounded-full px-2 py-1">WEBP</span>
          <span className="text-muted-foreground/50">•</span>
          <span>Max 4MB</span>
        </div>

        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isUploading}
        />
      </div>
    </div>
  )
}

function ImagePreview({ src, onClear, isUploading }: { src: string; onClear: () => void; isUploading: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="group bg-muted/30 relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg">
      <div className="aspect-[21/9] w-full overflow-hidden">
        <div
          className={cn(
            'h-full w-full transition-opacity duration-300',
            isLoaded && !error ? 'opacity-100' : 'opacity-0',
          )}
        >
          {error ? (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <div className="text-center">
                <ImageIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-2 text-sm">Failed to load image</p>
              </div>
            </div>
          ) : (
            <img
              src={src}
              alt="Cover preview"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setError(true)}
            />
          )}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onClear}
          disabled={isUploading}
          className="gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
          Remove Image
        </Button>
      </div>

      <div className="absolute right-3 bottom-3 rounded-full bg-black/70 px-3 py-1 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <span className="text-xs font-medium text-white">Cover Image</span>
      </div>
    </div>
  )
}

export function CoverImageUploader({
  value,
  onChange,
  isUploading,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled = false,
}: CoverImageUploaderProps) {
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUploadBegin = useCallback(() => {
    onUploadStart()

    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current)
    }

    uploadTimeoutRef.current = setTimeout(() => {
      onUploadError(new Error('Cover upload timed out. Please try again.'))
    }, 120000)
  }, [onUploadStart, onUploadError])

  const handleUploadComplete = useCallback(
    (res: unknown) => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current)
        uploadTimeoutRef.current = null
      }

      const url = getFirstUploadUrl(res)
      if (url) {
        onUploadComplete(url)
      } else {
        onUploadError(new Error('Upload completed but no URL received'))
      }
    },
    [onUploadComplete, onUploadError],
  )

  const handleUploadError = useCallback(
    (error: Error) => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current)
        uploadTimeoutRef.current = null
      }
      onUploadError(error)
    },
    [onUploadError],
  )

  const hasImage = value.trim() !== ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <span>Cover Image</span>
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        {hasImage && !isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {!hasImage ? (
        <div className="space-y-4">
          <UploadZone isUploading={isUploading} />

          <UploadButton<OurFileRouter, 'blogImageUploader'>
            endpoint="blogImageUploader"
            onUploadBegin={handleUploadBegin}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            config={{ mode: 'auto' }}
            content={{
              button({ ready }) {
                if (isUploading) return <div>Uploading...</div>
                if (ready) return <div>Upload</div>
                return 'Getting ready...'
              },
            }}
            appearance={{
              button: 'hidden',
              allowedContent: 'hidden',
            }}
          />

          <UrlInputSection
            value={value}
            onChange={onChange}
            disabled={disabled}
            isUploading={isUploading}
          />

          <p className="text-muted-foreground/70 text-xs">Paste an image URL or upload a file (max 4MB).</p>
        </div>
      ) : (
        <ImagePreview
          src={value}
          onClear={() => onChange('')}
          isUploading={isUploading}
        />
      )}
    </div>
  )
}

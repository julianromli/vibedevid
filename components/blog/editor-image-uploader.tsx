'use client'

import { Image as ImageIcon, Link as LinkIcon, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useUploadThing } from '@/lib/uploadthing-client'

interface EditorImageUploaderProps {
  value: string
  onChange: (value: string) => void
  isUploading: boolean
  onUploadStart: () => void
  onUploadComplete: (url: string) => void
  onUploadError: (error: Error) => void
  disabled?: boolean
  onInsert?: () => void
}

function UrlInputSection({
  value,
  onChange,
  disabled,
  isUploading,
  onInsert,
  showInsert,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  isUploading: boolean
  onInsert?: () => void
  showInsert?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="image-url"
        className="text-sm font-medium"
      >
        Image URL
      </Label>
      <div className="relative flex gap-2">
        <Input
          id="image-url"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isUploading}
          className={cn('flex-1 transition-all duration-200', value && 'pr-10')}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            disabled={disabled || isUploading}
            className="hover:bg-muted absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showInsert && onInsert && (
        <Button
          type="button"
          size="sm"
          onClick={onInsert}
          disabled={!value.trim() || disabled || isUploading}
          className="mt-2"
        >
          Insert
        </Button>
      )}
    </div>
  )
}

function UploadZone({ isUploading, onFileSelect }: { isUploading: boolean; onFileSelect: (file: File) => void }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border-2 border-dashed transition-all duration-300',
        'border-border hover:border-primary/50 hover:bg-muted/30',
        isUploading && 'pointer-events-none opacity-50',
      )}
    >
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300',
            'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
          )}
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </div>

        <div className="space-y-1">
          <p className="text-base font-medium">Drag & drop an image</p>
          <p className="text-muted-foreground text-xs">or click to browse from your device</p>
        </div>

        <div className="text-muted-foreground/70 flex items-center gap-2 text-[10px]">
          <span className="bg-muted rounded-full px-2 py-0.5">PNG</span>
          <span className="bg-muted rounded-full px-2 py-0.5">JPG</span>
          <span className="bg-muted rounded-full px-2 py-0.5">WEBP</span>
          <span className="text-muted-foreground/50">•</span>
          <span>4MB max</span>
        </div>

        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />
      </div>
    </div>
  )
}

export function EditorImageUploader({
  value,
  onChange,
  isUploading,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled = false,
  onInsert,
}: EditorImageUploaderProps) {
  const { startUpload } = useUploadThing('blogImageUploader', {
    onUploadBegin: () => {
      onUploadStart()
    },
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl || res?.[0]?.url
      if (url) {
        onUploadComplete(url)
      } else {
        onUploadError(new Error('No URL returned from upload'))
      }
    },
    onUploadError: (error) => {
      onUploadError(error)
    },
  })

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        await startUpload([file])
      } catch (err) {
        onUploadError(err instanceof Error ? err : new Error('Upload failed'))
      }
    },
    [startUpload, onUploadError],
  )

  const hasImage = value.trim() !== ''

  return (
    <div className="space-y-4">
      {!hasImage ? (
        <>
          <UploadZone
            isUploading={isUploading}
            onFileSelect={handleFileSelect}
          />

          <UrlInputSection
            value={value}
            onChange={onChange}
            disabled={disabled}
            isUploading={isUploading}
            onInsert={onInsert}
            showInsert={!!onInsert}
          />

          <p className="text-muted-foreground/60 text-[10px]">Paste a URL or upload an image (max 4MB)</p>
        </>
      ) : (
        <div className="space-y-3">
          <div className="group bg-muted/30 relative overflow-hidden rounded-lg border transition-all duration-300">
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={value}
                alt="Preview"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange('')}
                disabled={isUploading}
                className="gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>

          {onInsert && (
            <Button
              type="button"
              onClick={onInsert}
              disabled={disabled || isUploading}
              className="w-full"
            >
              Insert Image
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

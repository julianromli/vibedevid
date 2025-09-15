'use client'

import type React from 'react'

import { useState } from 'react'
import { Sparkles, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AvatarUploader } from '@/components/ui/avatar-uploader'
import { createClient } from '@/lib/supabase/client'
import { scheduleOldAvatarDeletion, isOurStorageUrl } from '@/lib/avatar-utils'

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: {
    name: string
    username: string
    avatar: string
    bio: string
    location?: string
    website?: string
    github_url?: string
    twitter_url?: string
  }
  onSave: (data: any) => Promise<void>
  saving?: boolean
}

export default function ProfileEditDialog({
  open,
  onOpenChange,
  defaultValues,
  onSave,
  saving = false,
}: ProfileEditDialogProps) {
  const [formData, setFormData] = useState({
    name: defaultValues?.name || '',
    username: defaultValues?.username || '',
    avatar: defaultValues?.avatar || '',
    bio: defaultValues?.bio || '',
    location: defaultValues?.location || '',
    website: defaultValues?.website || '',
    github_url: defaultValues?.github_url || '',
    twitter_url: defaultValues?.twitter_url || '',
  })

  const [loadingAvatar, setLoadingAvatar] = useState(false)
  const [loadingBio, setLoadingBio] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarUpload = async (
    file: File,
  ): Promise<{ success: boolean }> => {
    console.log('[v0] Starting avatar upload for file:', file.name)
    setUploadingAvatar(true)

    // 🔥 Track avatar lama untuk auto-delete
    const oldAvatarUrl = formData.avatar || defaultValues?.avatar || ''

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error('User not authenticated')
        return { success: false }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${user.id}-${Date.now()}.${fileExt}`
      console.log('[v0] Uploading to path:', fileName)

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('[v0] Error uploading avatar:', error.message)
        return { success: false }
      }

      console.log('[v0] Upload successful, getting public URL...')
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      console.log('[v0] Public URL generated:', publicUrl)
      setFormData((prev) => {
        const newData = { ...prev, avatar: publicUrl }
        console.log('[v0] Updated formData with avatar:', newData.avatar)
        return newData
      })

      // 🔥 Schedule deletion avatar lama setelah upload berhasil
      if (oldAvatarUrl && isOurStorageUrl(oldAvatarUrl)) {
        console.log('[v0] Scheduling deletion of old avatar:', oldAvatarUrl)
        scheduleOldAvatarDeletion(oldAvatarUrl, 10000) // 10 detik delay
      } else if (oldAvatarUrl) {
        console.log(
          '[v0] Skipping deletion - not our storage URL:',
          oldAvatarUrl,
        )
      }

      return { success: true }
    } catch (error) {
      console.error('[v0] Error uploading avatar:', error)
      return { success: false }
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleGenerateAvatar = () => {
    setLoadingAvatar(true)
    setTimeout(() => {
      const newAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${Math.random().toString(36).substring(7)}`
      setFormData((prev) => ({ ...prev, avatar: newAvatar }))
      setLoadingAvatar(false)
    }, 1200)
  }

  const handleGenerateBio = () => {
    setLoadingBio(true)
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        bio: 'Creative developer blending design and technology to craft seamless experiences.',
      }))
      setLoadingBio(false)
    }, 1500)
  }

  const handleSave = async () => {
    console.log('[v0] Saving profile with avatar:', formData.avatar)
    console.log('[v0] Full formData:', formData)

    const saveData = {
      displayName: formData.name,
      username: formData.username,
      bio: formData.bio,
      location: formData.location,
      website: formData.website,
      github_url: formData.github_url,
      twitter_url: formData.twitter_url,
      avatar_url: formData.avatar, // Ensure avatar is included
    }

    console.log('[v0] Data being sent to onSave:', saveData)
    await onSave(saveData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <AvatarUploader onUpload={handleAvatarUpload}>
              <Avatar className="h-20 w-20 cursor-pointer rounded-xl border border-zinc-300 shadow transition-opacity hover:opacity-80 dark:border-zinc-700">
                <AvatarImage
                  src={formData.avatar || '/placeholder.svg'}
                  className="object-cover"
                />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
                  {formData.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </AvatarUploader>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <AvatarUploader onUpload={handleAvatarUpload}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>Upload</span>
                  </Button>
                </AvatarUploader>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAvatar}
                  disabled={loadingAvatar}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {loadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>AI Generate</span>
                </Button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click avatar or upload button • Generate with AI
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label
                htmlFor="name"
                className="text-sm text-zinc-700 dark:text-zinc-300"
              >
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label
                htmlFor="username"
                className="text-sm text-zinc-700 dark:text-zinc-300"
              >
                Username
              </Label>
              <Input
                id="username"
                placeholder="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
            <div>
              <Label
                htmlFor="location"
                className="text-sm text-zinc-700 dark:text-zinc-300"
              >
                Location
              </Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="bio"
                className="text-sm text-zinc-700 dark:text-zinc-300"
              >
                Bio
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateBio}
                disabled={loadingBio}
                className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400"
              >
                {loadingBio ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI Generate
              </Button>
            </div>
            <Textarea
              id="bio"
              placeholder="A short description about you..."
              rows={3}
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-4">
            <Label className="text-sm text-zinc-700 dark:text-zinc-300">
              Social Links
            </Label>
            <div className="grid gap-3">
              <Input
                placeholder="Website (https://)"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
                }
              />
              <Input
                placeholder="GitHub URL"
                value={formData.github_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    github_url: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Twitter URL"
                value={formData.twitter_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    twitter_url: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

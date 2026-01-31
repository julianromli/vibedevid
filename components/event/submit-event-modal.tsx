'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { CoverImageUploader } from '@/components/event/cover-image-uploader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useEventForm } from '@/hooks/useEventForm'
import { submitEvent } from '@/lib/actions/events'
import type { EventFormData } from '@/types/events'

interface SubmitEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function SubmitEventModal({ open, onOpenChange, userId }: SubmitEventModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { formData, errors, setField, validateForm, resetForm } = useEventForm({
    userId,
  })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitEvent(formData as EventFormData)

      if (result.success) {
        toast.success('Event berhasil disubmit! 🎉 Menunggu persetujuan admin.')
        onOpenChange(false)
        resetForm()
        router.push('/event/list')
      } else {
        toast.error(result.error || 'Gagal submit event. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Submit event error:', error)
      toast.error('Terjadi kesalahan saat submit event. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = isSubmitting

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Event AI</DialogTitle>
          <DialogDescription>
            Kirimkan event AI kamu untuk ditampilkan di platform. Event akan direview oleh admin sebelum dipublikasikan.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="space-y-6"
        >
          {/* Event Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="form-label-enhanced"
            >
              Nama Event *
            </Label>
            <Input
              id="name"
              placeholder="Contoh: AI Workshop Jakarta 2024"
              value={formData.name || ''}
              onChange={(e) => setField('name', e.target.value)}
              disabled={isLoading}
              className="form-input-enhanced"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="date"
                className="form-label-enhanced"
              >
                Tanggal *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => setField('date', e.target.value)}
                disabled={isLoading}
                className="form-input-enhanced"
              />
              {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="time"
                className="form-label-enhanced"
              >
                Waktu *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time || ''}
                onChange={(e) => setField('time', e.target.value)}
                disabled={isLoading}
                className="form-input-enhanced"
              />
              {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
            </div>
          </div>

          {/* Location Type */}
          <div className="space-y-2">
            <Label
              htmlFor="locationType"
              className="form-label-enhanced"
            >
              Tipe Lokasi *
            </Label>
            <Select
              value={formData.locationType || ''}
              onValueChange={(value) => setField('locationType', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            {errors.locationType && <p className="text-red-500 text-sm">{errors.locationType}</p>}
          </div>

          {/* Location Detail */}
          <div className="space-y-2">
            <Label
              htmlFor="locationDetail"
              className="form-label-enhanced"
            >
              Detail Lokasi *
            </Label>
            <Input
              id="locationDetail"
              placeholder="Contoh: Zoom Meeting atau Jakarta Convention Center"
              value={formData.locationDetail || ''}
              onChange={(e) => setField('locationDetail', e.target.value)}
              disabled={isLoading}
              className="form-input-enhanced"
            />
            {errors.locationDetail && <p className="text-red-500 text-sm">{errors.locationDetail}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="form-label-enhanced"
            >
              Kategori *
            </Label>
            <Select
              value={formData.category || ''}
              onValueChange={(value) => setField('category', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="hackathon">Hackathon</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
          </div>

          {/* Organizer */}
          <div className="space-y-2">
            <Label
              htmlFor="organizer"
              className="form-label-enhanced"
            >
              Penyelenggara *
            </Label>
            <Input
              id="organizer"
              placeholder="Contoh: AI Indonesia Community"
              value={formData.organizer || ''}
              onChange={(e) => setField('organizer', e.target.value)}
              disabled={isLoading}
              className="form-input-enhanced"
            />
            {errors.organizer && <p className="text-red-500 text-sm">{errors.organizer}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="form-label-enhanced"
            >
              Deskripsi *
            </Label>
            <Textarea
              id="description"
              placeholder="Jelaskan tentang event ini, topik yang akan dibahas, dan apa yang akan dipelajari peserta"
              value={formData.description || ''}
              onChange={(e) => setField('description', e.target.value)}
              disabled={isLoading}
              className="form-input-enhanced"
              rows={4}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          {/* Registration URL */}
          <div className="space-y-2">
            <Label
              htmlFor="registrationUrl"
              className="form-label-enhanced"
            >
              URL Registrasi *
            </Label>
            <Input
              id="registrationUrl"
              type="url"
              placeholder="https://example.com/register"
              value={formData.registrationUrl || ''}
              onChange={(e) => setField('registrationUrl', e.target.value)}
              disabled={isLoading}
              className="form-input-enhanced"
            />
            {errors.registrationUrl && <p className="text-red-500 text-sm">{errors.registrationUrl}</p>}
          </div>

          {/* Cover Image */}
          <CoverImageUploader
            value={formData.coverImage || ''}
            onChange={(url) => setField('coverImage', url)}
            onError={(error) => {
              if (error) {
                toast.error(error)
              }
            }}
            disabled={isLoading}
          />
          {errors.coverImage && <p className="text-red-500 text-sm">{errors.coverImage}</p>}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

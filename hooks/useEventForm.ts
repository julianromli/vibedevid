import { useState } from 'react'
import { generateEventSlug, validateEventForm } from '@/lib/event-form-utils'
import type { EventFormData } from '@/types/events'

export interface UseEventFormReturn {
  formData: Partial<EventFormData>
  errors: Record<string, string>
  isValid: boolean
  isLoading: boolean
  setField: (field: keyof EventFormData, value: any) => void
  validateForm: () => boolean
  resetForm: () => void
  handleSubmit: () => Promise<SubmitResult>
}

export interface SubmitResult {
  success: boolean
  error?: string
}

interface UseEventFormProps {
  userId: string
  onSuccess?: () => void
}

export function useEventForm({ userId, onSuccess }: UseEventFormProps): UseEventFormReturn {
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    status: 'upcoming',
    approved: false,
    submitted_by: userId,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const setField = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-generate slug when name changes
      if (field === 'name' && typeof value === 'string') {
        updated.slug = generateEventSlug(value)
      }

      // Ensure status is always 'upcoming'
      updated.status = 'upcoming'

      // Ensure approved is always false
      updated.approved = false

      // Ensure submitted_by is always set
      updated.submitted_by = userId

      return updated
    })

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const validateForm = (): boolean => {
    const validation = validateEventForm(formData)
    setErrors(validation.errors)
    return validation.isValid
  }

  const resetForm = () => {
    setFormData({
      status: 'upcoming',
      approved: false,
      submitted_by: userId,
    })
    setErrors({})
    setIsLoading(false)
  }

  const handleSubmit = async (): Promise<SubmitResult> => {
    // Validate form
    if (!validateForm()) {
      return {
        success: false,
        error: 'Please fix all validation errors',
      }
    }

    setIsLoading(true)

    try {
      // Phase 1: Mock submission (console.log)
      console.log('[useEventForm] Submitting event:', formData)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Phase 1: Always succeed
      setIsLoading(false)
      onSuccess?.()

      return {
        success: true,
      }
    } catch (error) {
      setIsLoading(false)
      console.error('[useEventForm] Submission error:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit event',
      }
    }
  }

  const validation = validateEventForm(formData)

  return {
    formData,
    errors,
    isValid: validation.isValid,
    isLoading,
    setField,
    validateForm,
    resetForm,
    handleSubmit,
  }
}

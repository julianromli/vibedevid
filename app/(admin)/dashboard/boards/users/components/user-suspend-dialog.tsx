'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type AdminUser, suspendUser } from '@/lib/actions/admin/users'

interface UserSuspendDialogProps {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSuspendDialog({ user, open, onOpenChange }: UserSuspendDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const result = await suspendUser(user.id, !user.is_suspended, reason)
      
      if (result.success) {
        toast.success(
          user.is_suspended ? 'User unsuspended successfully' : 'User suspended successfully'
        )
        onOpenChange(false)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update suspension status')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
          </DialogTitle>
          <DialogDescription>
            {user.is_suspended 
              ? `Restore ${user.display_name}'s account access.`
              : `Suspend ${user.display_name}'s account and prevent them from accessing the platform.`}
          </DialogDescription>
        </DialogHeader>

        {!user.is_suspended && (
          <div className="py-4 space-y-2">
            <Label htmlFor="reason">Reason for suspension (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for suspension..."
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            variant={user.is_suspended ? 'default' : 'destructive'}
          >
            {isLoading 
              ? 'Processing...' 
              : user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

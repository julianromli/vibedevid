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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { type AdminUser, updateUserRole } from '@/lib/actions/admin/users'

interface UserRoleDialogProps {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserRoleDialog({ user, open, onOpenChange }: UserRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(String(user.role))

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const result = await updateUserRole(user.id, parseInt(selectedRole))

      if (result.success) {
        toast.success('User role updated successfully')
        onOpenChange(false)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update role')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user.display_name} (@{user.username})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedRole}
            onValueChange={setSelectedRole}
          >
            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <RadioGroupItem
                value="0"
                id="admin"
              />
              <div className="flex-1">
                <Label
                  htmlFor="admin"
                  className="font-medium"
                >
                  Admin
                </Label>
                <p className="text-sm text-muted-foreground">Full access to all admin features</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <RadioGroupItem
                value="1"
                id="moderator"
              />
              <div className="flex-1">
                <Label
                  htmlFor="moderator"
                  className="font-medium"
                >
                  Moderator
                </Label>
                <p className="text-sm text-muted-foreground">Can moderate content and manage users</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <RadioGroupItem
                value="2"
                id="user"
              />
              <div className="flex-1">
                <Label
                  htmlFor="user"
                  className="font-medium"
                >
                  User
                </Label>
                <p className="text-sm text-muted-foreground">Standard user with limited permissions</p>
              </div>
            </div>
          </RadioGroup>
        </div>

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
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

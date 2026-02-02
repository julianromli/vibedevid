'use client'

import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createTag, deleteTag, type Tag } from '@/lib/actions/admin/posts'

interface TagsManagerProps {
  tags: Tag[]
}

export function TagsManager({ tags: initialTags }: TagsManagerProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [newTagName, setNewTagName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsLoading(true)
    try {
      const result = await createTag(newTagName.trim())
      if (result.success && result.tag) {
        setTags([...tags, result.tag])
        setNewTagName('')
        toast.success('Tag created successfully')
      } else {
        toast.error(result.error || 'Failed to create tag')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    setIsLoading(true)
    try {
      const result = await deleteTag(tagId)
      if (result.success) {
        setTags(tags.filter((tag) => tag.id !== tagId))
        toast.success('Tag deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete tag')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New tag name..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
          className="max-w-sm"
        />
        <Button
          onClick={handleCreateTag}
          disabled={isLoading || !newTagName.trim()}
        >
          <IconPlus className="h-4 w-4 mr-1" />
          Add Tag
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No tags found
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge variant="secondary">{tag.name}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{tag.slug}</TableCell>
                  <TableCell>{new Date(tag.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

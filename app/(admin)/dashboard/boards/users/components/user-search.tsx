'use client'

import { IconFilter, IconSearch } from '@tabler/icons-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function UserSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [role, setRole] = useState(searchParams.get('role') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (search) params.set('search', search)
    else params.delete('search')

    if (role !== 'all') params.set('role', role)
    else params.delete('role')

    if (status !== 'all') params.set('status', status)
    else params.delete('status')

    params.delete('page')

    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setRole('all')
    setStatus('all')
    router.push('?')
  }

  const hasFilters = search || role !== 'all' || status !== 'all'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={role}
          onValueChange={setRole}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={setStatus}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          size="sm"
          onClick={applyFilters}
        >
          <IconFilter className="h-4 w-4 mr-1" />
          Filter
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

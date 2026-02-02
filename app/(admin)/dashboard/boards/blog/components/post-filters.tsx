'use client'

import { IconFilter, IconSearch } from '@tabler/icons-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function PostFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (search) params.set('search', search)
    else params.delete('search')

    if (status !== 'all') params.set('status', status)
    else params.delete('status')

    params.delete('page')

    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    router.push('?')
  }

  const hasFilters = search || status !== 'all'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={status}
          onValueChange={setStatus}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
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

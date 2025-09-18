'use client'

import { useMemo } from 'react'
import { Folder, FolderOpen, ListFilter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface TableRow {
  id: string
  cells: Record<string, string>
}

export function FolderBlockContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const [rootPath] = useResolvedSubBlockValue<string>(blockId, 'rootPath', {
    isPreview,
    previewValues,
  })
  const [includeSubdirectories] = useResolvedSubBlockValue<boolean>(
    blockId,
    'includeSubdirectories',
    {
      isPreview,
      previewValues,
    }
  )
  const [filters] = useResolvedSubBlockValue<TableRow[] | null>(blockId, 'filters', {
    isPreview,
    previewValues,
  })
  const [selectedItems] = useResolvedSubBlockValue<TableRow[] | null>(blockId, 'selectedItems', {
    isPreview,
    previewValues,
  })

  const filterChips = useMemo(() => {
    if (!filters || filters.length === 0) return []
    return filters
      .map((row) => row?.cells?.Pattern)
      .filter((value): value is string => Boolean(value?.trim()))
  }, [filters])

  const entries = useMemo(() => {
    if (!selectedItems || selectedItems.length === 0) return []
    return selectedItems
      .map((row) => ({
        name: row?.cells?.Name,
        type: row?.cells?.Type,
        path: row?.cells?.Path,
      }))
      .filter((entry) => Boolean(entry.name || entry.path))
  }, [selectedItems])

  if (!rootPath && entries.length === 0) {
    return (
      <div className='rounded-lg border border-border/70 border-dashed bg-muted/40 p-4 text-muted-foreground text-sm'>
        Configure a root path to browse directory contents and select files.
      </div>
    )
  }

  return (
    <div className='space-y-3 rounded-lg border border-border/70 bg-card/50 p-4'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='font-medium text-sm'>{rootPath || 'Root folder'}</p>
          <p className='text-muted-foreground text-xs'>Folder browser</p>
        </div>
        {includeSubdirectories && <Badge variant='outline'>Recursive</Badge>}
      </div>

      {filterChips.length > 0 && (
        <div className='flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs'>
          <div className='flex items-center gap-1 text-muted-foreground'>
            <ListFilter className='h-3.5 w-3.5' />
            Filters
          </div>
          {filterChips.map((filter) => (
            <Badge key={filter} variant='secondary' className='bg-secondary/40'>
              {filter}
            </Badge>
          ))}
        </div>
      )}

      <div className='rounded-md border border-border/60 bg-background/40'>
        <div className='flex items-center justify-between border-border/60 border-b px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
          <span>Selected items</span>
          <span>{entries.length}</span>
        </div>
        {entries.length === 0 ? (
          <div className='flex items-center gap-2 px-3 py-4 text-muted-foreground text-sm'>
            <FolderOpen className='h-4 w-4' />
            <span>No items selected yet.</span>
          </div>
        ) : (
          <ScrollArea className='max-h-48'>
            <div className='divide-y divide-border/60'>
              {entries.map((entry, index) => (
                <div
                  key={`${entry.path}-${index}`}
                  className='flex items-center gap-3 px-3 py-2 text-sm'
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary'
                    )}
                  >
                    {entry.type === 'folder' ? (
                      <Folder className='h-4 w-4' />
                    ) : (
                      <FolderOpen className='h-4 w-4' />
                    )}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{entry.name || entry.path}</p>
                    <p className='truncate text-muted-foreground text-xs'>{entry.path}</p>
                  </div>
                  {entry.type && (
                    <Badge variant='outline' className='capitalize'>
                      {entry.type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

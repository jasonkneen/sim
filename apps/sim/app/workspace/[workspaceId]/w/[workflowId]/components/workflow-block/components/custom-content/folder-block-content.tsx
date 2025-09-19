'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Folder, FolderOpen, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface TableRow {
  id: string
  cells: Record<string, string>
}

interface DirectoryEntry {
  name: string
  type: 'file' | 'folder'
  path: string
}

function normalisePath(parts: Array<string | null | undefined>) {
  const cleaned = parts
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.replace(/\\+/g, '/').replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter(Boolean)

  if (cleaned.length === 0) return ''
  const leadingSlash = parts?.[0]?.startsWith('/') ? '/' : ''
  return `${leadingSlash}${cleaned.join('/')}`
}

function toTableRow(entry: DirectoryEntry): TableRow {
  return {
    id: entry.path,
    cells: {
      Name: entry.name,
      Type: entry.type,
      Path: entry.path,
    },
  }
}

export function FolderBlockContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const [folderPath, setFolderPath] = useResolvedSubBlockValue<string>(blockId, 'rootPath', {
    isPreview,
    previewValues,
  })
  const [includeHidden] = useResolvedSubBlockValue<boolean>(blockId, 'includeHidden', {
    isPreview,
    previewValues,
  })
  const [selectedRows, setSelectedRows] = useResolvedSubBlockValue<TableRow[] | null>(
    blockId,
    'selectedItems',
    {
      isPreview,
      previewValues,
    }
  )

  const [entries, setEntries] = useState<DirectoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null)

  const hasFileSystemAccess = useMemo(
    () => typeof window !== 'undefined' && 'showDirectoryPicker' in window,
    []
  )

  const selectedPathSet = useMemo(() => {
    const rows = selectedRows ?? []
    return new Set(rows.map((row) => row?.cells?.Path).filter(Boolean) as string[])
  }, [selectedRows])

  const ensurePermission = useCallback(async (handle: FileSystemDirectoryHandle) => {
    if (!handle) return false
    try {
      const current = await handle.queryPermission({ mode: 'read' })
      if (current === 'granted') return true
      if (current === 'denied') return false
      const result = await handle.requestPermission({ mode: 'read' })
      return result === 'granted'
    } catch (error_) {
      console.error('Failed to request directory permission', error_)
      return false
    }
  }, [])

  const loadDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setEntries([])
        return
      }

      const granted = await ensurePermission(handle)
      if (!granted) {
        setError('Access to the selected folder was denied. Grant permission and try again.')
        setEntries([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const nextEntries: DirectoryEntry[] = []
        for await (const [name, entryHandle] of handle.entries()) {
          const isHidden = name.startsWith('.')
          if (!includeHidden && isHidden) continue

          const type = entryHandle.kind === 'directory' ? 'folder' : 'file'
          const fullPath = normalisePath([folderPath, name]) || name

          nextEntries.push({
            name,
            type,
            path: fullPath,
          })
        }

        nextEntries.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })

        setEntries(nextEntries)
      } catch (error_) {
        console.error('Failed to read directory contents', error_)
        setError(
          'Unable to read folder contents. Your browser may not support the File System Access API.'
        )
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    },
    [ensurePermission, includeHidden, folderPath]
  )

  const handleChooseFolder = useCallback(async () => {
    if (!hasFileSystemAccess) {
      setError('File System Access API is not supported in this browser. Try using Chrome or Edge.')
      return
    }

    try {
      setError(null)
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents', // Start in documents folder for better UX
      })
      if (!directoryHandle) return

      // Request permission explicitly
      const permission = await directoryHandle.requestPermission({ mode: 'read' })
      if (permission !== 'granted') {
        setError('Permission denied. Please grant folder access to continue.')
        return
      }

      directoryHandleRef.current = directoryHandle

      // Update the folder path with the selected directory name
      setFolderPath(directoryHandle.name)

      await loadDirectory(directoryHandle)
    } catch (error_) {
      if ((error_ as DOMException)?.name === 'AbortError') return
      console.error('Failed to open directory picker', error_)
      setError(
        'Unable to open the directory picker. Please ensure you grant the necessary permissions.'
      )
    }
  }, [hasFileSystemAccess, loadDirectory, setFolderPath])

  const toggleSelection = useCallback(
    (entry: DirectoryEntry, checked: boolean) => {
      const rows = selectedRows ?? []
      const exists = rows.find((row) => row.cells?.Path === entry.path)

      let nextRows: TableRow[]
      if (checked) {
        if (exists) return
        nextRows = [...rows, toTableRow(entry)]
      } else {
        nextRows = rows.filter((row) => row.cells?.Path !== entry.path)
      }

      setSelectedRows(nextRows.length > 0 ? nextRows : [])
    },
    [selectedRows, setSelectedRows]
  )

  useEffect(() => {
    if (!directoryHandleRef.current) return
    void loadDirectory(directoryHandleRef.current)
  }, [includeHidden, loadDirectory])

  useEffect(() => {
    if (!folderPath) {
      setEntries([])
      if ((selectedRows?.length ?? 0) > 0) {
        setSelectedRows([])
      }
    }
    // We only want to react when folderPath transitions to empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderPath])

  if (isPreview) {
    return (
      <div className='rounded-lg border border-border/60 border-dashed bg-muted/40 p-4 text-muted-foreground text-sm'>
        Folder results appear here once the block runs with a configured path.
      </div>
    )
  }

  const selectionCount = selectedPathSet.size

  return (
    <div className='space-y-4 rounded-lg border border-border/70 bg-card/50 p-4'>
      <div className='space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='truncate font-semibold text-sm'>{folderPath || 'No folder configured'}</p>
            <p className='text-muted-foreground text-xs'>
              Set the folder path above or pick a folder for this session.
            </p>
            {!hasFileSystemAccess && (
              <p className='mt-1 text-muted-foreground text-xs'>
                Your browser does not support the File System Access API. Configure a path manually
                in the block settings instead.
              </p>
            )}
          </div>
          {hasFileSystemAccess && (
            <Button type='button' variant='outline' size='sm' onClick={handleChooseFolder}>
              Choose folder
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className='flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs'>
          <AlertCircle className='h-4 w-4' />
          <span>{error}</span>
        </div>
      )}

      <div className='rounded-md border border-border/60 bg-background/60'>
        <div className='flex items-center justify-between border-border/60 border-b px-3 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide'>
          <span>{isLoading ? 'Loading…' : `${entries.length} items`}</span>
          <span>{selectionCount} selected</span>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center gap-2 px-3 py-8 text-muted-foreground text-sm'>
            <Loader2 className='h-4 w-4 animate-spin' />
            Loading contents
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-2 px-3 py-6 text-muted-foreground text-sm'>
            <FolderOpen className='h-5 w-5' />
            <span>
              {folderPath
                ? 'No entries in this folder yet.'
                : hasFileSystemAccess
                  ? 'Choose a folder to browse.'
                  : 'Configure a folder path in block settings.'}
            </span>
          </div>
        ) : (
          <ScrollArea className='max-h-60'>
            <div className='divide-y divide-border/60'>
              {entries.map((entry, index) => {
                const checked = selectedPathSet.has(entry.path)
                const checkboxId = `${blockId}-entry-${index}`
                const handleRowToggle = () => toggleSelection(entry, !checked)
                return (
                  <div
                    key={entry.path}
                    role='button'
                    tabIndex={0}
                    onClick={handleRowToggle}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleRowToggle()
                      }
                    }}
                    className='flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/40'
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(value) => toggleSelection(entry, value === true)}
                      onClick={(event) => event.stopPropagation()}
                      className='mt-0.5'
                    />
                    <Label htmlFor={checkboxId} className='sr-only'>
                      Select {entry.name}
                    </Label>
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
                      <p className='truncate font-medium'>{entry.name}</p>
                      <p className='truncate text-muted-foreground text-xs'>{entry.path}</p>
                    </div>
                    <Badge variant='outline' className='capitalize'>
                      {entry.type}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

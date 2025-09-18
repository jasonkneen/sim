'use client'

import { useMemo } from 'react'
import { CloudUpload, ExternalLink, FileIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface UploadedFile {
  id?: string
  name: string
  path: string
  size: number
  type: string
}

function formatBytes(bytes: number | undefined | null) {
  if (!bytes || Number.isNaN(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function FileBlockContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const [inputMethod] = useResolvedSubBlockValue<string>(blockId, 'inputMethod', {
    isPreview,
    previewValues,
  })
  const [filePath] = useResolvedSubBlockValue<string>(blockId, 'filePath', {
    isPreview,
    previewValues,
  })
  const [files] = useResolvedSubBlockValue<UploadedFile | UploadedFile[] | null>(blockId, 'file', {
    isPreview,
    previewValues,
  })

  const filesArray = useMemo(() => {
    if (!files) return []
    return Array.isArray(files) ? files : [files]
  }, [files])

  if (!filePath && filesArray.length === 0) {
    return (
      <div className='rounded-lg border border-border/70 border-dashed bg-muted/40 p-4 text-muted-foreground text-sm'>
        Upload a file or provide a public URL to preview the resolved inputs here.
      </div>
    )
  }

  return (
    <div className='space-y-3 rounded-lg border border-border/70 bg-card/50 p-4'>
      <div className='flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide'>
        <CloudUpload className='h-3.5 w-3.5' />
        <span>Configured File Inputs</span>
        {inputMethod && <Badge variant='outline'>{inputMethod}</Badge>}
      </div>

      {filePath && (
        <div className='space-y-2 rounded-md border border-border/60 bg-background/60 p-3 text-sm'>
          <p className='font-medium text-muted-foreground text-xs uppercase tracking-wide'>
            Remote file URL
          </p>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <code className='rounded bg-muted px-2 py-1 text-xs'>{filePath}</code>
            <Button size='sm' variant='outline' asChild>
              <a href={filePath} target='_blank' rel='noreferrer'>
                <ExternalLink className='mr-1 h-3.5 w-3.5' />
                Open
              </a>
            </Button>
          </div>
        </div>
      )}

      {filePath && filesArray.length > 0 && <Separator />}

      {filesArray.length > 0 && (
        <div className='space-y-2'>
          <p className='font-medium text-muted-foreground text-xs uppercase tracking-wide'>
            Uploaded files
          </p>
          <div className='space-y-1'>
            {filesArray.map((file) => (
              <div
                key={file.path ?? file.name}
                className={cn(
                  'flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm shadow-sm'
                )}
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <FileIcon className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{file.name}</p>
                    <p className='truncate text-muted-foreground text-xs'>{file.path}</p>
                  </div>
                </div>
                <span className='text-muted-foreground text-xs'>{formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

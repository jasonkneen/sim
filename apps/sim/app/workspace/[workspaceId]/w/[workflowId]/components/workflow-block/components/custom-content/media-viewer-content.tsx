'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, ExternalLink, ImageIcon, Loader2, PlayCircle, VideoIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'url'

function extractDisplayName(source?: string | null) {
  if (!source) return 'Unknown source'
  try {
    const url = new URL(source)
    const pathname = url.pathname.split('/').filter(Boolean)
    if (pathname.length === 0) return url.hostname
    return decodeURIComponent(pathname[pathname.length - 1])
  } catch (
    _error // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    return source.split('/').pop() ?? source
  }
}

export function MediaViewerContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const [sourceType] = useResolvedSubBlockValue<MediaKind>(blockId, 'sourceType', {
    isPreview,
    previewValues,
  })
  const [source] = useResolvedSubBlockValue<string>(blockId, 'source', {
    isPreview,
    previewValues,
  })
  const [caption] = useResolvedSubBlockValue<string>(blockId, 'caption', {
    isPreview,
    previewValues,
  })
  const [autoPlay] = useResolvedSubBlockValue<boolean>(blockId, 'autoPlay', {
    isPreview,
    previewValues,
  })
  const [loop] = useResolvedSubBlockValue<boolean>(blockId, 'loop', {
    isPreview,
    previewValues,
  })
  const [showMetadata] = useResolvedSubBlockValue<boolean>(blockId, 'showMetadata', {
    isPreview,
    previewValues,
  })

  const [isMediaReady, setIsMediaReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  const displayName = useMemo(() => extractDisplayName(source ?? undefined), [source])

  if (!source) {
    return (
      <div className='rounded-lg border border-border/70 border-dashed bg-muted/40 p-4 text-muted-foreground text-sm'>
        Provide a media URL or connect an upstream block to preview content here.
      </div>
    )
  }

  const commonMediaProps = {
    onLoadedData: () => setIsMediaReady(true),
    onLoadedMetadata: () => setIsMediaReady(true),
    onError: () => setHasError(true),
  }

  return (
    <div className='space-y-3 rounded-lg border border-border/70 bg-card/50 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='font-medium text-sm'>{displayName}</p>
          <p className='text-muted-foreground text-xs'>{sourceType ?? 'media'}</p>
        </div>
        <div className='flex items-center gap-2'>
          {sourceType === 'audio' && autoPlay && <Badge variant='outline'>Auto-play</Badge>}
          {loop && <Badge variant='outline'>Loop</Badge>}
          <Button type='button' size='sm' variant='ghost' className='h-7 px-2 text-xs' asChild>
            <a href={source} target='_blank' rel='noreferrer'>
              <ExternalLink className='mr-1 h-3 w-3' />
              Open
            </a>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-md border border-border/60 bg-background/60',
          sourceType === 'audio' && 'p-3'
        )}
      >
        {hasError ? (
          <div className='flex items-center gap-2 p-4 text-destructive'>
            <AlertCircle className='h-4 w-4' />
            <span className='text-sm'>
              Failed to load media. Check that the source is publicly accessible.
            </span>
          </div>
        ) : (
          <>
            {!isMediaReady && sourceType !== 'audio' && (
              <div className='absolute inset-0 flex items-center justify-center bg-background/60'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            )}
            {sourceType === 'image' && (
              <img
                src={source}
                alt={caption ?? displayName}
                className='h-full max-h-[320px] w-full object-contain'
                loading='lazy'
                onLoad={() => setIsMediaReady(true)}
                onError={() => setHasError(true)}
              />
            )}
            {sourceType === 'video' && (
              <video
                controls
                className='h-full max-h-[360px] w-full'
                poster=''
                {...commonMediaProps}
                autoPlay={autoPlay ?? false}
                loop={loop ?? false}
              >
                <source src={source} />
                Your browser does not support the video tag.
              </video>
            )}
            {sourceType === 'audio' && (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <PlayCircle className='h-4 w-4 text-muted-foreground' />
                  <span>{caption || displayName}</span>
                </div>
                <audio
                  controls
                  className='w-full'
                  {...commonMediaProps}
                  autoPlay={autoPlay ?? false}
                  loop={loop ?? false}
                >
                  <source src={source} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            {sourceType === 'pdf' && (
              <iframe
                src={source}
                title={caption ?? displayName}
                className='h-[320px] w-full bg-white'
              />
            )}
            {sourceType === 'url' && (
              <div className='flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground text-sm'>
                <VideoIcon className='h-6 w-6 text-muted-foreground/70' />
                <p>This block will render the contents of the provided URL when executed.</p>
                <Button size='sm' variant='outline' asChild>
                  <a href={source} target='_blank' rel='noreferrer'>
                    Visit URL
                  </a>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {(caption || showMetadata) && (
        <div className='space-y-2 text-muted-foreground text-xs'>
          {caption && <p className='leading-relaxed'>{caption}</p>}
          {showMetadata && (
            <div className='flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide'>
              <Badge variant='secondary' className='bg-secondary/40'>
                <ImageIcon className='mr-1 h-3 w-3' />
                {sourceType ?? 'media'}
              </Badge>
              {loop && <Badge variant='secondary'>Loop enabled</Badge>}
              {autoPlay && <Badge variant='secondary'>Auto-play</Badge>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

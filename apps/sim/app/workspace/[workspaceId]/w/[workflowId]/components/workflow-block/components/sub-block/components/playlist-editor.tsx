import { useMemo } from 'react'
import { Music2, Volume2 } from 'lucide-react'
import { useSubBlockValue } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'

interface PlaylistTrackForm {
  id: string
  title: string
  url: string
  artist?: string
}

interface PlaylistEditorProps {
  blockId: string
  subBlockId: string
  isPreview?: boolean
  previewValue?: PlaylistTrackForm[] | null
  disabled?: boolean
}

export function PlaylistEditor({
  blockId,
  subBlockId,
  isPreview = false,
  previewValue,
  disabled = false,
}: PlaylistEditorProps) {
  const [storedPlaylist] = useSubBlockValue<PlaylistTrackForm[]>(blockId, subBlockId)
  const playlist = useMemo(() => {
    const source = isPreview ? (previewValue ?? []) : (storedPlaylist ?? [])
    return source.map((track) => ({
      ...track,
      id: track.id || crypto.randomUUID(),
    }))
  }, [isPreview, previewValue, storedPlaylist])

  const validTracks = playlist.filter((track) => track.url)

  if (playlist.length === 0) {
    return (
      <div className='flex items-center justify-center rounded-md border border-border/60 border-dashed bg-card/40 p-6'>
        <div className='text-center'>
          <Volume2 className='mx-auto mb-2 h-8 w-8 text-muted-foreground' />
          <p className='text-muted-foreground text-sm'>No tracks in playlist</p>
          <p className='mt-1 text-muted-foreground text-xs'>
            Use the audio player interface to add tracks
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='rounded-md border border-border/60 bg-card/40 p-3'>
      <div className='mb-3 flex items-center gap-2'>
        <Music2 className='h-4 w-4 text-muted-foreground' />
        <span className='font-medium text-sm'>
          {playlist.length} track{playlist.length !== 1 ? 's' : ''}
          {validTracks.length !== playlist.length && (
            <span className='text-muted-foreground'>({validTracks.length} with URLs)</span>
          )}
        </span>
      </div>

      <div className='max-h-32 space-y-1 overflow-y-auto'>
        {playlist.map((track, index) => (
          <div key={track.id} className='flex items-center gap-2 rounded bg-background/60 p-2'>
            <span className='w-6 text-muted-foreground text-xs'>{index + 1}</span>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium text-sm'>{track.title || `Track ${index + 1}`}</p>
              {track.artist && (
                <p className='truncate text-muted-foreground text-xs'>{track.artist}</p>
              )}
            </div>
            {!track.url && (
              <span className='rounded bg-amber-50 px-1 text-amber-600 text-xs'>No URL</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

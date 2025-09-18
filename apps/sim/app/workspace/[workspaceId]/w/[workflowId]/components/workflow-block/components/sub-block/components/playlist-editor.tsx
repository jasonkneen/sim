import { useMemo } from 'react'
import { Plus, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
  const [storedPlaylist, setStoredPlaylist] = useSubBlockValue<PlaylistTrackForm[]>(blockId, subBlockId)
  const playlist = useMemo(() => {
    const source = isPreview ? previewValue ?? [] : storedPlaylist ?? []
    return source.map((track) => ({
      ...track,
      id: track.id || crypto.randomUUID(),
    }))
  }, [isPreview, previewValue, storedPlaylist])

  const handleTrackChange = (index: number, field: keyof PlaylistTrackForm, value: string) => {
    if (disabled || isPreview) return
    const next = [...playlist]
    next[index] = { ...next[index], [field]: value }
    setStoredPlaylist(next)
  }

  const handleAddTrack = () => {
    if (disabled || isPreview) return
    const next = [
      ...playlist,
      {
        id: crypto.randomUUID(),
        title: '',
        url: '',
        artist: '',
      },
    ]
    setStoredPlaylist(next)
  }

  const handleRemoveTrack = (index: number) => {
    if (disabled || isPreview) return
    const next = playlist.filter((_, i) => i !== index)
    setStoredPlaylist(next)
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2 rounded-md border border-border/60 bg-card/40 p-3'>
        {playlist.length === 0 && (
          <p className='text-muted-foreground text-sm'>No tracks added yet.</p>
        )}
        {playlist.map((track, index) => (
          <div
            key={track.id}
            className='grid grid-cols-[1fr_1fr_auto] items-start gap-2 rounded-lg bg-card/60 p-2'
          >
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>Title</label>
              <Input
                value={track.title}
                onChange={(event) => handleTrackChange(index, 'title', event.target.value)}
                placeholder='Song title'
                disabled={disabled || isPreview}
                className='h-8 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>URL</label>
              <Input
                value={track.url}
                onChange={(event) => handleTrackChange(index, 'url', event.target.value)}
                placeholder='https://…'
                disabled={disabled || isPreview}
                className='h-8 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>Artist</label>
              <div className='flex items-center gap-2'>
                <Input
                  value={track.artist ?? ''}
                  onChange={(event) => handleTrackChange(index, 'artist', event.target.value)}
                  placeholder='Optional'
                  disabled={disabled || isPreview}
                  className='h-8 text-sm'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => handleRemoveTrack(index)}
                  disabled={disabled || isPreview}
                  className={cn('h-8 w-8 text-muted-foreground hover:text-destructive',
                    (disabled || isPreview) && 'opacity-50')}
                >
                  <Trash className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={handleAddTrack}
        disabled={disabled || isPreview}
        className='flex items-center gap-2'
      >
        <Plus className='h-4 w-4' />
        Add Track
      </Button>
    </div>
  )
}

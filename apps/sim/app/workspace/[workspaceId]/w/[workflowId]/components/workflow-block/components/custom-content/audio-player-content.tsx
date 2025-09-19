'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Music2,
  Pause,
  Play,
  Radio,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

type PlaylistTrack = {
  id: string
  title: string
  url: string
  artist?: string
  coverImage?: string
  durationSeconds?: number
}

function clampIndex(index: number, length: number) {
  if (length === 0) return 0
  return ((index % length) + length) % length
}

export function AudioPlayerContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  // Get the isWide state from the workflow store to determine view mode
  const isWide = useWorkflowStore((state) => state.blocks[blockId]?.isWide ?? true)
  const [playlist, setPlaylist] = useResolvedSubBlockValue<PlaylistTrack[] | null>(
    blockId,
    'playlist',
    {
      isPreview,
      previewValues,
    }
  )
  const [rawIndex, setRawIndex] = useResolvedSubBlockValue<string | number | null>(
    blockId,
    'currentTrackIndex',
    {
      isPreview,
      previewValues,
    }
  )
  const [loop, setLoop] = useResolvedSubBlockValue<boolean>(blockId, 'loop', {
    isPreview,
    previewValues,
  })
  const [shuffle, setShuffle] = useResolvedSubBlockValue<boolean>(blockId, 'shuffle', {
    isPreview,
    previewValues,
  })
  const [radioMode, setRadioMode] = useResolvedSubBlockValue<boolean>(blockId, 'radioMode', {
    isPreview,
    previewValues,
  })
  const [autoPlay, setAutoPlay] = useResolvedSubBlockValue<boolean>(blockId, 'autoPlay', {
    isPreview,
    previewValues,
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(Boolean(autoPlay))
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null)

  const playlistArray = useMemo(
    () => (playlist && Array.isArray(playlist) ? playlist : []),
    [playlist]
  )
  const playlistRef = useRef<PlaylistTrack[]>(playlistArray)

  useEffect(() => {
    playlistRef.current = playlistArray
  }, [playlistArray])

  const tracks = useMemo(() => playlistArray.filter((track) => track?.url), [playlistArray])
  const parsedIndex = useMemo(() => {
    if (typeof rawIndex === 'number') return rawIndex
    if (typeof rawIndex === 'string' && rawIndex !== '') {
      const parsed = Number.parseInt(rawIndex, 10)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
    return 0
  }, [rawIndex])

  const activeIndex = clampIndex(parsedIndex, tracks.length)
  const activeTrack = tracks[activeIndex]

  const updatePlaylist = useCallback(
    (updater: (current: PlaylistTrack[]) => PlaylistTrack[] | null) => {
      if (isPreview) return
      const next = updater(playlistRef.current)
      if (!next) return
      playlistRef.current = next
      setPlaylist(next)
    },
    [isPreview, setPlaylist]
  )

  const ingestFiles = useCallback(
    async (files: FileList | File[]) => {
      if (isPreview) return
      const list = Array.from(files)
      if (list.length === 0) return

      const tracks: PlaylistTrack[] = []

      for (const file of list) {
        try {
          // Create object URL instead of data URL to avoid large payloads
          const objectUrl = URL.createObjectURL(file)

          tracks.push({
            id: crypto.randomUUID(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: objectUrl,
            artist: undefined,
            coverImage: undefined,
            durationSeconds: undefined,
          })
        } catch (error) {
          console.warn('Failed to process audio file:', file.name, error)
        }
      }

      if (tracks.length > 0) {
        updatePlaylist((current) => [...current, ...tracks])
      }
    },
    [isPreview, updatePlaylist]
  )

  useEffect(() => {
    if (!autoPlay) return
    if (!tracks.length) return
    setIsPlaying(true)
  }, [autoPlay, tracks.length])

  // Cleanup object URLs when component unmounts or tracks change
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when tracks change or component unmounts
      tracks.forEach((track) => {
        if (track.url.startsWith('blob:')) {
          URL.revokeObjectURL(track.url)
        }
      })
    }
  }, [tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying && activeTrack?.url) {
      audio
        .play()
        .then(() => setIsLoading(false))
        .catch(() => {
          setIsPlaying(false)
        })
    } else {
      audio.pause()
    }
  }, [isPlaying, activeTrack?.url])

  const changeTrack = (nextIndex: number, options?: { autoplay?: boolean }) => {
    const boundedIndex = clampIndex(nextIndex, tracks.length)
    if (boundedIndex === activeIndex) {
      // force reload
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
      }
      return
    }

    setIsLoading(true)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    if (!isPreview) {
      setRawIndex(String(boundedIndex))
    }
    setIsPlaying((prev) => {
      if (typeof options?.autoplay === 'boolean') {
        return options.autoplay
      }
      return prev
    })
  }

  const handleFileInputClick = () => {
    if (isPreview) return
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    void ingestFiles(event.target.files)
    // reset so same file can be selected again if needed
    event.target.value = ''
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (isPreview) return
    event.dataTransfer.dropEffect = 'copy'
    setIsDragActive(true)
  }

  const handleDragLeave = () => {
    setIsDragActive(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (isPreview) return
    setIsDragActive(false)
    const { files } = event.dataTransfer
    if (files && files.length > 0) {
      void ingestFiles(files)
    }
  }

  const handleDeleteTrack = (indexToDelete: number) => {
    if (isPreview) return

    updatePlaylist((current) => {
      const newPlaylist = current.filter((_, index) => index !== indexToDelete)

      // Clean up blob URL if it exists
      const trackToDelete = current[indexToDelete]
      if (trackToDelete?.url.startsWith('blob:')) {
        URL.revokeObjectURL(trackToDelete.url)
      }

      return newPlaylist
    })

    // Adjust selected track index if needed
    if (selectedTrackIndex === indexToDelete) {
      setSelectedTrackIndex(null)
    } else if (selectedTrackIndex !== null && selectedTrackIndex > indexToDelete) {
      setSelectedTrackIndex(selectedTrackIndex - 1)
    }

    // Adjust current track index if needed
    if (activeIndex === indexToDelete) {
      // If deleting current track, stop playback
      setIsPlaying(false)
      if (indexToDelete < tracks.length - 1) {
        // Play next track if available
        changeTrack(indexToDelete)
      } else if (indexToDelete > 0) {
        // Play previous track if next is not available
        changeTrack(indexToDelete - 1)
      }
    } else if (activeIndex > indexToDelete) {
      // Adjust active index
      setRawIndex(String(activeIndex - 1))
    }
  }

  const handleTrackEdit = (field: keyof PlaylistTrack, value: string) => {
    if (isPreview || selectedTrackIndex === null) return

    updatePlaylist((current) => {
      const newPlaylist = [...current]
      newPlaylist[selectedTrackIndex] = {
        ...newPlaylist[selectedTrackIndex],
        [field]: value,
      }
      return newPlaylist
    })
  }

  const selectedTrack = selectedTrackIndex !== null ? tracks[selectedTrackIndex] : null

  const handleNext = () => {
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length)
      changeTrack(randomIndex)
      return
    }
    changeTrack(activeIndex + 1)
  }

  const handlePrevious = () => {
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length)
      changeTrack(randomIndex)
      return
    }
    changeTrack(activeIndex - 1)
  }

  const handleEnded = () => {
    if (loop) {
      changeTrack(activeIndex + 1, { autoplay: true })
      return
    }

    if (radioMode) {
      // Radio mode reuses shuffle behaviour to simulate new track discovery
      const randomIndex = Math.floor(Math.random() * tracks.length)
      changeTrack(randomIndex, { autoplay: true })
      return
    }

    setIsPlaying(false)
  }

  if (!tracks.length) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border/70 border-dashed bg-muted/40 p-4 text-center text-muted-foreground text-sm transition-colors',
          isDragActive && !isPreview && 'border-primary/60 bg-primary/5 text-primary'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className='mb-2 font-medium'>Drop audio files here to build a playlist.</p>
        <p className='text-muted-foreground text-xs'>
          Supports multiple `.mp3`, `.wav`, `.ogg`, and `.aac` files.
        </p>
        <div className='mt-3 flex justify-center'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleFileInputClick}
            disabled={isPreview}
          >
            Choose files
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type='file'
          accept='audio/*'
          multiple
          className='hidden'
          onChange={handleFileInputChange}
        />
      </div>
    )
  }

  return (
    <div className='workflow-block-content space-y-1'>
      <input
        ref={fileInputRef}
        type='file'
        accept='audio/*'
        multiple
        className='hidden'
        onChange={handleFileInputChange}
      />

      {/* Now Playing Section - Always visible */}
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div>
          <p className='text-muted-foreground text-xs uppercase tracking-wide'>Now playing</p>
          <h3 className={cn('font-semibold leading-tight', isWide ? 'text-lg' : 'text-base')}>
            {activeTrack?.title || 'Untitled track'}
          </h3>
          {activeTrack?.artist && (
            <p className='text-muted-foreground text-sm'>{activeTrack.artist}</p>
          )}
        </div>
        <div className='flex items-center gap-2 text-muted-foreground text-xs'>
          <span>
            Track {activeIndex + 1} of {tracks.length}
          </span>
        </div>
      </div>

      {/* Audio Controls - Always visible */}
      <div className={cn('flex flex-col', isWide ? 'gap-2' : 'gap-1')}>
        {/* biome-ignore lint/a11y/useMediaCaption: Captions will be attached when transcript metadata is available from upstream services. */}
        <audio
          ref={audioRef}
          src={activeTrack?.url}
          onTimeUpdate={(event) => {
            const el = event.currentTarget
            if (!el.duration || Number.isNaN(el.duration)) return
            setCurrentTime(el.currentTime)
            setDuration(el.duration)
            setProgress((el.currentTime / el.duration) * 100)
          }}
          onLoadedMetadata={(event) => {
            const el = event.currentTarget
            if (!Number.isFinite(el.duration)) return
            setDuration(el.duration)
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          preload='metadata'
        />
        <div className='flex items-center gap-2'>
          <Button
            size='icon'
            variant='ghost'
            onClick={handlePrevious}
            disabled={tracks.length <= 1}
            className={isWide ? 'h-10 w-10' : 'h-8 w-8'}
          >
            <SkipBack className={isWide ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
          <Button
            size='icon'
            onClick={() => setIsPlaying((prev) => !prev)}
            className={isWide ? 'h-12 w-12 rounded-full' : 'h-10 w-10 rounded-full'}
            disabled={!activeTrack?.url}
          >
            {isPlaying ? (
              <Pause className={isWide ? 'h-6 w-6' : 'h-5 w-5'} />
            ) : (
              <Play className={isWide ? 'h-6 w-6' : 'h-5 w-5'} />
            )}
          </Button>
          <Button
            size='icon'
            variant='ghost'
            onClick={handleNext}
            disabled={tracks.length <= 1}
            className={isWide ? 'h-10 w-10' : 'h-8 w-8'}
          >
            <SkipForward className={isWide ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
          <div className='ml-auto flex items-center gap-2 text-muted-foreground text-xs'>
            {isWide && <Volume2 className='h-4 w-4' />}
            <span>
              {Math.floor(currentTime / 60)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor(currentTime % 60)
                .toString()
                .padStart(2, '0')}
              {' / '}
              {Math.floor(duration / 60)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor(duration % 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>
        </div>
        <Progress value={progress} className='h-1 w-full' />
        {isLoading && <p className='text-muted-foreground text-xs'>Buffering audio…</p>}
      </div>

      {/* Playback Controls - Only in full view */}
      <div
        className={cn(
          'mt-2 grid grid-cols-2 gap-2 transition-all duration-150',
          isWide ? 'max-h-32 opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        )}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Repeat className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm'>Loop playlist</span>
          </div>
          <Switch checked={loop || false} onCheckedChange={setLoop} disabled={isPreview} />
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Shuffle className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm'>Shuffle</span>
          </div>
          <Switch checked={shuffle || false} onCheckedChange={setShuffle} disabled={isPreview} />
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Radio className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm'>Radio mode</span>
          </div>
          <Switch
            checked={radioMode || false}
            onCheckedChange={setRadioMode}
            disabled={isPreview}
          />
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Play className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm'>Auto-play</span>
          </div>
          <Switch checked={autoPlay || false} onCheckedChange={setAutoPlay} disabled={isPreview} />
        </div>
      </div>

      <div
        className={cn(
          'space-y-1 transition-all duration-150',
          isWide ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        )}
      >
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground text-xs uppercase tracking-wide'>Playlist</p>
          {!isPreview && (
            <Button type='button' variant='outline' size='sm' onClick={handleFileInputClick}>
              Add audio files
            </Button>
          )}
        </div>

        <ScrollArea className='h-64 rounded border border-border/60'>
          <div
            className={cn('divide-y divide-border/60', !isPreview && 'cursor-copy')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {tracks.map((track, index) => {
              const isActive = index === activeIndex
              const isSelected = index === selectedTrackIndex
              return (
                <div
                  key={track.id}
                  className={cn(
                    'group flex w-full items-center gap-2 px-2 py-1 text-sm transition hover:bg-muted/70',
                    isActive && 'bg-primary/10 text-primary',
                    isSelected && !isActive && 'bg-muted/50'
                  )}
                >
                  <button
                    type='button'
                    className='flex min-w-0 flex-1 items-center gap-3 text-left'
                    onClick={() => {
                      setSelectedTrackIndex(index)
                    }}
                    onDoubleClick={() => changeTrack(index)}
                    disabled={!track.url}
                  >
                    <div className='flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background/80'>
                      {isActive ? (
                        <Music2 className='h-4 w-4' />
                      ) : (
                        <span className='text-muted-foreground text-xs'>{index + 1}</span>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>{track.title || `Track ${index + 1}`}</p>
                      {track.artist && (
                        <p className='truncate text-muted-foreground text-xs'>{track.artist}</p>
                      )}
                    </div>
                  </button>

                  {!isPreview && (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-8 w-8 p-0 text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrack(index)
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Track editing form */}
        {selectedTrack && !isPreview && (
          <div className='space-y-2 rounded border border-border/60 bg-background/40 p-2'>
            <div className='flex items-center gap-2'>
              <Music2 className='h-4 w-4 text-muted-foreground' />
              <span className='font-medium text-sm'>Edit Track {selectedTrackIndex! + 1}</span>
            </div>

            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <div className='space-y-1'>
                <Label htmlFor='track-title' className='text-xs'>
                  Title
                </Label>
                <Input
                  id='track-title'
                  value={selectedTrack.title}
                  onChange={(e) => handleTrackEdit('title', e.target.value)}
                  placeholder='Track title'
                  className='h-8 text-sm'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='track-artist' className='text-xs'>
                  Artist
                </Label>
                <Input
                  id='track-artist'
                  value={selectedTrack.artist || ''}
                  onChange={(e) => handleTrackEdit('artist', e.target.value)}
                  placeholder='Artist name'
                  className='h-8 text-sm'
                />
              </div>

              <div className='space-y-1 sm:col-span-2'>
                <Label htmlFor='track-url' className='text-xs'>
                  URL
                </Label>
                <Input
                  id='track-url'
                  value={selectedTrack.url}
                  onChange={(e) => handleTrackEdit('url', e.target.value)}
                  placeholder='https://example.com/audio.mp3'
                  className='h-8 text-sm'
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

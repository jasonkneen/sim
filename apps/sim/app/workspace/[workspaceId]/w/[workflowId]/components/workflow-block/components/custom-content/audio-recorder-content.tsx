'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, Mic, MicOff, Trash2, Waves } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface TableRow {
  id: string
  cells: Record<string, string>
}

interface RecordingEntry {
  id: string
  createdAt: string
  url: string
  durationSeconds?: number
  transcript?: string
}

type RecordingStatus = 'idle' | 'recording' | 'processing'

function decodeTableRows(rows: TableRow[] | null | undefined): RecordingEntry[] {
  if (!rows || !Array.isArray(rows)) return []
  return rows.map((row) => ({
    id: row?.cells?.['Recording ID'] || row?.id || crypto.randomUUID(),
    createdAt: row?.cells?.Created || new Date().toISOString(),
    url: row?.cells?.URL || '',
    transcript: row?.cells?.Transcript || '',
    durationSeconds: row?.cells?.['Duration (s)']
      ? Number.parseFloat(row.cells['Duration (s)'])
      : undefined,
  }))
}

function encodeTableRows(entries: RecordingEntry[]): TableRow[] {
  return entries.map((entry) => ({
    id: entry.id,
    cells: {
      'Recording ID': entry.id,
      URL: entry.url,
      Created: entry.createdAt,
      Transcript: entry.transcript ?? '',
      'Duration (s)': entry.durationSeconds ? entry.durationSeconds.toFixed(1) : '',
    },
  }))
}

function formatDuration(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.floor(seconds % 60)
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

export function AudioRecorderContent({
  blockId,
  isPreview,
  previewValues,
}: CustomBlockContentProps) {
  const [mode] = useResolvedSubBlockValue<string>(blockId, 'mode', {
    isPreview,
    previewValues,
  })
  const [deviceId] = useResolvedSubBlockValue<string>(blockId, 'deviceId', {
    isPreview,
    previewValues,
  })
  const [autoTranscribe] = useResolvedSubBlockValue<boolean>(blockId, 'autoTranscribe', {
    isPreview,
    previewValues,
  })
  const [smartAnalysis] = useResolvedSubBlockValue<boolean>(blockId, 'smartAnalysis', {
    isPreview,
    previewValues,
  })
  const [recordingRows, setRecordingRows] = useResolvedSubBlockValue<TableRow[] | null>(
    blockId,
    'recordings',
    {
      isPreview,
      previewValues,
    }
  )

  const recordings = useMemo(() => decodeTableRows(recordingRows), [recordingRows])
  const recordingsRef = useRef<RecordingEntry[]>(recordings)

  useEffect(() => {
    recordingsRef.current = recordings
  }, [recordings])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (status === 'recording') {
      interval = setInterval(() => {
        setElapsed((value) => value + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status])

  const updateRecordings = useCallback(
    (next: RecordingEntry[]) => {
      if (isPreview) return
      setRecordingRows(encodeTableRows(next))
    },
    [isPreview, setRecordingRows]
  )

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const handleStart = async () => {
    if (isPreview || status === 'recording') return

    if (mode === 'system' || mode === 'app') {
      setError(
        'System/app audio capture requires the desktop recorder bridge. Use microphone mode or connect the desktop agent.'
      )
      return
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Media devices API is not available in this environment.')
      return
    }

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
        },
      })

      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          setStatus('processing')
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          chunksRef.current = []

          const recordedAt = new Date().toISOString()
          const objectUrl = URL.createObjectURL(blob)

          const computeDuration = () =>
            new Promise<number>((resolve) => {
              const tempAudio = document.createElement('audio')
              tempAudio.src = objectUrl
              tempAudio.addEventListener('loadedmetadata', () => {
                resolve(Number.isFinite(tempAudio.duration) ? tempAudio.duration : 0)
              })
              tempAudio.addEventListener('error', () => resolve(0))
            })

          const durationSeconds = await computeDuration()

          const toDataUrl = () =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onerror = () => reject(new Error('Failed to read recorded audio'))
              reader.onloadend = () => {
                resolve(reader.result as string)
              }
              reader.readAsDataURL(blob)
            })

          const dataUrl = await toDataUrl()

          const next: RecordingEntry[] = [
            {
              id: crypto.randomUUID(),
              createdAt: recordedAt,
              url: dataUrl,
              durationSeconds,
              transcript: autoTranscribe ? 'Pending transcription…' : undefined,
            },
            ...recordingsRef.current,
          ]

          updateRecordings(next)
          setElapsed(0)
          setStatus('idle')
          URL.revokeObjectURL(objectUrl)
        } catch (processingError) {
          console.error(processingError)
          setError('Failed to finalize the recording. The audio data may be unavailable.')
          setStatus('idle')
        } finally {
          cleanupStream()
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setStatus('recording')
      setElapsed(0)
    } catch (exception) {
      console.error(exception)
      setError('Unable to access microphone. Check browser permissions and device availability.')
      cleanupStream()
      setStatus('idle')
    }
  }

  const handleStop = () => {
    if (status !== 'recording') return

    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (recorder.state !== 'inactive') {
      recorder.stop()
    }
    cleanupStream()
  }

  const handleDelete = (id: string) => {
    const next = recordings.filter((recording) => recording.id !== id)
    updateRecordings(next)
  }

  useEffect(() => () => cleanupStream(), [])

  return (
    <div className='space-y-4 rounded-lg border border-border/70 bg-card/50 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-muted-foreground text-xs uppercase tracking-wide'>Recording mode</p>
          <p className='font-medium text-sm capitalize'>{mode || 'microphone'}</p>
        </div>
        <div className='flex items-center gap-2'>
          {autoTranscribe && (
            <Badge variant='outline' className='text-xs uppercase'>
              Auto transcribe
            </Badge>
          )}
          {smartAnalysis && (
            <Badge variant='outline' className='text-xs uppercase'>
              Smart analysis
            </Badge>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-3 rounded-md border border-border/60 bg-background/60 p-4'>
        <div className='flex items-center gap-2 text-sm'>
          <Waves
            className={cn(
              'h-5 w-5',
              status === 'recording' ? 'text-destructive' : 'text-muted-foreground'
            )}
          />
          <span>
            {status === 'recording'
              ? 'Recording…'
              : status === 'processing'
                ? 'Processing recording…'
                : 'Ready to record'}
          </span>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            size='lg'
            onClick={handleStart}
            disabled={isPreview || status === 'recording'}
            className='flex-1'
          >
            <Mic className='mr-2 h-5 w-5' />
            Start
          </Button>
          <Button
            type='button'
            size='lg'
            variant='outline'
            onClick={handleStop}
            disabled={status !== 'recording'}
            className='flex-1'
          >
            <MicOff className='mr-2 h-5 w-5' />
            Stop
          </Button>
        </div>

        <div>
          <Progress
            className='h-2'
            value={
              status === 'recording'
                ? Math.min((elapsed % 60) * (100 / 60), 100)
                : status === 'processing'
                  ? 100
                  : 0
            }
          />
          <p className='mt-1 text-muted-foreground text-xs'>Elapsed: {formatDuration(elapsed)}</p>
        </div>

        {error && (
          <div className='flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm'>
            <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0' />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div>
        <div className='flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide'>
          <span>Recordings</span>
          <span>{recordings.length}</span>
        </div>
        {recordings.length === 0 ? (
          <div className='mt-3 rounded-md border border-border/60 bg-background/40 p-4 text-muted-foreground text-sm'>
            Capture audio to populate the recordings list.
          </div>
        ) : (
          <ScrollArea className='mt-3 max-h-48 rounded-md border border-border/60 bg-background/40'>
            <div className='divide-y divide-border/60'>
              {recordings.map((recording) => (
                <div key={recording.id} className='flex items-start gap-3 px-3 py-3 text-sm'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary'>
                    <Mic className='h-4 w-4' />
                  </div>
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <p className='font-medium'>{recording.id.slice(0, 8)}</p>
                      <span className='text-muted-foreground text-xs'>
                        {new Date(recording.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {/* biome-ignore lint/a11y/useMediaCaption: Playback previews rely on in-app transcripts generated downstream. */}
                    <audio controls src={recording.url} className='w-full' />
                    <div className='flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs'>
                      <span>Duration: {formatDuration(recording.durationSeconds)}</span>
                      {recording.transcript && <span>{recording.transcript}</span>}
                    </div>
                  </div>
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    onClick={() => handleDelete(recording.id)}
                    className='text-muted-foreground hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {status === 'processing' && (
        <div className='flex items-center gap-2 text-muted-foreground text-xs'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Finalizing recording…
        </div>
      )}
    </div>
  )
}

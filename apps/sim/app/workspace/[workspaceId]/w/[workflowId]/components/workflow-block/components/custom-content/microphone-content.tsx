'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Loader2, MicOff, RefreshCw, Settings2, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { CustomBlockContentProps } from './types'
import { useDeviceSettingsStore } from './use-device-settings'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface AudioDeviceOption {
  deviceId: string
  label: string
}

export function MicrophoneContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const [level, setLevel] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioDevices, setAudioDevices] = useState<AudioDeviceOption[]>([])

  const [deviceId, setDeviceId] = useResolvedSubBlockValue<string>(blockId, 'deviceId', {
    isPreview,
    previewValues,
  })
  const [noiseSuppression, setNoiseSuppression] = useResolvedSubBlockValue<string>(
    blockId,
    'noiseSuppression',
    {
      isPreview,
      previewValues,
    }
  )
  const [autoGain, setAutoGain] = useResolvedSubBlockValue<string>(blockId, 'autoGain', {
    isPreview,
    previewValues,
  })

  const { openBlockId, kind, close } = useDeviceSettingsStore()
  const deviceSelectId = `${blockId}-microphone-device`
  const isSettingsOpen = openBlockId === blockId && kind === 'microphone'

  const booleanValue = useCallback((value: string | null) => value === 'true', [])

  const mediaConstraints: MediaStreamConstraints = useMemo(
    () => ({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        noiseSuppression: noiseSuppression ? booleanValue(noiseSuppression) : undefined,
        autoGainControl: autoGain ? booleanValue(autoGain) : undefined,
      },
      video: false,
    }),
    [autoGain, booleanValue, deviceId, noiseSuppression]
  )

  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    analyserRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch((error_) => console.error(error_))
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsListening(false)
    setLevel(0)
  }, [])

  const refreshDevices = useCallback(async () => {
    if (isPreview || !navigator.mediaDevices?.enumerateDevices) return
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const options = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }))
      setAudioDevices(options)
      if (!deviceId && options.length > 0) {
        setDeviceId(options[0].deviceId)
      }
    } catch (error_) {
      console.error('Failed to enumerate audio devices', error_)
      setAudioDevices([])
    }
  }, [deviceId, isPreview, setDeviceId])

  const updateLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const dataArray = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(dataArray)

    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128
      sum += value * value
    }
    const rms = Math.sqrt(sum / dataArray.length)
    setLevel(Math.min(1, rms * 2))

    rafRef.current = requestAnimationFrame(updateLevel)
  }, [])

  const startListening = useCallback(async () => {
    if (isPreview) return
    stopStream()
    setIsRequesting(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      setIsListening(true)
      updateLevel()
    } catch (error_) {
      console.error('Failed to access microphone', error_)
      setError(
        error_ instanceof Error
          ? error_.message
          : 'Unable to access the microphone. Check browser permissions.'
      )
    } finally {
      setIsRequesting(false)
    }
  }, [isPreview, mediaConstraints, stopStream, updateLevel])

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    refreshDevices().catch((error_) => console.error(error_))
  }, [refreshDevices])

  useEffect(() => {
    startListening().catch((error_) => console.error(error_))
    return () => {
      stopStream()
    }
  }, [startListening, stopStream])

  const statusLabel = isPreview
    ? 'Preview only'
    : isListening
      ? 'Live microphone active'
      : isRequesting
        ? 'Requesting microphone…'
        : 'Microphone off'

  return (
    <div className='flex min-h-[220px] flex-col gap-3'>
      <Dialog open={isSettingsOpen} onOpenChange={(open) => (!open ? close() : undefined)}>
        <DialogContent className='max-w-sm space-y-5'>
          <DialogHeader>
            <DialogTitle>Microphone settings</DialogTitle>
            <DialogDescription>Choose an input device and capture options.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 text-sm'>
            <div className='space-y-2'>
              <label
                className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                htmlFor={deviceSelectId}
              >
                Microphone
              </label>
              <Select value={deviceId ?? ''} onValueChange={(value) => setDeviceId(value || '')}>
                <SelectTrigger id={deviceSelectId} className='h-9 text-sm'>
                  <SelectValue placeholder='Select microphone' />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='gap-1 text-xs'
                onClick={() => refreshDevices().catch((error_) => console.error(error_))}
              >
                <RefreshCw className='h-3 w-3' />
                Refresh devices
              </Button>
            </div>

            <div className='flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2'>
              <div>
                <p className='font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                  Noise suppression
                </p>
                <p className='text-[11px] text-muted-foreground/80'>
                  Let the browser reduce ambient noise.
                </p>
              </div>
              <Switch
                checked={booleanValue(noiseSuppression)}
                onCheckedChange={(checked) => setNoiseSuppression(String(checked))}
              />
            </div>

            <div className='flex items-center justify-between rounded-md border border-border/60 bg-background/60 px-3 py-2'>
              <div>
                <p className='font-medium text-muted-foreground text-xs uppercase tracking-wide'>
                  Auto gain
                </p>
                <p className='text-[11px] text-muted-foreground/80'>
                  Let the browser stabilise audio levels.
                </p>
              </div>
              <Switch
                checked={booleanValue(autoGain)}
                onCheckedChange={(checked) => setAutoGain(String(checked))}
              />
            </div>

            <Button
              type='button'
              className='w-full gap-2'
              onClick={() => startListening()}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Settings2 className='h-4 w-4' />
              )}
              Apply settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className='relative flex flex-1 flex-col justify-center rounded-2xl border border-border/60 bg-background/60 p-4'>
        <div className='flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide'>
          <span>{statusLabel}</span>
          <span>{Math.round(level * 100)}%</span>
        </div>

        <div className='mt-4 flex h-32 flex-1 items-center justify-center'>
          {isListening ? (
            <div className='flex w-full max-w-[360px] flex-col items-center gap-3'>
              <div className='relative h-3 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-100 ease-out'
                  )}
                  style={{ width: `${Math.max(level * 100, 4)}%` }}
                />
              </div>
              <Waves className='h-8 w-8 text-primary' />
            </div>
          ) : isRequesting ? (
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          ) : error ? (
            <div className='flex flex-col items-center gap-2 text-center text-destructive text-sm'>
              <AlertTriangle className='h-5 w-5' />
              <span>{error}</span>
            </div>
          ) : (
            <div className='flex flex-col items-center gap-2 text-muted-foreground'>
              <MicOff className='h-6 w-6' />
              <span>Microphone inactive</span>
            </div>
          )}
        </div>

        <div className='absolute right-4 bottom-4 flex gap-2'>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            onClick={() => (isListening ? stopStream() : startListening())}
            disabled={isRequesting || isPreview}
          >
            {isListening ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-3 text-muted-foreground text-xs'>
        <span>Device: {deviceId || 'auto-select'}</span>
        <span>Noise suppression: {booleanValue(noiseSuppression) ? 'on' : 'off'}</span>
        <span>Auto gain: {booleanValue(autoGain) ? 'on' : 'off'}</span>
      </div>
    </div>
  )
}

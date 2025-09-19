'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, Settings2, VideoOff } from 'lucide-react'
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
import type { CustomBlockContentProps } from './types'
import { useDeviceSettingsStore } from './use-device-settings'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface VideoDeviceOption {
  deviceId: string
  label: string
}

const RESOLUTION_OPTIONS = [
  { id: '1280x720', label: '1280 × 720 (HD)' },
  { id: '1920x1080', label: '1920 × 1080 (Full HD)' },
  { id: '3840x2160', label: '3840 × 2160 (4K)' },
]

export function CameraContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoDevices, setVideoDevices] = useState<VideoDeviceOption[]>([])

  const [deviceId, setDeviceId] = useResolvedSubBlockValue<string>(blockId, 'deviceId', {
    isPreview,
    previewValues,
  })
  const [facingMode, setFacingMode] = useResolvedSubBlockValue<'user' | 'environment' | string>(
    blockId,
    'facingMode',
    {
      isPreview,
      previewValues,
    }
  )
  const [resolution, setResolution] = useResolvedSubBlockValue<string>(blockId, 'resolution', {
    isPreview,
    previewValues,
  })
  const [frameRate, setFrameRate] = useResolvedSubBlockValue<string>(blockId, 'frameRate', {
    isPreview,
    previewValues,
  })

  const { openBlockId, kind, close } = useDeviceSettingsStore()
  const isSettingsOpen = openBlockId === blockId && kind === 'camera'
  const deviceSelectId = `${blockId}-camera-device`
  const facingSelectId = `${blockId}-camera-facing`
  const resolutionSelectId = `${blockId}-camera-resolution`
  const frameRateSelectId = `${blockId}-camera-framerate`

  const parsedConstraints = useMemo(() => {
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: facingMode ? { ideal: facingMode } : undefined,
      },
      audio: false,
    }

    if (resolution) {
      const [width, height] = resolution.split('x').map((value) => Number.parseInt(value, 10))
      if (Number.isFinite(width) && Number.isFinite(height)) {
        ;(constraints.video as MediaTrackConstraints).width = { ideal: width }
        ;(constraints.video as MediaTrackConstraints).height = { ideal: height }
      }
    }

    const fps = frameRate ? Number.parseInt(frameRate, 10) : undefined
    if (fps && Number.isFinite(fps)) {
      ;(constraints.video as MediaTrackConstraints).frameRate = { ideal: fps }
    }

    return constraints
  }, [deviceId, facingMode, frameRate, resolution])

  const stopStream = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    stream.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsStreaming(false)
  }, [])

  const attachStream = useCallback((stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
    streamRef.current = stream
    setIsStreaming(true)
  }, [])

  const startStream = useCallback(async () => {
    if (isPreview) return

    stopStream()
    setIsRequesting(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia(parsedConstraints)
      attachStream(stream)
    } catch (error_) {
      console.error('Failed to start camera', error_)
      setError(
        error_ instanceof Error
          ? error_.message
          : 'Unable to access the camera. Check browser permissions.'
      )
    } finally {
      setIsRequesting(false)
    }
  }, [attachStream, isPreview, parsedConstraints, stopStream])

  const refreshDeviceList = useCallback(async () => {
    if (isPreview || !navigator.mediaDevices?.enumerateDevices) return
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const options = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }))
      setVideoDevices(options)

      if (!deviceId && options.length > 0) {
        setDeviceId(options[0].deviceId)
      }
    } catch (error_) {
      console.error('Failed to enumerate video devices', error_)
      setVideoDevices([])
    }
  }, [deviceId, isPreview, setDeviceId])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return
    refreshDeviceList().catch((error_) => console.error(error_))
  }, [refreshDeviceList])

  useEffect(() => {
    startStream().catch((error_) => console.error(error_))
    return () => {
      stopStream()
    }
  }, [startStream, stopStream])

  const statusLabel = isPreview
    ? 'Preview only'
    : isStreaming
      ? 'Live stream active'
      : isRequesting
        ? 'Requesting camera…'
        : 'Camera off'

  return (
    <div className='relative flex min-h-[260px] flex-col gap-3'>
      <Dialog open={isSettingsOpen} onOpenChange={(open) => (!open ? close() : undefined)}>
        <DialogContent className='max-w-sm space-y-5'>
          <DialogHeader>
            <DialogTitle>Camera settings</DialogTitle>
            <DialogDescription>Pick a camera and tweak capture preferences.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 text-sm'>
            <div className='space-y-2'>
              <label
                className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                htmlFor={deviceSelectId}
              >
                Camera
              </label>
              <Select
                value={deviceId ?? ''}
                onValueChange={(value) => setDeviceId(value || '')}
                disabled={videoDevices.length === 0}
              >
                <SelectTrigger id={deviceSelectId} className='h-9 text-sm'>
                  <SelectValue placeholder='Select camera' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='default'>Default device</SelectItem>
                  {videoDevices.map((device) => (
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
                onClick={() => refreshDeviceList().catch((error_) => console.error(error_))}
              >
                <RefreshCw className='h-3 w-3' />
                Refresh devices
              </Button>
            </div>

            <div className='flex gap-3'>
              <div className='flex-1 space-y-2'>
                <label
                  className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                  htmlFor={facingSelectId}
                >
                  Facing mode
                </label>
                <Select
                  value={facingMode ?? 'user'}
                  onValueChange={(value) => setFacingMode(value)}
                >
                  <SelectTrigger id={facingSelectId} className='h-9 text-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='user'>Front facing</SelectItem>
                    <SelectItem value='environment'>Rear facing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex-1 space-y-2'>
                <label
                  className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                  htmlFor={resolutionSelectId}
                >
                  Resolution
                </label>
                <Select value={resolution ?? ''} onValueChange={(value) => setResolution(value)}>
                  <SelectTrigger id={resolutionSelectId} className='h-9 text-sm'>
                    <SelectValue placeholder='Auto' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='auto'>Auto</SelectItem>
                    {RESOLUTION_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <label
                className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                htmlFor={frameRateSelectId}
              >
                Target frame rate
              </label>
              <Select value={frameRate ?? ''} onValueChange={(value) => setFrameRate(value)}>
                <SelectTrigger id={frameRateSelectId} className='h-9 text-sm'>
                  <SelectValue placeholder='Auto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='auto'>Auto</SelectItem>
                  <SelectItem value='30'>30 fps</SelectItem>
                  <SelectItem value='60'>60 fps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type='button'
              className='w-full gap-2'
              onClick={() => startStream()}
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

      <div className='relative flex-1 overflow-hidden rounded-2xl border border-border/60 bg-black'>
        <video ref={videoRef} className='h-full w-full object-cover' autoPlay muted playsInline />

        {!isStreaming && !isRequesting && !error && (
          <div className='absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground'>
            <VideoOff className='h-6 w-6' />
            <span>Camera inactive</span>
          </div>
        )}

        {isRequesting && (
          <div className='absolute inset-0 flex items-center justify-center gap-2 bg-background/60 text-foreground'>
            <Loader2 className='h-6 w-6 animate-spin' />
            Initialising camera…
          </div>
        )}

        {error && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='flex max-w-[280px] flex-col items-center gap-2 rounded-xl bg-background/95 px-4 py-3 text-center text-destructive text-sm shadow-lg'>
              <AlertTriangle className='h-5 w-5' />
              <span>{error}</span>
              <Button size='sm' variant='outline' onClick={() => startStream()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className='absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 font-medium text-[11px] text-foreground shadow-sm'>
          {statusLabel}
        </div>

        <div className='absolute right-3 bottom-3 flex items-center gap-2'>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            onClick={() => (isStreaming ? stopStream() : startStream())}
            disabled={isRequesting || isPreview}
          >
            {isStreaming ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-3 text-muted-foreground text-xs'>
        <span>Device: {deviceId || 'auto-select'}</span>
        <span>Facing: {facingMode || 'auto'}</span>
        <span>Resolution: {resolution || 'auto'}</span>
        <span>FPS: {frameRate || 'auto'}</span>
      </div>
    </div>
  )
}

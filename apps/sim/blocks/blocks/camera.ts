import { Video } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

interface CameraBlockOutput {
  deviceId?: string
  facingMode?: 'user' | 'environment'
  resolution?: string
  frameRate?: number
  streamActive: boolean
}

export const CameraBlock: BlockConfig<CameraBlockOutput> = {
  type: 'camera',
  name: 'Camera',
  description: 'Stream a live camera preview for demos or monitoring.',
  longDescription:
    'Embed the device camera directly on the canvas. Configure resolution, frame rate, and facing mode from the node toolbar, and broadcast the stream to downstream blocks.',
  category: 'blocks',
  bgColor: '#1E90FF',
  icon: Video,
  subBlocks: [
    {
      id: 'deviceId',
      title: 'Camera Device',
      type: 'short-input',
      hidden: true,
      layout: 'full',
    },
    {
      id: 'facingMode',
      title: 'Facing Mode',
      type: 'short-input',
      hidden: true,
      layout: 'half',
    },
    {
      id: 'resolution',
      title: 'Resolution',
      type: 'short-input',
      hidden: true,
      layout: 'half',
    },
    {
      id: 'frameRate',
      title: 'Frame Rate',
      type: 'short-input',
      hidden: true,
      layout: 'half',
    },
  ],
  tools: { access: [] },
  inputs: {
    deviceId: { type: 'string', description: 'Preferred camera device ID' },
    facingMode: { type: 'string', description: 'Desired facing mode (user/environment)' },
    resolution: { type: 'string', description: 'Requested resolution, e.g. 1920x1080' },
    frameRate: { type: 'number', description: 'Requested frame rate' },
  },
  outputs: {
    streamActive: { type: 'boolean', description: 'Whether the camera stream is currently active' },
    deviceId: { type: 'string', description: 'Active camera device ID' },
    facingMode: { type: 'string', description: 'Active facing mode' },
    resolution: { type: 'string', description: 'Active resolution in WIDTHxHEIGHT' },
    frameRate: { type: 'number', description: 'Approximate frame rate' },
  },
}

import { SignalIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

type LivestreamOutput = {
  platform: 'youtube' | 'twitch' | 'custom'
  streamKey?: string
  streamUrl?: string
  title?: string
  description?: string
  recordStream?: boolean
  chatIntegration?: boolean
}

export const LivestreamBlock: BlockConfig<LivestreamOutput> = {
  type: 'livestream',
  name: 'Livestream',
  description: 'Configure livestream settings and metadata.',
  longDescription:
    'Define streaming endpoints, metadata, and recording preferences for broadcasts. Downstream blocks can start or monitor the livestream.',
  category: 'blocks',
  bgColor: '#FF4757',
  icon: SignalIcon,
  subBlocks: [
    {
      id: 'platform',
      title: 'Platform',
      type: 'dropdown',
      layout: 'half',
      required: true,
      options: [
        { label: 'YouTube', id: 'youtube' },
        { label: 'Twitch', id: 'twitch' },
        { label: 'Custom RTMP', id: 'custom' },
      ],
      value: () => 'youtube',
    },
    {
      id: 'streamUrl',
      title: 'Stream URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'rtmp://live.youtube.com/app',
    },
    {
      id: 'streamKey',
      title: 'Stream Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Your stream key',
      password: true,
    },
    {
      id: 'title',
      title: 'Title',
      type: 'short-input',
      layout: 'full',
    },
    {
      id: 'description',
      title: 'Description',
      type: 'long-input',
      layout: 'full',
      rows: 3,
    },
    {
      id: 'recordStream',
      title: 'Record stream',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'chatIntegration',
      title: 'Chat integration',
      type: 'switch',
      layout: 'half',
      description: 'Enable chat ingestion for downstream processing.',
    },
  ],
  tools: { access: [] },
  inputs: {
    platform: { type: 'string', description: 'Streaming platform' },
    streamUrl: { type: 'string', description: 'RTMP endpoint URL' },
    streamKey: { type: 'string', description: 'Stream key or token' },
    title: { type: 'string', description: 'Livestream title' },
    description: { type: 'string', description: 'Livestream description' },
    recordStream: { type: 'boolean', description: 'Enable recording flag' },
    chatIntegration: { type: 'boolean', description: 'Enable chat integration' },
  },
  outputs: {
    platform: { type: 'string', description: 'Streaming platform' },
    streamUrl: { type: 'string', description: 'RTMP URL' },
    streamKey: { type: 'string', description: 'Stream key' },
    title: { type: 'string', description: 'Stream title' },
    description: { type: 'string', description: 'Stream description' },
    recordStream: { type: 'boolean', description: 'Recording preference' },
    chatIntegration: { type: 'boolean', description: 'Chat integration flag' },
  },
}

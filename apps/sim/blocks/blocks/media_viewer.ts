import { ImageIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

type MediaViewerOutput = {
  sourceType: 'image' | 'video' | 'audio' | 'pdf' | 'url'
  source: string
  caption?: string
  autoPlay?: boolean
  loop?: boolean
  showMetadata?: boolean
}

export const MediaViewerBlock: BlockConfig<MediaViewerOutput> = {
  type: 'media_viewer',
  name: 'Media Viewer',
  description: 'Preview images, video, audio, PDFs, or URLs in your workflow canvas.',
  longDescription:
    'Drop files or reference URLs to display rich media inside your workflow. Supports autoplay, looping, and metadata display for connected nodes.',
  category: 'blocks',
  bgColor: '#2F3542',
  icon: ImageIcon,
  subBlocks: [
    {
      id: 'sourceType',
      title: 'Media Type',
      type: 'dropdown',
      layout: 'half',
      required: true,
      options: [
        { label: 'Image', id: 'image' },
        { label: 'Video', id: 'video' },
        { label: 'Audio', id: 'audio' },
        { label: 'PDF', id: 'pdf' },
        { label: 'URL', id: 'url' },
      ],
    },
    {
      id: 'source',
      title: 'Source',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Paste a URL or connect a previous block output…',
      required: true,
    },
    {
      id: 'caption',
      title: 'Caption',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Optional caption or description',
    },
    {
      id: 'autoPlay',
      title: 'Auto-play',
      type: 'switch',
      layout: 'half',
      description: 'Automatically play supported media on load.',
    },
    {
      id: 'loop',
      title: 'Loop playback',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'showMetadata',
      title: 'Show metadata',
      type: 'switch',
      layout: 'half',
      description: 'Display file size, duration, and other metadata when available.',
    },
  ],
  tools: { access: [] },
  inputs: {
    sourceType: { type: 'string', description: 'Media type' },
    source: { type: 'string', description: 'Media URL or data source' },
    caption: { type: 'string', description: 'Caption text' },
    autoPlay: { type: 'boolean', description: 'Autoplay media flag' },
    loop: { type: 'boolean', description: 'Loop media flag' },
    showMetadata: { type: 'boolean', description: 'Display metadata flag' },
  },
  outputs: {
    sourceType: { type: 'string', description: 'Media type' },
    source: { type: 'string', description: 'Resolved media source' },
    caption: { type: 'string', description: 'Caption text' },
    autoPlay: { type: 'boolean', description: 'Autoplay toggle' },
    loop: { type: 'boolean', description: 'Loop toggle' },
    showMetadata: { type: 'boolean', description: 'Show metadata toggle' },
  },
}

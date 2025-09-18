import { SignalIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

type AudioTrack = {
  id: string
  title: string
  url: string
  artist?: string
  coverImage?: string
  durationSeconds?: number
}

type AudioPlayerOutput = {
  playlist: AudioTrack[]
  currentTrackIndex?: number
  loop?: boolean
  shuffle?: boolean
  radioMode?: boolean
  autoPlay?: boolean
}

export const AudioPlayerBlock: BlockConfig<AudioPlayerOutput> = {
  type: 'audio_player',
  name: 'Audio Player',
  description: 'Manage audio playlists with playback controls.',
  longDescription:
    'Create dynamic audio playlists, enable loop or shuffle modes, and broadcast playback state to downstream blocks.',
  category: 'blocks',
  bgColor: '#0DB67C',
  icon: SignalIcon,
  subBlocks: [
    {
      id: 'playlist',
      title: 'Playlist',
      type: 'playlist-editor',
      layout: 'full',
      description: 'Manage audio tracks for playback.',
    },
    {
      id: 'currentTrackIndex',
      title: 'Default Track Index',
      type: 'short-input',
      layout: 'half',
      placeholder: '0',
      description: 'Index of the track to start playback from (0-based).',
    },
    {
      id: 'loop',
      title: 'Loop playlist',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'shuffle',
      title: 'Shuffle',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'radioMode',
      title: 'Radio mode',
      type: 'switch',
      layout: 'half',
      description: 'Continuously fetch related tracks when playlist ends.',
    },
    {
      id: 'autoPlay',
      title: 'Auto-play',
      type: 'switch',
      layout: 'half',
      description: 'Start playback automatically when the workflow reaches this block.',
    },
  ],
  tools: { access: [] },
  inputs: {
    playlist: { type: 'json', description: 'Audio track definitions' },
    currentTrackIndex: { type: 'number', description: 'Initial track index' },
    loop: { type: 'boolean', description: 'Loop playlist flag' },
    shuffle: { type: 'boolean', description: 'Shuffle flag' },
    radioMode: { type: 'boolean', description: 'Enable radio mode' },
    autoPlay: { type: 'boolean', description: 'Autoplay flag' },
  },
  outputs: {
    playlist: { type: 'json', description: 'Resolved playlist' },
    currentTrackIndex: { type: 'number', description: 'Current track index' },
    loop: { type: 'boolean', description: 'Loop state' },
    shuffle: { type: 'boolean', description: 'Shuffle state' },
    radioMode: { type: 'boolean', description: 'Radio mode state' },
    autoPlay: { type: 'boolean', description: 'Autoplay state' },
  },
}

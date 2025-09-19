import { SignalIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type AudioTrack = {
  id: string
  title: string
  url: string
  artist?: string
  coverImage?: string
  durationSeconds?: number
}

interface AudioPlayerToolResponse extends ToolResponse {
  output: {
    playlist: AudioTrack[]
    currentTrackIndex?: number
    loop?: boolean
    shuffle?: boolean
    radioMode?: boolean
    autoPlay?: boolean
  }
}

export const AudioPlayerBlock: BlockConfig<AudioPlayerToolResponse> = {
  type: 'audio_player',
  name: 'Audio Player',
  description: 'Manage audio playlists with playback controls.',
  longDescription:
    'Create dynamic audio playlists, enable loop or shuffle modes, and broadcast playback state to downstream blocks.',
  category: 'blocks',
  bgColor: '#0DB67C',
  icon: SignalIcon,
  subBlocks: [],
  tools: { access: [] },
  inputs: {
    playlist: { type: 'json', description: 'Audio track definitions' },
    loop: { type: 'boolean', description: 'Loop playlist flag' },
    shuffle: { type: 'boolean', description: 'Shuffle flag' },
    radioMode: { type: 'boolean', description: 'Enable radio mode' },
    autoPlay: { type: 'boolean', description: 'Autoplay flag' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the audio player was successful' },
    output: { type: 'json', description: 'Audio player configuration' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    playlist: { type: 'json', description: 'Resolved playlist' },
    loop: { type: 'boolean', description: 'Loop state' },
    shuffle: { type: 'boolean', description: 'Shuffle state' },
    radioMode: { type: 'boolean', description: 'Radio mode state' },
    autoPlay: { type: 'boolean', description: 'Autoplay state' },
  },
}

import { NotificationsIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type RecordingReference = {
  id: string
  url: string
  createdAt: string
  transcript?: string
  notes?: string
}

interface AudioRecorderToolResponse extends ToolResponse {
  output: {
    mode: 'microphone' | 'system' | 'app'
    deviceId?: string
    autoTranscribe?: boolean
    smartAnalysis?: boolean
    recordings: RecordingReference[]
  }
}

export const AudioRecorderBlock: BlockConfig<AudioRecorderToolResponse> = {
  type: 'audio_recorder',
  name: 'Audio Recorder',
  description: 'Capture audio recordings and optionally transcribe them.',
  longDescription:
    'Record audio from microphone, system, or specific apps. Automatically transcribe and analyse recordings with downstream workflows.',
  category: 'blocks',
  bgColor: '#FF6B81',
  icon: NotificationsIcon,
  subBlocks: [
    {
      id: 'mode',
      title: 'Recording Mode',
      type: 'dropdown',
      layout: 'half',
      required: true,
      options: [
        { label: 'Microphone', id: 'microphone' },
        { label: 'System Audio', id: 'system' },
        { label: 'App Targeted', id: 'app' },
      ],
      value: () => 'microphone',
    },
    {
      id: 'deviceId',
      title: 'Device ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Optional specific device identifier',
    },
    {
      id: 'autoTranscribe',
      title: 'Auto Transcribe',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'smartAnalysis',
      title: 'Smart Analysis',
      type: 'switch',
      layout: 'half',
      description: 'Run post-recording analysis (speaker detection, sentiment, etc.).',
    },
    {
      id: 'recordings',
      title: 'Existing Recordings',
      type: 'table',
      layout: 'full',
      hidden: true,
      columns: ['Recording ID', 'URL', 'Created', 'Transcript', 'Duration (s)'],
      description:
        'List of previously captured recordings accessible to downstream blocks. Managed through the recorder interface.',
    },
  ],
  tools: { access: [] },
  inputs: {
    mode: { type: 'string', description: 'Recording mode' },
    deviceId: { type: 'string', description: 'Preferred capture device identifier' },
    autoTranscribe: { type: 'boolean', description: 'Enable automatic transcription' },
    smartAnalysis: { type: 'boolean', description: 'Enable advanced analysis' },
    recordings: { type: 'json', description: 'Existing recording metadata' },
  },
  outputs: {
    success: {
      type: 'boolean',
      description: 'Whether the audio recording operation was successful',
    },
    output: { type: 'json', description: 'The structured output containing recording data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    mode: { type: 'string', description: 'Recording mode' },
    deviceId: { type: 'string', description: 'Device identifier used' },
    autoTranscribe: { type: 'boolean', description: 'Auto transcription enabled' },
    smartAnalysis: { type: 'boolean', description: 'Smart analysis enabled' },
    recordings: { type: 'json', description: 'Recording metadata list' },
  },
}

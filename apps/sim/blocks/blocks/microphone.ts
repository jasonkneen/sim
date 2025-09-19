import { Mic } from 'lucide-react'
import type { BlockConfig } from '@/blocks/types'

interface MicrophoneBlockOutput {
  deviceId?: string
  noiseSuppression?: boolean
  autoGain?: boolean
  streamActive: boolean
}

export const MicrophoneBlock: BlockConfig<MicrophoneBlockOutput> = {
  type: 'microphone',
  name: 'Microphone',
  description: 'Monitor live audio input from the user microphone.',
  longDescription:
    'Capture a real-time microphone stream directly on the canvas. Fine-tune capture settings from the node toolbar and expose the audio stream to downstream blocks for transcription or analysis.',
  category: 'blocks',
  bgColor: '#FF8C42',
  icon: Mic,
  subBlocks: [
    {
      id: 'deviceId',
      title: 'Microphone Device',
      type: 'short-input',
      hidden: true,
      layout: 'full',
    },
    {
      id: 'noiseSuppression',
      title: 'Noise Suppression',
      type: 'short-input',
      hidden: true,
      layout: 'half',
    },
    {
      id: 'autoGain',
      title: 'Auto Gain Control',
      type: 'short-input',
      hidden: true,
      layout: 'half',
    },
  ],
  tools: { access: [] },
  inputs: {
    deviceId: { type: 'string', description: 'Preferred microphone device ID' },
    noiseSuppression: { type: 'boolean', description: 'Enable WebRTC noise suppression' },
    autoGain: { type: 'boolean', description: 'Enable auto gain control' },
  },
  outputs: {
    streamActive: { type: 'boolean', description: 'Whether the microphone stream is active' },
    deviceId: { type: 'string', description: 'Active microphone device ID' },
    noiseSuppression: { type: 'boolean', description: 'Noise suppression state' },
    autoGain: { type: 'boolean', description: 'Auto gain control state' },
  },
}

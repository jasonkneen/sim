import { MessagesIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ElevenLabsBlockResponse } from '@/tools/elevenlabs/types'

type TTSProvider = 'elevenlabs'

type TTSBlockOutput = ElevenLabsBlockResponse['output'] & {
  provider: TTSProvider
  audioFormat: 'mp3' | 'wav' | 'ogg' | 'aac'
}

export const TTSBlock: BlockConfig<TTSBlockOutput> = {
  type: 'tts',
  name: 'Text to Speech',
  description: 'Convert text to speech using configurable providers.',
  longDescription:
    'Generate speech from text content. Select a provider, configure voices, and stream audio to downstream blocks.',
  category: 'tools',
  bgColor: '#701FFC',
  icon: MessagesIcon,
  subBlocks: [
    {
      id: 'provider',
      title: 'Provider',
      type: 'dropdown',
      layout: 'half',
      required: true,
      options: [{ label: 'ElevenLabs', id: 'elevenlabs' }],
      value: () => 'elevenlabs',
    },
    {
      id: 'text',
      title: 'Text',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Enter the text to convert to speech…',
      rows: 4,
      required: true,
    },
    {
      id: 'voiceId',
      title: 'Voice ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'ElevenLabs voice ID',
      required: true,
    },
    {
      id: 'modelId',
      title: 'Model ID',
      type: 'short-input',
      layout: 'half',
      placeholder: 'Optional model identifier',
    },
    {
      id: 'audioFormat',
      title: 'Audio Format',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'MP3', id: 'mp3' },
        { label: 'WAV', id: 'wav' },
        { label: 'OGG', id: 'ogg' },
        { label: 'AAC', id: 'aac' },
      ],
      value: () => 'mp3',
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter provider API key',
      password: true,
      required: true,
    },
  ],
  tools: {
    access: ['elevenlabs_tts'],
    config: {
      tool: () => 'elevenlabs_tts',
      params: (params) => ({
        apiKey: params.apiKey,
        text: params.text,
        voiceId: params.voiceId,
        modelId: params.modelId,
        audioFormat: params.audioFormat,
      }),
    },
  },
  inputs: {
    provider: { type: 'string', description: 'Selected TTS provider' },
    text: { type: 'string', description: 'Text to convert' },
    voiceId: { type: 'string', description: 'Voice identifier' },
    modelId: { type: 'string', description: 'Model identifier (provider specific)' },
    audioFormat: { type: 'string', description: 'Output audio format' },
    apiKey: { type: 'string', description: 'Provider API key' },
  },
  outputs: {
    provider: { type: 'string', description: 'Provider used for synthesis' },
    audioUrl: { type: 'string', description: 'Generated audio URL' },
    audioFormat: { type: 'string', description: 'Audio format' },
  },
}

import { UsersIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type LiveKitParticipantConfig = {
  name: string
  role?: string
  audio?: boolean
  video?: boolean
}

interface LiveKitToolResponse extends ToolResponse {
  output: {
    roomName: string
    serverUrl: string
    apiKey?: string
    apiSecret?: string
    autoJoin?: boolean
    participants?: LiveKitParticipantConfig[]
    enableRecording?: boolean
  }
}

export const LiveKitBlock: BlockConfig<LiveKitToolResponse> = {
  type: 'livekit',
  name: 'LiveKit Conference',
  description: 'Configure LiveKit rooms for collaborative sessions.',
  longDescription:
    'Define LiveKit room metadata, participant defaults, and recording options to power real-time conferencing workflows.',
  category: 'blocks',
  bgColor: '#6C5CE7',
  icon: UsersIcon,
  subBlocks: [
    {
      id: 'roomName',
      title: 'Room Name',
      type: 'short-input',
      layout: 'full',
      placeholder: 'workflow-room',
      required: true,
    },
    {
      id: 'serverUrl',
      title: 'Server URL',
      type: 'short-input',
      layout: 'full',
      placeholder: 'https://your-domain.livekit.cloud',
      required: true,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'half',
      password: true,
    },
    {
      id: 'apiSecret',
      title: 'API Secret',
      type: 'short-input',
      layout: 'half',
      password: true,
    },
    {
      id: 'autoJoin',
      title: 'Auto Join',
      type: 'switch',
      layout: 'half',
      description: 'Automatically join the room when the workflow reaches this block.',
    },
    {
      id: 'enableRecording',
      title: 'Enable Recording',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'participants',
      title: 'Default Participants',
      type: 'table',
      layout: 'full',
      columns: ['Name', 'Role', 'Audio', 'Video'],
    },
  ],
  tools: { access: [] },
  inputs: {
    roomName: { type: 'string', description: 'LiveKit room name' },
    serverUrl: { type: 'string', description: 'LiveKit server URL' },
    apiKey: { type: 'string', description: 'LiveKit API key' },
    apiSecret: { type: 'string', description: 'LiveKit API secret' },
    autoJoin: { type: 'boolean', description: 'Auto join room' },
    enableRecording: { type: 'boolean', description: 'Enable room recording' },
    participants: { type: 'json', description: 'Default participant configuration' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the LiveKit operation was successful' },
    output: { type: 'json', description: 'The structured output containing LiveKit data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    roomName: { type: 'string', description: 'Configured room name' },
    serverUrl: { type: 'string', description: 'LiveKit server URL' },
    apiKey: { type: 'string', description: 'API key for token generation' },
    apiSecret: { type: 'string', description: 'API secret for token generation' },
    autoJoin: { type: 'boolean', description: 'Auto join flag' },
    enableRecording: { type: 'boolean', description: 'Recording flag' },
    participants: { type: 'json', description: 'Participant defaults' },
  },
}

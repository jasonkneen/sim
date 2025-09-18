import { SettingsIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

interface AppControlToolResponse extends ToolResponse {
  output: {
    bundleId?: string
    appPath?: string
    launchArgs?: string
    shouldActivate?: boolean
    sendCommand?: string
    recordAudio?: boolean
  }
}

export const AppControlBlock: BlockConfig<AppControlToolResponse> = {
  type: 'app_control',
  name: 'App Control',
  description: 'Launch and control local applications.',
  longDescription:
    'Configure application automation including launching, sending commands, and toggling window focus. Outputs configuration for downstream automation blocks.',
  category: 'blocks',
  bgColor: '#1E90FF',
  icon: SettingsIcon,
  subBlocks: [
    {
      id: 'bundleId',
      title: 'Bundle Identifier',
      type: 'short-input',
      layout: 'half',
      placeholder: 'com.apple.Safari',
    },
    {
      id: 'appPath',
      title: 'Application Path',
      type: 'short-input',
      layout: 'half',
      placeholder: '/Applications/Safari.app',
    },
    {
      id: 'launchArgs',
      title: 'Launch Arguments',
      type: 'short-input',
      layout: 'full',
      placeholder: '--incognito',
    },
    {
      id: 'shouldActivate',
      title: 'Activate Window',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'sendCommand',
      title: 'Automation Command',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Optional automation macro or AppleScript…',
      rows: 3,
    },
    {
      id: 'recordAudio',
      title: 'Record audio output',
      type: 'switch',
      layout: 'half',
    },
  ],
  tools: { access: [] },
  inputs: {
    bundleId: { type: 'string', description: 'Application bundle identifier' },
    appPath: { type: 'string', description: 'Path to the application' },
    launchArgs: { type: 'string', description: 'Arguments passed at launch time' },
    shouldActivate: { type: 'boolean', description: 'Bring window to foreground' },
    sendCommand: { type: 'string', description: 'Automation command or script' },
    recordAudio: { type: 'boolean', description: 'Capture app audio' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the app control was successful' },
    output: {
      type: 'json',
      description: 'App control configuration',
    },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    bundleId: { type: 'string', description: 'Application bundle identifier' },
    appPath: { type: 'string', description: 'Application path' },
    launchArgs: { type: 'string', description: 'Launch arguments' },
    shouldActivate: { type: 'boolean', description: 'Activate window flag' },
    sendCommand: { type: 'string', description: 'Automation command' },
    recordAudio: { type: 'boolean', description: 'Record audio flag' },
  },
}

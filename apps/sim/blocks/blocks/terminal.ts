import { CodeIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

type TerminalHistoryEntry = {
  command: string
  cwd?: string
  exitCode?: number
  output?: string
  executedAt?: string
}

type TerminalBlockOutput = {
  command: string
  workingDirectory?: string
  environment?: Record<string, string>
  keepSession?: boolean
  history: TerminalHistoryEntry[]
}

export const TerminalBlock: BlockConfig<TerminalBlockOutput> = {
  type: 'terminal',
  name: 'Terminal',
  description: 'Execute shell commands as part of your workflow.',
  longDescription:
    'Configure shell commands, working directories, and environment variables. Downstream blocks can process command output for further automation.',
  category: 'blocks',
  bgColor: '#222F3E',
  icon: CodeIcon,
  subBlocks: [
    {
      id: 'command',
      title: 'Command',
      type: 'short-input',
      layout: 'full',
      placeholder: 'ls -la',
      required: true,
    },
    {
      id: 'workingDirectory',
      title: 'Working Directory',
      type: 'short-input',
      layout: 'half',
      placeholder: '/usr/src/app',
    },
    {
      id: 'environment',
      title: 'Environment Variables',
      type: 'table',
      layout: 'full',
      columns: ['Key', 'Value'],
    },
    {
      id: 'keepSession',
      title: 'Persist session',
      type: 'switch',
      layout: 'half',
      description: 'Keep a session alive for subsequent terminal blocks.',
    },
    {
      id: 'history',
      title: 'Execution History',
      type: 'table',
      layout: 'full',
      columns: ['Command', 'Exit', 'Timestamp'],
      description: 'Recent commands executed by this block.',
    },
  ],
  tools: { access: [] },
  inputs: {
    command: { type: 'string', description: 'Shell command to execute' },
    workingDirectory: { type: 'string', description: 'Working directory path' },
    environment: { type: 'json', description: 'Environment variables' },
    keepSession: { type: 'boolean', description: 'Persist session flag' },
    history: { type: 'json', description: 'Previous command history' },
  },
  outputs: {
    command: { type: 'string', description: 'Shell command' },
    workingDirectory: { type: 'string', description: 'Working directory' },
    environment: { type: 'json', description: 'Environment variables' },
    keepSession: { type: 'boolean', description: 'Persist session flag' },
    history: { type: 'json', description: 'Command history' },
  },
}

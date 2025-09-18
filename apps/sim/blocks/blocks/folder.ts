import { PackageSearchIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type FolderEntry = {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  modifiedAt?: string
  path: string
}

interface FolderToolResponse extends ToolResponse {
  output: {
    rootPath: string
    selectedItems: FolderEntry[]
    includeSubdirectories?: boolean
    filters?: string[]
  }
}

export const FolderBlock: BlockConfig<FolderToolResponse> = {
  type: 'folder',
  name: 'Folder',
  description: 'Browse and select files or folders.',
  longDescription:
    'Connect local or remote directories, filter contents, and expose selected files to downstream automation blocks.',
  category: 'blocks',
  bgColor: '#8E44AD',
  icon: PackageSearchIcon,
  subBlocks: [
    {
      id: 'rootPath',
      title: 'Root Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/Users/me/Documents',
      required: true,
    },
    {
      id: 'includeSubdirectories',
      title: 'Include subdirectories',
      type: 'switch',
      layout: 'half',
    },
    {
      id: 'filters',
      title: 'File Filters',
      type: 'table',
      layout: 'full',
      columns: ['Pattern'],
      description: 'Optional glob patterns (e.g., *.pdf, *.wav).',
    },
    {
      id: 'selectedItems',
      title: 'Selected Items',
      type: 'table',
      layout: 'full',
      columns: ['Name', 'Type', 'Path'],
    },
  ],
  tools: { access: [] },
  inputs: {
    rootPath: { type: 'string', description: 'Base directory path' },
    includeSubdirectories: { type: 'boolean', description: 'Whether to recurse into subdirectories' },
    filters: { type: 'json', description: 'Filename filters' },
    selectedItems: { type: 'json', description: 'Selected files or folders' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the folder operation was successful' },
    output: { type: 'json', description: 'The structured output containing folder data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    rootPath: { type: 'string', description: 'Base directory path' },
    includeSubdirectories: { type: 'boolean', description: 'Recurse into subdirectories' },
    filters: { type: 'json', description: 'Filename filters' },
    selectedItems: { type: 'json', description: 'Selected file metadata' },
  },
}

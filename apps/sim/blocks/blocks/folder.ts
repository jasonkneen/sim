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
    folderPath: string
    selectedItems: FolderEntry[]
    includeHidden?: boolean
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
      id: 'folderPath',
      title: 'Folder Path',
      type: 'short-input',
      layout: 'full',
      placeholder: '/Users/me/Documents',
      required: true,
    },
    {
      id: 'includeHidden',
      title: 'Include hidden content',
      type: 'switch',
      layout: 'half',
      hidden: true,
    },
    {
      id: 'selectedItems',
      title: 'Selected Items',
      type: 'table',
      layout: 'full',
      columns: ['Name', 'Type', 'Path'],
      hidden: true,
    },
  ],
  tools: { access: [] },
  inputs: {
    folderPath: { type: 'string', description: 'Base directory path' },
    includeHidden: { type: 'boolean', description: 'Show dotfiles and hidden folders' },
    filters: { type: 'json', description: 'Filename filters' },
    selectedItems: { type: 'json', description: 'Selected files or folders' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the folder operation was successful' },
    output: { type: 'json', description: 'The structured output containing folder data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    folderPath: { type: 'string', description: 'Base directory path' },
    includeHidden: { type: 'boolean', description: 'Whether hidden entries were included' },
    filters: { type: 'json', description: 'Filename filters' },
    selectedItems: { type: 'json', description: 'Selected file metadata' },
  },
}

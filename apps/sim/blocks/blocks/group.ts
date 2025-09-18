import { ComponentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

interface GroupToolResponse extends ToolResponse {
  output: {
    label: string
    color?: string
    collapsed?: boolean
    description?: string
  }
}

export const GroupBlock: BlockConfig<GroupToolResponse> = {
  type: 'group',
  name: 'Group',
  description: 'Visually group related blocks.',
  longDescription:
    'Create visual groupings in the canvas to organise complex workflows. Groups support labels, colour accents, and collapsed states.',
  category: 'blocks',
  bgColor: '#57606F',
  icon: ComponentIcon,
  subBlocks: [
    {
      id: 'label',
      title: 'Label',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Group name…',
      required: true,
    },
    {
      id: 'description',
      title: 'Description',
      type: 'long-input',
      layout: 'full',
      rows: 3,
    },
    {
      id: 'color',
      title: 'Accent Colour',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Slate', id: '#57606F' },
        { label: 'Purple', id: '#6C5CE7' },
        { label: 'Teal', id: '#0DB67C' },
        { label: 'Orange', id: '#FFA94D' },
        { label: 'Pink', id: '#FF6B81' },
      ],
    },
    {
      id: 'collapsed',
      title: 'Collapsed by default',
      type: 'switch',
      layout: 'half',
    },
  ],
  tools: { access: [] },
  inputs: {
    label: { type: 'string', description: 'Group label' },
    description: { type: 'string', description: 'Group description or notes' },
    color: { type: 'string', description: 'Accent colour' },
    collapsed: { type: 'boolean', description: 'Collapsed state' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the group operation was successful' },
    output: { type: 'json', description: 'The structured output containing group data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    label: { type: 'string', description: 'Group label' },
    description: { type: 'string', description: 'Group description' },
    color: { type: 'string', description: 'Accent colour' },
    collapsed: { type: 'boolean', description: 'Collapsed state' },
  },
}

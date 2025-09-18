import { DocumentIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'

type NoteBlockOutput = {
  content: string
  noteColor: string
  formData?: Record<string, any>
  showDataViz?: boolean
}

export const NoteBlock: BlockConfig<NoteBlockOutput> = {
  type: 'note',
  name: 'Note',
  description: 'Capture rich text notes within your workflow.',
  longDescription:
    'Add persistent notes, form data visualisations, and contextual annotations to your workflow. Notes support variable interpolation and optional data visualisation.',
  category: 'blocks',
  bgColor: '#F5A524',
  icon: DocumentIcon,
  subBlocks: [
    {
      id: 'content',
      title: 'Content',
      type: 'rich-text',
      layout: 'full',
      placeholder: 'Write your note here…',
      wandConfig: {
        enabled: true,
        prompt:
          'You are an expert technical writer. Rewrite the user note, keeping the original meaning but improving clarity and structure. Maintain variables like <variable.name> untouched.',
        maintainHistory: true,
      },
    },
    {
      id: 'noteColor',
      title: 'Theme',
      type: 'dropdown',
      layout: 'half',
      options: [
        { label: 'Sunrise', id: '#F5A524' },
        { label: 'Lagoon', id: '#1E90FF' },
        { label: 'Forest', id: '#0DB67C' },
        { label: 'Grape', id: '#6C5CE7' },
        { label: 'Slate', id: '#57606F' },
        { label: 'Rose', id: '#FF6B81' },
        { label: 'Sand', id: '#E7B980' },
        { label: 'Midnight', id: '#2F3542' },
      ],
      description: 'Pick a background colour for the note.',
      value: () => '#F5A524',
    },
    {
      id: 'showDataViz',
      title: 'Show Data Visualisation',
      type: 'switch',
      layout: 'half',
      description: 'Toggle to render incoming structured data beneath the note.',
    },
  ],
  tools: { access: [] },
  inputs: {
    content: { type: 'string', description: 'Note content' },
    noteColor: { type: 'string', description: 'Note accent colour' },
    formData: { type: 'json', description: 'Incoming form data to visualise' },
    showDataViz: { type: 'boolean', description: 'Toggle data visualisation' },
  },
  outputs: {
    content: { type: 'string', description: 'Note content' },
    noteColor: { type: 'string', description: 'Note accent colour' },
    formData: { type: 'json', description: 'Incoming form data' },
    showDataViz: { type: 'boolean', description: 'Whether to render incoming data' },
  },
}

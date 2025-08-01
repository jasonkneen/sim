import { BrainIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ThinkingToolResponse } from '@/tools/thinking/types'

export const ThinkingBlock: BlockConfig<ThinkingToolResponse> = {
  type: 'thinking',
  name: 'Thinking',
  description: 'Forces model to outline its thought process.',
  longDescription:
    'Adds a step where the model explicitly outlines its thought process before proceeding. This can improve reasoning quality by encouraging step-by-step analysis.',
  docsLink: 'https://docs.sim.ai/tools/thinking',
  category: 'tools',
  bgColor: '#181C1E',
  icon: BrainIcon,
  hideFromToolbar: true,

  subBlocks: [
    {
      id: 'thought',
      title: 'Thought Process / Instruction',
      type: 'long-input',
      layout: 'full',
      placeholder: 'Describe the step-by-step thinking process here...',
      hidden: true,
      required: true,
    },
  ],

  inputs: {
    thought: { type: 'string', description: 'Thinking process instructions' },
  },

  outputs: {
    acknowledgedThought: { type: 'string', description: 'Acknowledged thought process' },
  },

  tools: {
    access: ['thinking_tool'],
  },
}

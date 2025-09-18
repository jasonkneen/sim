import { Sparkles } from 'lucide-react'
import { AgentBlock } from '@/blocks/blocks/agent'
import type { BlockConfig } from '@/blocks/types'

export const SmartBlock: BlockConfig = {
  ...AgentBlock,
  type: 'smart',
  name: 'Smart Node',
  description: 'Conversational node for quick ad-hoc reasoning and summaries.',
  longDescription:
    'Chat with an embedded assistant directly inside your workflow canvas. Messages stay attached to the block, and running the block streams responses through your existing provider settings.',
  bgColor: '#5C6BFF',
  icon: Sparkles,
  subBlocks: [
    {
      id: 'model',
      title: 'Model',
      type: 'short-input',
      layout: 'half',
      hidden: true,
      placeholder: 'gpt-4o-mini',
    },
    {
      id: 'systemPrompt',
      title: 'System Prompt',
      type: 'long-input',
      layout: 'full',
      hidden: true,
      placeholder: 'You are a helpful AI assistant.',
    },
    {
      id: 'temperature',
      title: 'Temperature',
      type: 'slider',
      layout: 'half',
      hidden: true,
      min: 0,
      max: 2,
      step: 0.1,
      integer: false,
    },
    {
      id: 'apiKey',
      title: 'API Key',
      type: 'short-input',
      layout: 'full',
      hidden: true,
      password: true,
      placeholder: 'Enter provider API key',
    },
    {
      id: 'userPrompt',
      title: 'User Prompt',
      type: 'long-input',
      layout: 'full',
      hidden: true,
    },
    {
      id: 'responseFormat',
      title: 'Response Format',
      type: 'response-format',
      layout: 'full',
      hidden: true,
    },
    {
      id: 'tools',
      title: 'Tools',
      type: 'tool-input',
      layout: 'full',
      hidden: true,
    },
    {
      id: 'conversation',
      title: 'Conversation History',
      type: 'long-input',
      layout: 'full',
      hidden: true,
    },
  ],
  tools: AgentBlock.tools,
  inputs: AgentBlock.inputs,
  outputs: AgentBlock.outputs,
}

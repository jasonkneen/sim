import { BrainIcon } from '@/components/icons'
import { providers } from '@/providers/utils'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

interface ModelSelectorToolResponse extends ToolResponse {
  output: {
    provider: string
    model: string
    temperature?: number
    maxTokens?: number
    costEstimate?: number
  }
}

export const ModelSelectorBlock: BlockConfig<ModelSelectorToolResponse> = {
  type: 'model_selector',
  name: 'Model Selector',
  description: 'Pick AI models and tune generation parameters.',
  longDescription:
    'Compare providers, preview costs, and broadcast model configuration to downstream AI blocks.',
  category: 'blocks',
  bgColor: '#FF8C00',
  icon: BrainIcon,
  subBlocks: [
    {
      id: 'provider',
      title: 'Provider',
      type: 'dropdown',
      layout: 'half',
      required: true,
      options: Object.keys(providers).map((provider) => ({ label: provider, id: provider })),
    },
    {
      id: 'model',
      title: 'Model',
      type: 'short-input',
      layout: 'half',
      placeholder: 'gpt-4o-mini',
      required: true,
    },
    {
      id: 'temperature',
      title: 'Temperature',
      type: 'slider',
      layout: 'half',
      min: 0,
      max: 2,
      step: 0.1,
      description: 'Sampling temperature for generative models.',
    },
    {
      id: 'maxTokens',
      title: 'Max Tokens',
      type: 'short-input',
      layout: 'half',
      placeholder: '1024',
    },
    {
      id: 'costEstimate',
      title: 'Cost Estimate (USD)',
      type: 'short-input',
      layout: 'half',
      placeholder: '0.0025',
    },
  ],
  tools: { access: [] },
  inputs: {
    provider: { type: 'string', description: 'Model provider identifier' },
    model: { type: 'string', description: 'Model name' },
    temperature: { type: 'number', description: 'Sampling temperature' },
    maxTokens: { type: 'number', description: 'Token limit' },
    costEstimate: { type: 'number', description: 'Estimated cost per run' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the model selector operation was successful' },
    output: { type: 'json', description: 'The structured output containing model selector data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    provider: { type: 'string', description: 'Selected provider' },
    model: { type: 'string', description: 'Selected model name' },
    temperature: { type: 'number', description: 'Temperature value' },
    maxTokens: { type: 'number', description: 'Max tokens value' },
    costEstimate: { type: 'number', description: 'Cost estimate' },
  },
}

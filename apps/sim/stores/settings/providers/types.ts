export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'local' | 'custom'

export type ModelCapability =
  | 'text'
  | 'vision'
  | 'image-generation'
  | 'function-calling'
  | 'reasoning'

export type ModelPreset = 'thinking' | 'image-generation' | 'vision' | 'coding' | 'general'

export interface Provider {
  id: string
  name: string
  type: ProviderType
  enabled: boolean
  apiKey?: string
  apiKeyEnvVar?: string
  baseUrl?: string
  models: Model[]
  createdAt: string
  updatedAt: string
}

export interface Model {
  id: string
  providerId: string
  name: string
  displayName: string
  capabilities: ModelCapability[]
  contextLength: number
  costPer1kTokens?: number
  enabled: boolean
  presets: ModelPreset[]
  metadata?: Record<string, any>
}

export interface ModelPresetConfig {
  preset: ModelPreset
  name: string
  description: string
  icon: string
  defaultModels: string[]
  requiredCapabilities: ModelCapability[]
}

export interface ProvidersState {
  providers: Provider[]
  models: Model[]
  presetConfigs: ModelPresetConfig[]
  isLoading: boolean
  error: string | null
  isProviderLoading: Record<string, boolean>
}

export interface ProvidersActions {
  // Provider management
  addProvider: (provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
  toggleProvider: (id: string) => Promise<void>

  // Model management
  addModel: (model: Omit<Model, 'id'>) => Promise<void>
  updateModel: (id: string, updates: Partial<Model>) => Promise<void>
  deleteModel: (id: string) => Promise<void>
  toggleModel: (id: string) => Promise<void>

  // Preset management
  getModelsByPreset: (preset: ModelPreset) => Model[]
  assignModelToPreset: (modelId: string, preset: ModelPreset) => Promise<void>
  removeModelFromPreset: (modelId: string, preset: ModelPreset) => Promise<void>

  // Data loading
  loadProviders: (force?: boolean) => Promise<void>
  refreshModels: (providerId?: string) => Promise<void>

  // Utility
  getProvider: (id: string) => Provider | undefined
  getModel: (id: string) => Model | undefined
  getEnabledProviders: () => Provider[]
  getEnabledModels: () => Model[]
}

export type ProvidersStore = ProvidersState & ProvidersActions

// Default provider configurations
export const DEFAULT_PROVIDERS: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'OpenAI',
    type: 'openai',
    enabled: false,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    models: [],
  },
  {
    name: 'Anthropic',
    type: 'anthropic',
    enabled: false,
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com',
    models: [],
  },
  {
    name: 'Google AI',
    type: 'google',
    enabled: false,
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: [],
  },
  {
    name: 'Groq',
    type: 'groq',
    enabled: false,
    apiKeyEnvVar: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [],
  },
]

// Default model preset configurations
export const DEFAULT_PRESET_CONFIGS: ModelPresetConfig[] = [
  {
    preset: 'thinking',
    name: 'Thinking & Reasoning',
    description: 'Models optimized for complex reasoning and problem-solving',
    icon: '🧠',
    defaultModels: ['o1-preview', 'claude-3-5-sonnet'],
    requiredCapabilities: ['text', 'reasoning'],
  },
  {
    preset: 'image-generation',
    name: 'Image Generation',
    description: 'Models capable of generating images from text prompts',
    icon: '🎨',
    defaultModels: ['dall-e-3', 'dall-e-2'],
    requiredCapabilities: ['image-generation'],
  },
  {
    preset: 'vision',
    name: 'Vision & Analysis',
    description: 'Models that can understand and analyze images',
    icon: '👁️',
    defaultModels: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
    requiredCapabilities: ['text', 'vision'],
  },
  {
    preset: 'coding',
    name: 'Code & Development',
    description: 'Models optimized for coding and software development',
    icon: '💻',
    defaultModels: ['gpt-4o', 'claude-3-5-sonnet', 'deepseek-coder'],
    requiredCapabilities: ['text', 'function-calling'],
  },
  {
    preset: 'general',
    name: 'General Purpose',
    description: 'Well-rounded models for general tasks and conversations',
    icon: '⚡',
    defaultModels: ['gpt-4o-mini', 'claude-3-haiku', 'gemma-2-9b'],
    requiredCapabilities: ['text'],
  },
]

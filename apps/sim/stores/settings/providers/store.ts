import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import {
  type ProvidersStore,
  type Provider,
  type Model,
  type ModelPreset,
  DEFAULT_PROVIDERS,
  DEFAULT_PRESET_CONFIGS
} from './types'

const generateId = () => nanoid()

export const useProvidersStore = create<ProvidersStore>()(
  persist(
    (set, get) => ({
      // State
      providers: [],
      models: [],
      presetConfigs: DEFAULT_PRESET_CONFIGS,
      isLoading: false,
      error: null,
      isProviderLoading: {},

      // Provider management
      addProvider: async (providerData) => {
        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          const provider: Provider = {
            ...providerData,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          set((state) => ({
            ...state,
            providers: [...state.providers, provider],
            isLoading: false
          }))

          // Auto-discover models if provider is enabled
          if (provider.enabled) {
            await get().refreshModels(provider.id)
          }
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to add provider',
            isLoading: false
          }))
        }
      },

      updateProvider: async (id, updates) => {
        try {
          set((state) => ({
            ...state,
            isProviderLoading: { ...state.isProviderLoading, [id]: true },
            error: null
          }))

          set((state) => ({
            ...state,
            providers: state.providers.map((provider) =>
              provider.id === id
                ? { ...provider, ...updates, updatedAt: new Date().toISOString() }
                : provider
            ),
            isProviderLoading: { ...state.isProviderLoading, [id]: false }
          }))

          // Refresh models if provider was enabled
          if (updates.enabled) {
            await get().refreshModels(id)
          }
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to update provider',
            isProviderLoading: { ...state.isProviderLoading, [id]: false }
          }))
        }
      },

      deleteProvider: async (id) => {
        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          set((state) => ({
            ...state,
            providers: state.providers.filter((provider) => provider.id !== id),
            models: state.models.filter((model) => model.providerId !== id),
            isLoading: false
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to delete provider',
            isLoading: false
          }))
        }
      },

      toggleProvider: async (id) => {
        const provider = get().getProvider(id)
        if (!provider) return

        await get().updateProvider(id, { enabled: !provider.enabled })
      },

      // Model management
      addModel: async (modelData) => {
        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          const model: Model = {
            ...modelData,
            id: generateId()
          }

          set((state) => ({
            ...state,
            models: [...state.models, model],
            isLoading: false
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to add model',
            isLoading: false
          }))
        }
      },

      updateModel: async (id, updates) => {
        try {
          set((state) => ({ ...state, error: null }))

          set((state) => ({
            ...state,
            models: state.models.map((model) =>
              model.id === id ? { ...model, ...updates } : model
            )
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to update model'
          }))
        }
      },

      deleteModel: async (id) => {
        try {
          set((state) => ({
            ...state,
            models: state.models.filter((model) => model.id !== id)
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to delete model'
          }))
        }
      },

      toggleModel: async (id) => {
        const model = get().getModel(id)
        if (!model) return

        await get().updateModel(id, { enabled: !model.enabled })
      },

      // Preset management
      getModelsByPreset: (preset) => {
        return get().models.filter((model) =>
          model.enabled && model.presets.includes(preset)
        )
      },

      assignModelToPreset: async (modelId, preset) => {
        const model = get().getModel(modelId)
        if (!model) return

        const updatedPresets = [...new Set([...model.presets, preset])]
        await get().updateModel(modelId, { presets: updatedPresets })
      },

      removeModelFromPreset: async (modelId, preset) => {
        const model = get().getModel(modelId)
        if (!model) return

        const updatedPresets = model.presets.filter(p => p !== preset)
        await get().updateModel(modelId, { presets: updatedPresets })
      },

      // Data loading
      loadProviders: async (force = false) => {
        const { providers } = get()

        if (!force && providers.length > 0) return

        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          // Initialize with default providers if none exist
          if (providers.length === 0) {
            const defaultProviders: Provider[] = DEFAULT_PROVIDERS.map(provider => ({
              ...provider,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))

            set((state) => ({
              ...state,
              providers: defaultProviders,
              isLoading: false
            }))
          } else {
            set((state) => ({ ...state, isLoading: false }))
          }
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to load providers',
            isLoading: false
          }))
        }
      },

      refreshModels: async (providerId) => {
        if (!providerId) {
          // Refresh all enabled providers
          const enabledProviders = get().getEnabledProviders()
          for (const provider of enabledProviders) {
            await get().refreshModels(provider.id)
          }
          return
        }

        // TODO: Implement model discovery based on provider type
        // This would typically involve API calls to discover available models
        console.log(`Refreshing models for provider: ${providerId}`)

        // For now, we'll add some default models based on provider type
        const provider = get().getProvider(providerId)
        if (!provider || !provider.enabled) return

        const defaultModels = getDefaultModelsForProvider(provider.type, provider.id)

        for (const modelData of defaultModels) {
          await get().addModel(modelData)
        }
      },

      // Utility functions
      getProvider: (id) => {
        return get().providers.find((provider) => provider.id === id)
      },

      getModel: (id) => {
        return get().models.find((model) => model.id === id)
      },

      getEnabledProviders: () => {
        return get().providers.filter((provider) => provider.enabled)
      },

      getEnabledModels: () => {
        return get().models.filter((model) => model.enabled)
      }
    }),
    {
      name: 'providers-store',
      partialize: (state) => ({
        providers: state.providers,
        models: state.models,
        presetConfigs: state.presetConfigs
      })
    }
  )
)

// Helper function to get default models for a provider
function getDefaultModelsForProvider(providerType: string, providerId: string): Omit<Model, 'id'>[] {
  switch (providerType) {
    case 'openai':
      return [
        {
          providerId,
          name: 'gpt-4o',
          displayName: 'GPT-4o',
          capabilities: ['text', 'vision', 'function-calling'],
          contextLength: 128000,
          enabled: true,
          presets: ['vision', 'coding', 'general']
        },
        {
          providerId,
          name: 'gpt-4o-mini',
          displayName: 'GPT-4o Mini',
          capabilities: ['text', 'vision', 'function-calling'],
          contextLength: 128000,
          enabled: true,
          presets: ['general']
        },
        {
          providerId,
          name: 'o1-preview',
          displayName: 'o1 Preview',
          capabilities: ['text', 'reasoning'],
          contextLength: 128000,
          enabled: true,
          presets: ['thinking']
        },
        {
          providerId,
          name: 'dall-e-3',
          displayName: 'DALL-E 3',
          capabilities: ['image-generation'],
          contextLength: 0,
          enabled: true,
          presets: ['image-generation']
        }
      ]

    case 'anthropic':
      return [
        {
          providerId,
          name: 'claude-3-5-sonnet-20241022',
          displayName: 'Claude 3.5 Sonnet',
          capabilities: ['text', 'vision', 'function-calling'],
          contextLength: 200000,
          enabled: true,
          presets: ['thinking', 'vision', 'coding', 'general']
        },
        {
          providerId,
          name: 'claude-3-haiku-20240307',
          displayName: 'Claude 3 Haiku',
          capabilities: ['text', 'vision'],
          contextLength: 200000,
          enabled: true,
          presets: ['general']
        }
      ]

    case 'google':
      return [
        {
          providerId,
          name: 'gemini-1.5-pro',
          displayName: 'Gemini 1.5 Pro',
          capabilities: ['text', 'vision', 'function-calling'],
          contextLength: 1000000,
          enabled: true,
          presets: ['vision', 'coding', 'general']
        },
        {
          providerId,
          name: 'gemini-1.5-flash',
          displayName: 'Gemini 1.5 Flash',
          capabilities: ['text', 'vision', 'function-calling'],
          contextLength: 1000000,
          enabled: true,
          presets: ['general']
        }
      ]

    default:
      return []
  }
}
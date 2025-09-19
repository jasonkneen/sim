import { useEffect, useState } from 'react'
import { AlertTriangle, Brain, Code, Eye, Palette, Search, Settings, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useProvidersStore } from '@/stores/settings/providers/store'
import type { Model, ModelCapability, ModelPreset } from '@/stores/settings/providers/types'

const PRESET_ICONS: Record<
  ModelPreset,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  thinking: { icon: Brain, color: 'text-purple-600' },
  'image-generation': { icon: Palette, color: 'text-pink-600' },
  vision: { icon: Eye, color: 'text-blue-600' },
  coding: { icon: Code, color: 'text-green-600' },
  general: { icon: Zap, color: 'text-yellow-600' },
}

const CAPABILITY_LABELS: Record<ModelCapability, string> = {
  text: 'Text',
  vision: 'Vision',
  'image-generation': 'Image Gen',
  'function-calling': 'Functions',
  reasoning: 'Reasoning',
}

export function Models() {
  const [retryCount, setRetryCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [selectedPreset, setSelectedPreset] = useState<ModelPreset | 'all'>('all')

  const {
    providers,
    models,
    presetConfigs,
    isLoading,
    error,
    loadProviders,
    toggleModel,
    assignModelToPreset,
    removeModelFromPreset,
    getModelsByPreset,
    getEnabledProviders,
  } = useProvidersStore()

  useEffect(() => {
    loadProviders(retryCount > 0)
  }, [loadProviders, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const enabledProviders = getEnabledProviders()

  // Filter models based on search and filters
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProvider = selectedProvider === 'all' || model.providerId === selectedProvider

    const matchesPreset =
      selectedPreset === 'all' || (selectedPreset && model.presets.includes(selectedPreset))

    return matchesSearch && matchesProvider && matchesPreset
  })

  const handleModelToggle = async (modelId: string) => {
    await toggleModel(modelId)
  }

  const handlePresetToggle = async (modelId: string, preset: ModelPreset) => {
    const model = models.find((m) => m.id === modelId)
    if (!model) return

    if (model.presets.includes(preset)) {
      await removeModelFromPreset(modelId, preset)
    } else {
      await assignModelToPreset(modelId, preset)
    }
  }

  return (
    <div className='space-y-6 p-6'>
      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between'>
            <span>Failed to load models: {error}</span>
            <Button variant='outline' size='sm' onClick={handleRetry} disabled={isLoading}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className='font-medium text-lg'>Models & Presets</h2>
        <p className='mt-1 text-muted-foreground text-sm'>
          Configure model availability and organize them into presets for different use cases
        </p>
      </div>

      <Tabs defaultValue='models' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='models'>Models</TabsTrigger>
          <TabsTrigger value='presets'>Presets</TabsTrigger>
        </TabsList>

        <TabsContent value='models' className='space-y-4'>
          {/* Search and Filters */}
          <div className='flex gap-4'>
            <div className='relative flex-1'>
              <Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground' />
              <Input
                placeholder='Search models...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='All providers' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All providers</SelectItem>
                {enabledProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPreset}
              onValueChange={(value) => setSelectedPreset(value as ModelPreset | 'all')}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='All presets' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All presets</SelectItem>
                {presetConfigs.map((preset) => (
                  <SelectItem key={preset.preset} value={preset.preset}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Models List */}
          <div className='space-y-3'>
            {isLoading ? (
              <>
                <ModelSkeleton />
                <ModelSkeleton />
                <ModelSkeleton />
              </>
            ) : filteredModels.length === 0 ? (
              <div className='py-8 text-center'>
                <Settings className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='font-medium text-lg'>No models found</h3>
                <p className='mb-4 text-muted-foreground'>
                  {models.length === 0
                    ? 'Enable providers to discover available models'
                    : 'Try adjusting your search or filters'}
                </p>
                {models.length === 0 && (
                  <Button variant='outline' onClick={() => {}}>
                    Configure Providers
                  </Button>
                )}
              </div>
            ) : (
              filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  provider={providers.find((p) => p.id === model.providerId)}
                  presetConfigs={presetConfigs}
                  onToggle={() => handleModelToggle(model.id)}
                  onPresetToggle={(preset) => handlePresetToggle(model.id, preset)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value='presets' className='space-y-4'>
          <div className='grid gap-4'>
            {presetConfigs.map((preset) => (
              <PresetCard
                key={preset.preset}
                preset={preset}
                models={getModelsByPreset(preset.preset)}
                providers={providers}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ModelCardProps {
  model: Model
  provider?: any
  presetConfigs: any[]
  onToggle: () => void
  onPresetToggle: (preset: ModelPreset) => void
}

function ModelCard({ model, provider, presetConfigs, onToggle, onPresetToggle }: ModelCardProps) {
  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <h3 className='font-medium'>{model.displayName}</h3>
              {provider && <Badge variant='outline'>{provider.name}</Badge>}
              {model.enabled && (
                <Badge variant='outline' className='border-green-600 text-green-600'>
                  Active
                </Badge>
              )}
            </div>
            <div className='mt-1 flex items-center gap-2'>
              <span className='text-muted-foreground text-xs'>{model.name}</span>
              <span className='text-muted-foreground text-xs'>•</span>
              <span className='text-muted-foreground text-xs'>
                {model.contextLength.toLocaleString()} tokens
              </span>
            </div>
          </div>
        </div>
        <Switch checked={model.enabled} onCheckedChange={onToggle} />
      </div>

      {/* Capabilities */}
      <div className='flex flex-wrap gap-1'>
        {model.capabilities.map((capability) => (
          <Badge key={capability} variant='secondary' className='text-xs'>
            {CAPABILITY_LABELS[capability]}
          </Badge>
        ))}
      </div>

      {/* Presets */}
      <div className='space-y-2'>
        <Label className='font-medium text-sm'>Presets</Label>
        <div className='flex flex-wrap gap-2'>
          {presetConfigs.map((preset) => {
            const isAssigned = model.presets.includes(preset.preset)
            const IconComponent = PRESET_ICONS[preset.preset as ModelPreset]?.icon

            return (
              <Tooltip key={preset.preset}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isAssigned ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => onPresetToggle(preset.preset)}
                    className={`h-8 ${isAssigned ? '' : 'text-muted-foreground'}`}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`mr-1 h-3 w-3 ${isAssigned ? '' : PRESET_ICONS[preset.preset as ModelPreset]?.color}`}
                      />
                    )}
                    {preset.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{preset.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface PresetCardProps {
  preset: any
  models: Model[]
  providers: any[]
}

function PresetCard({ preset, models, providers }: PresetCardProps) {
  const IconComponent = PRESET_ICONS[preset.preset as ModelPreset]?.icon

  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='flex items-center gap-3'>
        {IconComponent && (
          <div
            className={`rounded-lg bg-muted p-2 ${PRESET_ICONS[preset.preset as ModelPreset]?.color}`}
          >
            <IconComponent className='h-5 w-5' />
          </div>
        )}
        <div className='flex-1'>
          <h3 className='font-medium'>{preset.name}</h3>
          <p className='text-muted-foreground text-sm'>{preset.description}</p>
        </div>
        <Badge variant='outline'>
          {models.length} model{models.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {models.length > 0 && (
        <>
          <Separator />
          <div className='space-y-2'>
            {models.map((model) => {
              const provider = providers.find((p) => p.id === model.providerId)
              return (
                <div key={model.id} className='flex items-center justify-between py-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm'>{model.displayName}</span>
                    {provider && (
                      <Badge variant='outline' className='text-xs'>
                        {provider.name}
                      </Badge>
                    )}
                  </div>
                  <div className='flex items-center gap-1'>
                    {model.capabilities.map((capability) => (
                      <Badge key={capability} variant='secondary' className='text-xs'>
                        {CAPABILITY_LABELS[capability]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {models.length === 0 && (
        <div className='py-4 text-center text-muted-foreground'>
          <p className='text-sm'>No models assigned to this preset</p>
        </div>
      )}
    </div>
  )
}

const ModelSkeleton = () => (
  <div className='space-y-3 rounded-lg border p-4'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <Skeleton className='h-6 w-12' />
    </div>
    <div className='flex gap-2'>
      <Skeleton className='h-6 w-16' />
      <Skeleton className='h-6 w-20' />
      <Skeleton className='h-6 w-14' />
    </div>
    <div className='space-y-2'>
      <Skeleton className='h-4 w-16' />
      <div className='flex gap-2'>
        <Skeleton className='h-8 w-24' />
        <Skeleton className='h-8 w-20' />
        <Skeleton className='h-8 w-18' />
      </div>
    </div>
  </div>
)

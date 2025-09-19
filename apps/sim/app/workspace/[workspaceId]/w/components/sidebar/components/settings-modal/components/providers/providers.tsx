import { useEffect, useState } from 'react'
import { AlertTriangle, Eye, EyeOff, Key, Plus, Server, Settings, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useProvidersStore } from '@/stores/settings/providers/store'
import type { Provider, ProviderType } from '@/stores/settings/providers/types'

const PROVIDER_TYPES: { value: ProviderType; label: string; description: string }[] = [
  { value: 'openai', label: 'OpenAI', description: 'ChatGPT, GPT-4, DALL-E' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude models' },
  { value: 'google', label: 'Google AI', description: 'Gemini models' },
  { value: 'groq', label: 'Groq', description: 'Fast inference' },
  { value: 'local', label: 'Local', description: 'Local models' },
  { value: 'custom', label: 'Custom', description: 'Custom API endpoint' },
]

export function Providers() {
  const [retryCount, setRetryCount] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

  const {
    providers,
    isLoading,
    error,
    isProviderLoading,
    addProvider,
    updateProvider,
    deleteProvider,
    toggleProvider,
    loadProviders,
  } = useProvidersStore()

  useEffect(() => {
    loadProviders(retryCount > 0)
  }, [loadProviders, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [providerId]: !prev[providerId],
    }))
  }

  const handleProviderToggle = async (providerId: string) => {
    await toggleProvider(providerId)
  }

  const handleUpdateApiKey = async (providerId: string, apiKey: string) => {
    await updateProvider(providerId, { apiKey })
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm('Are you sure you want to delete this provider?')) {
      await deleteProvider(providerId)
    }
  }

  return (
    <div className='space-y-6 p-6'>
      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between'>
            <span>Failed to load providers: {error}</span>
            <Button variant='outline' size='sm' onClick={handleRetry} disabled={isLoading}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className='flex items-center justify-between'>
        <div>
          <h2 className='font-medium text-lg'>AI Providers</h2>
          <p className='mt-1 text-muted-foreground text-sm'>
            Configure AI model providers and API keys
          </p>
        </div>
        <AddProviderDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={addProvider}
        />
      </div>

      <div className='space-y-4'>
        {isLoading ? (
          <>
            <ProviderSkeleton />
            <ProviderSkeleton />
            <ProviderSkeleton />
          </>
        ) : providers.length === 0 ? (
          <div className='py-8 text-center'>
            <Server className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='font-medium text-lg'>No providers configured</h3>
            <p className='mb-4 text-muted-foreground'>
              Add AI providers to start using models in your workflows
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Add Provider
            </Button>
          </div>
        ) : (
          providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isLoading={isProviderLoading[provider.id] || false}
              showApiKey={showApiKeys[provider.id] || false}
              onToggle={() => handleProviderToggle(provider.id)}
              onToggleApiKeyVisibility={() => toggleApiKeyVisibility(provider.id)}
              onUpdateApiKey={(apiKey) => handleUpdateApiKey(provider.id, apiKey)}
              onDelete={() => handleDeleteProvider(provider.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ProviderCardProps {
  provider: Provider
  isLoading: boolean
  showApiKey: boolean
  onToggle: () => void
  onToggleApiKeyVisibility: () => void
  onUpdateApiKey: (apiKey: string) => void
  onDelete: () => void
}

function ProviderCard({
  provider,
  isLoading,
  showApiKey,
  onToggle,
  onToggleApiKeyVisibility,
  onUpdateApiKey,
  onDelete,
}: ProviderCardProps) {
  const [apiKeyInput, setApiKeyInput] = useState(provider.apiKey || '')

  const handleApiKeyChange = (value: string) => {
    setApiKeyInput(value)
    onUpdateApiKey(value)
  }

  const providerType = PROVIDER_TYPES.find((type) => type.value === provider.type)

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <h3 className='font-medium'>{provider.name}</h3>
              <Badge variant='secondary'>{providerType?.label}</Badge>
              {provider.enabled && (
                <Badge variant='outline' className='border-green-600 text-green-600'>
                  Active
                </Badge>
              )}
            </div>
            <p className='text-muted-foreground text-sm'>{providerType?.description}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={onDelete}
                className='text-destructive hover:text-destructive'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete provider</TooltipContent>
          </Tooltip>
          <Switch checked={provider.enabled} onCheckedChange={onToggle} disabled={isLoading} />
        </div>
      </div>

      <Separator />

      <div className='space-y-3'>
        {/* API Key Configuration */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Label htmlFor={`apikey-${provider.id}`} className='font-medium text-sm'>
              API Key
            </Label>
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggleApiKeyVisibility}
              className='h-6 w-6 p-0'
            >
              {showApiKey ? <EyeOff className='h-3 w-3' /> : <Eye className='h-3 w-3' />}
            </Button>
          </div>
          <div className='flex gap-2'>
            <Input
              id={`apikey-${provider.id}`}
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={
                provider.apiKeyEnvVar
                  ? `${provider.apiKeyEnvVar} or enter manually`
                  : 'Enter API key'
              }
              className='flex-1'
            />
            {provider.apiKeyEnvVar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant='outline' size='sm' className='flex-shrink-0'>
                    <Key className='mr-1 h-3 w-3' />
                    ENV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Can be set via {provider.apiKeyEnvVar} environment variable
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Base URL for custom providers */}
        {(provider.type === 'custom' || provider.type === 'local') && (
          <div className='space-y-2'>
            <Label htmlFor={`baseurl-${provider.id}`} className='font-medium text-sm'>
              Base URL
            </Label>
            <Input
              id={`baseurl-${provider.id}`}
              value={provider.baseUrl || ''}
              onChange={(e) => onUpdateApiKey(e.target.value)} // TODO: Implement base URL update
              placeholder='https://api.example.com/v1'
            />
          </div>
        )}

        {/* Models count */}
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>
            {provider.models.length} model{provider.models.length !== 1 ? 's' : ''} available
          </span>
          {provider.enabled && (
            <Button variant='outline' size='sm'>
              <Settings className='mr-1 h-3 w-3' />
              Configure Models
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface AddProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

function AddProviderDialog({ open, onOpenChange, onAdd }: AddProviderDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'openai' as ProviderType,
    baseUrl: '',
    apiKey: '',
    enabled: false,
  })

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    await onAdd({
      name: formData.name,
      type: formData.type,
      baseUrl: formData.baseUrl || undefined,
      apiKey: formData.apiKey || undefined,
      enabled: formData.enabled,
      models: [],
    })

    setFormData({
      name: '',
      type: 'openai',
      baseUrl: '',
      apiKey: '',
      enabled: false,
    })
    onOpenChange(false)
  }

  const selectedType = PROVIDER_TYPES.find((type) => type.value === formData.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Add Provider
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add AI Provider</DialogTitle>
          <DialogDescription>Configure a new AI model provider</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='provider-type'>Provider Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ProviderType) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className='flex flex-col'>
                      <span>{type.label}</span>
                      <span className='text-muted-foreground text-xs'>{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='provider-name'>Name</Label>
            <Input
              id='provider-name'
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={selectedType?.label || 'Provider name'}
            />
          </div>

          {(formData.type === 'custom' || formData.type === 'local') && (
            <div className='space-y-2'>
              <Label htmlFor='provider-baseurl'>Base URL</Label>
              <Input
                id='provider-baseurl'
                value={formData.baseUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder='https://api.example.com/v1'
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='provider-apikey'>API Key (Optional)</Label>
            <Input
              id='provider-apikey'
              type='password'
              value={formData.apiKey}
              onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder='Can be set later or via environment variable'
            />
          </div>

          <div className='flex items-center space-x-2'>
            <Switch
              id='provider-enabled'
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor='provider-enabled'>Enable immediately</Label>
          </div>
        </div>

        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            Add Provider
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ProviderSkeleton = () => (
  <div className='space-y-4 rounded-lg border p-4'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <Skeleton className='h-6 w-12' />
    </div>
    <Separator />
    <div className='space-y-3'>
      <Skeleton className='h-4 w-20' />
      <Skeleton className='h-10 w-full' />
    </div>
  </div>
)

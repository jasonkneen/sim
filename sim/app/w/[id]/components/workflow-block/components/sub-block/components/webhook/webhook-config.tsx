import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import {
  AirtableIcon,
  DiscordIcon,
  GithubIcon,
  SlackIcon,
  StripeIcon,
  WhatsAppIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { createLogger } from '@/lib/logs/console-logger'
import { useSubBlockValue } from '../../hooks/use-sub-block-value'
import { WebhookModal } from './components/webhook-modal'

const logger = createLogger('WebhookConfig')

export interface WebhookProvider {
  id: string
  name: string
  icon: (props: { className?: string }) => React.ReactNode
  configFields: {
    [key: string]: {
      type: 'string' | 'boolean' | 'select'
      label: string
      placeholder?: string
      options?: string[]
      defaultValue?: string | boolean
      description?: string
    }
  }
}

// Define provider-specific configuration types
export interface WhatsAppConfig {
  verificationToken: string
}

export interface GitHubConfig {
  contentType: string
}

export interface DiscordConfig {
  webhookName?: string
  avatarUrl?: string
}

export interface StripeConfig {
  // Any Stripe-specific fields would go here
}

export interface GeneralWebhookConfig {
  token?: string
  secretHeaderName?: string
  requireAuth?: boolean
  allowedIps?: string[]
}

export interface SlackConfig {
  signingSecret: string
}

// Define Airtable-specific configuration type
export interface AirtableWebhookConfig {
  baseId: string
  tableId: string
  externalId?: string // To store the ID returned by Airtable
  includeCellValuesInFieldIds?: 'all' | undefined
}

// Union type for all provider configurations
export type ProviderConfig =
  | WhatsAppConfig
  | GitHubConfig
  | DiscordConfig
  | StripeConfig
  | GeneralWebhookConfig
  | SlackConfig
  | AirtableWebhookConfig
  | Record<string, never>

// Define available webhook providers
export const WEBHOOK_PROVIDERS: { [key: string]: WebhookProvider } = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: (props) => <WhatsAppIcon {...props} />,
    configFields: {
      verificationToken: {
        type: 'string',
        label: 'Verification Token',
        placeholder: 'Enter a verification token for WhatsApp',
        description: 'This token will be used to verify your webhook with WhatsApp.',
      },
    },
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: (props) => <GithubIcon {...props} />,
    configFields: {
      contentType: {
        type: 'string',
        label: 'Content Type',
        placeholder: 'application/json',
        defaultValue: 'application/json',
        description: 'The content type for GitHub webhook payloads.',
      },
    },
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: (props) => <DiscordIcon {...props} />,
    configFields: {
      webhookName: {
        type: 'string',
        label: 'Webhook Name',
        placeholder: 'Enter a name for the webhook',
        description: 'Custom name that will appear as the message sender in Discord.',
      },
      avatarUrl: {
        type: 'string',
        label: 'Avatar URL',
        placeholder: 'https://example.com/avatar.png',
        description: 'URL to an image that will be used as the webhook avatar.',
      },
    },
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    icon: (props) => <StripeIcon {...props} />,
    configFields: {},
  },
  generic: {
    id: 'generic',
    name: 'General',
    icon: (props) => <CheckCircle2 {...props} />,
    configFields: {
      token: {
        type: 'string',
        label: 'Authentication Token',
        placeholder: 'Enter an auth token (optional)',
        description:
          'This token will be used to authenticate webhook requests via Bearer token authentication.',
      },
      secretHeaderName: {
        type: 'string',
        label: 'Secret Header Name',
        placeholder: 'X-Secret-Key',
        description: 'Custom HTTP header name for authentication (optional).',
      },
      requireAuth: {
        type: 'boolean',
        label: 'Require Authentication',
        defaultValue: false,
        description: 'Require authentication for all webhook requests.',
      },
      allowedIps: {
        type: 'string',
        label: 'Allowed IP Addresses',
        placeholder: '10.0.0.1, 192.168.1.1',
        description: 'Comma-separated list of allowed IP addresses (optional).',
      },
    },
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    icon: (props) => <SlackIcon {...props} />,
    configFields: {
      signingSecret: {
        type: 'string',
        label: 'Signing Secret',
        placeholder: 'Enter your Slack app signing secret',
        description: 'The signing secret from your Slack app to validate request authenticity.',
      },
    },
  },
  airtable: {
    id: 'airtable',
    name: 'Airtable',
    icon: (props) => <AirtableIcon {...props} />,
    configFields: {
      baseId: {
        type: 'string',
        label: 'Base ID',
        placeholder: 'appXXXXXXXXXXXXXX',
        description: 'The ID of the Airtable Base the webhook should monitor.',
        defaultValue: '', // Default empty, user must provide
      },
      tableId: {
        type: 'string',
        label: 'Table ID',
        placeholder: 'tblXXXXXXXXXXXXXX',
        description: 'The ID of the Airtable Table within the Base to monitor.',
        defaultValue: '', // Default empty, user must provide
      },
    },
  },
}

interface WebhookConfigProps {
  blockId: string
  subBlockId?: string
  isConnecting: boolean
}

export function WebhookConfig({ blockId, subBlockId, isConnecting }: WebhookConfigProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [webhookId, setWebhookId] = useState<string | null>(null)
  const params = useParams()
  const workflowId = params.id as string

  // Get the webhook provider from the block state
  const [webhookProvider, setWebhookProvider] = useSubBlockValue(blockId, 'webhookProvider')

  // Store the webhook path
  const [webhookPath, setWebhookPath] = useSubBlockValue(blockId, 'webhookPath')

  // Store provider-specific configuration
  const [providerConfig, setProviderConfig] = useSubBlockValue(blockId, 'providerConfig')

  // Store the actual provider from the database
  const [actualProvider, setActualProvider] = useState<string | null>(null)

  // Check if webhook exists in the database
  useEffect(() => {
    const checkWebhook = async () => {
      try {
        // Check if there's a webhook for this workflow
        const response = await fetch(`/api/webhooks?workflowId=${workflowId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.webhooks && data.webhooks.length > 0) {
            const webhook = data.webhooks[0].webhook
            setWebhookId(webhook.id)

            // Update the provider in the block state if it's different
            if (webhook.provider && webhook.provider !== webhookProvider) {
              setWebhookProvider(webhook.provider)
            }

            // Store the actual provider from the database
            setActualProvider(webhook.provider)

            // Update the path in the block state if it's different
            if (webhook.path && webhook.path !== webhookPath) {
              setWebhookPath(webhook.path)
            }
          } else {
            setWebhookId(null)
            setActualProvider(null)
          }
        }
      } catch (error) {
        logger.error('Error checking webhook:', { error })
      }
    }

    checkWebhook()
  }, [webhookPath, webhookProvider, workflowId, setWebhookPath, setWebhookProvider])

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setError(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSaveWebhook = async (path: string, config: ProviderConfig) => {
    try {
      setIsSaving(true)
      setError(null)

      // Set the webhook path in the block state
      if (path && path !== webhookPath) {
        setWebhookPath(path)
      }

      // Set the provider config in the block state
      setProviderConfig(config)

      // Save the webhook to the database
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          path,
          provider: webhookProvider || 'generic',
          providerConfig: config,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          typeof errorData.error === 'object'
            ? errorData.error.message || JSON.stringify(errorData.error)
            : errorData.error || 'Failed to save webhook'
        )
      }

      const data = await response.json()
      setWebhookId(data.webhook.id)

      // Update the actual provider after saving
      setActualProvider(webhookProvider || 'generic')

      return true
    } catch (error: any) {
      logger.error('Error saving webhook:', { error })
      setError(error.message || 'Failed to save webhook configuration')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWebhook = async () => {
    if (!webhookId) return false

    try {
      setIsDeleting(true)
      setError(null)

      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete webhook')
      }

      // Clear the webhook ID and actual provider
      setWebhookId(null)
      setActualProvider(null)

      return true
    } catch (error: any) {
      logger.error('Error deleting webhook:', { error })
      setError(error.message || 'Failed to delete webhook')
      return false
    } finally {
      setIsDeleting(false)
    }
  }

  // Get provider icon based on the current provider
  const getProviderIcon = () => {
    // Only show provider icon if the webhook is connected and the selected provider matches the actual provider
    if (!webhookId || webhookProvider !== actualProvider) {
      return null
    }

    const provider = WEBHOOK_PROVIDERS[webhookProvider || 'generic']
    return provider.icon({
      className: 'h-4 w-4 mr-2 text-green-500 dark:text-green-400',
    })
  }

  // Check if the webhook is connected for the selected provider
  const isWebhookConnected = webhookId && webhookProvider === actualProvider

  return (
    <div className="mt-2">
      {error && <div className="text-sm text-red-500 dark:text-red-400 mb-2">{error}</div>}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleOpenModal}
        disabled={isConnecting || isSaving || isDeleting}
      >
        {isWebhookConnected ? (
          <>
            {getProviderIcon()}
            {isSaving ? 'Saving...' : isDeleting ? 'Deleting...' : 'Webhook Connected'}
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : isDeleting ? 'Deleting...' : 'Configure Webhook'}
          </>
        )}
      </Button>

      {isModalOpen && (
        <WebhookModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          webhookPath={webhookPath || ''}
          webhookProvider={webhookProvider || 'generic'}
          onSave={handleSaveWebhook}
          onDelete={handleDeleteWebhook}
          webhookId={webhookId || undefined}
        />
      )}
    </div>
  )
}

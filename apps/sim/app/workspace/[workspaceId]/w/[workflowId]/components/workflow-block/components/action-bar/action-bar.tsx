import {
  AlarmClock,
  ArrowLeftRight,
  ArrowUpDown,
  BookOpen,
  Circle,
  CircleOff,
  Copy,
  Info,
  RectangleHorizontal,
  RectangleVertical,
  Trash2,
  Webhook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUserPermissionsContext } from '@/app/workspace/[workspaceId]/components/providers/workspace-permissions-provider'
import { useCollaborativeWorkflow } from '@/hooks/use-collaborative-workflow'
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import type { BlockConfig } from '@/blocks/types'

interface ActionBarProps {
  blockId: string
  blockType: string
  config: BlockConfig
  blockAdvancedMode: boolean
  showTitleOptionsInToolbar: boolean
  shouldShowScheduleBadge?: boolean
  scheduleInfo?: {
    id?: string
    isDisabled?: boolean
  }
  onDisableSchedule?: (scheduleId: string) => void | Promise<void>
  onReactivateSchedule?: (scheduleId: string) => void | Promise<void>
  showWebhookIndicator?: boolean
  webhookInfo?: {
    provider: string
    webhookPath: string
  }
  isWide: boolean
  disabled?: boolean
}

export function ActionBar({
  blockId,
  blockType,
  config,
  blockAdvancedMode,
  showTitleOptionsInToolbar = false,
  shouldShowScheduleBadge = false,
  scheduleInfo,
  onDisableSchedule,
  onReactivateSchedule,
  showWebhookIndicator = false,
  webhookInfo,
  isWide,
  disabled = false,
}: ActionBarProps) {
  const {
    collaborativeRemoveBlock,
    collaborativeToggleBlockEnabled,
    collaborativeDuplicateBlock,
    collaborativeToggleBlockHandles,
    collaborativeToggleBlockAdvancedMode,
    collaborativeToggleBlockWide,
  } = useCollaborativeWorkflow()
  const isEnabled = useWorkflowStore((state) => state.blocks[blockId]?.enabled ?? true)
  const horizontalHandles = useWorkflowStore(
    (state) => state.blocks[blockId]?.horizontalHandles ?? false
  )
  const userPermissions = useUserPermissionsContext()

  const isStarterBlock = blockType === 'starter'

  const getTooltipMessage = (defaultMessage: string) => {
    if (disabled) {
      return userPermissions.isOfflineMode ? 'Connection lost - please refresh' : 'Read-only mode'
    }
    return defaultMessage
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+8px)]',
        'z-30 flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'rounded-full border border-gray-200 bg-background shadow-sm dark:border-gray-800',
        'opacity-0 transition-opacity duration-200 group-hover:opacity-100'
      )}
    >
      {/* <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              isEnabled
                ? 'bg-[#802FFF] hover:bg-[#802FFF]/90'
                : 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
            )}
            size="sm"
            disabled={!isEnabled}
          >
            <Play fill="currentColor" className="!h-3.5 !w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Run Block</TooltipContent>
      </Tooltip> */}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (!disabled) {
                collaborativeToggleBlockEnabled(blockId)
              }
            }}
            className={cn(
              'h-7 w-7 shrink-0 p-0 text-gray-500',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
          >
            {isEnabled ? <Circle className='h-4 w-4' /> : <CircleOff className='h-4 w-4' />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='right'>
          {getTooltipMessage(isEnabled ? 'Disable Block' : 'Enable Block')}
        </TooltipContent>
      </Tooltip>

      {!isStarterBlock && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (!disabled) {
                  collaborativeDuplicateBlock(blockId)
                }
              }}
              className={cn(
                'h-7 w-7 shrink-0 p-0 text-gray-500',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={disabled}
            >
              <Copy className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='right'>{getTooltipMessage('Duplicate Block')}</TooltipContent>
        </Tooltip>
      )}

      {showTitleOptionsInToolbar && (
        <>
          {config.subBlocks.some((block) => block.mode) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    if (!disabled) {
                      collaborativeToggleBlockAdvancedMode(blockId)
                    }
                  }}
                  className={cn(
                    'h-7 w-7 shrink-0 p-0 text-gray-500',
                    blockAdvancedMode && 'text-[#701FFC]',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={disabled}
                >
                  <ArrowLeftRight className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                {getTooltipMessage(blockAdvancedMode ? 'Switch to Basic Mode' : 'Switch to Advanced Mode')}
              </TooltipContent>
            </Tooltip>
          )}

          {config.docsLink ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn(
                    'h-7 w-7 shrink-0 p-0 text-gray-500',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!disabled) {
                      window.open(config.docsLink, '_target', 'noopener,noreferrer')
                    }
                  }}
                >
                  <BookOpen className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>See Docs</TooltipContent>
            </Tooltip>
          ) : (
            config.longDescription && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className={cn(
                      'h-7 w-7 shrink-0 p-0 text-gray-500',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                    disabled={disabled}
                  >
                    <Info className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-[300px] p-4'>
                  <div className='space-y-3'>
                    <div>
                      <p className='mb-1 font-medium text-sm'>Description</p>
                      <p className='text-muted-foreground text-sm'>{config.longDescription}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  if (!disabled) {
                    collaborativeToggleBlockWide(blockId)
                  }
                }}
                className={cn(
                  'h-7 w-7 shrink-0 p-0 text-gray-500',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
                disabled={!userPermissions.canEdit || disabled}
              >
                {isWide ? (
                  <RectangleHorizontal className='h-4 w-4' />
                ) : (
                  <RectangleVertical className='h-4 w-4' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side='right'>
              {getTooltipMessage(isWide ? 'Narrow Block' : 'Expand Block')}
            </TooltipContent>
          </Tooltip>

          {shouldShowScheduleBadge && scheduleInfo?.id && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    if (disabled || !scheduleInfo.id) return
                    if (scheduleInfo.isDisabled) {
                      onReactivateSchedule?.(scheduleInfo.id)
                    } else {
                      onDisableSchedule?.(scheduleInfo.id)
                    }
                  }}
                  className={cn(
                    'h-7 w-7 shrink-0 p-0',
                    scheduleInfo.isDisabled ? 'text-amber-500' : 'text-emerald-500',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={disabled}
                >
                  <AlarmClock className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='right'>
                {scheduleInfo.isDisabled ? 'Enable schedule' : 'Disable schedule'}
              </TooltipContent>
            </Tooltip>
          )}

          {showWebhookIndicator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='flex h-7 w-7 items-center justify-center text-emerald-500'>
                  <Webhook className='h-4 w-4' />
                </div>
              </TooltipTrigger>
              <TooltipContent side='right' className='max-w-[260px] p-3'>
                {webhookInfo ? (
                  <div>
                    <p className='font-medium text-sm'>{webhookInfo.provider}</p>
                    <p className='text-muted-foreground text-xs'>{webhookInfo.webhookPath}</p>
                  </div>
                ) : (
                  <p className='text-sm'>This workflow is triggered by a webhook.</p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (!disabled) {
                collaborativeToggleBlockHandles(blockId)
              }
            }}
            className={cn(
              'h-7 w-7 shrink-0 p-0 text-gray-500',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
          >
            {horizontalHandles ? (
              <ArrowLeftRight className='h-4 w-4' />
            ) : (
              <ArrowUpDown className='h-4 w-4' />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side='right'>
          {getTooltipMessage(horizontalHandles ? 'Vertical Ports' : 'Horizontal Ports')}
        </TooltipContent>
      </Tooltip>

      {!isStarterBlock && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (!disabled) {
                  collaborativeRemoveBlock(blockId)
                }
              }}
              className={cn(
                'h-7 w-7 shrink-0 p-0 text-gray-500 hover:text-red-600',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={disabled}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='right'>{getTooltipMessage('Delete Block')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

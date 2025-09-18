import type { CSSProperties, ComponentType } from 'react'
import { RepeatIcon, SplitIcon } from 'lucide-react'
import {
  type ConnectedBlock,
  useBlockConnections,
} from '@/app/workspace/[workspaceId]/w/[workflowId]/hooks/use-block-connections'
import { getBlock } from '@/blocks'

interface ConnectionBlocksProps {
  blockId: string
  horizontalHandles: boolean
  setIsConnecting: (isConnecting: boolean) => void
  isDisabled?: boolean
}

interface ResponseField {
  name: string
  type: string
  description?: string
}

export function ConnectionBlocks({
  blockId,
  horizontalHandles,
  setIsConnecting,
  isDisabled = false,
}: ConnectionBlocksProps) {
  const { incomingConnections, hasIncomingConnections } = useBlockConnections(blockId)

  if (!hasIncomingConnections) return null

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    connection: ConnectedBlock,
    field?: ResponseField
  ) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }

    e.stopPropagation() // Prevent parent drag handlers from firing
    setIsConnecting(true)

    // If no specific field is provided, use all available output types
    const outputType = field ? field.name : connection.outputType

    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'connectionBlock',
        connectionData: {
          id: connection.id,
          name: connection.name,
          outputType: outputType,
          sourceBlockId: connection.id,
          fieldType: field?.type,
          // Include all available output types for reference
          allOutputTypes: Array.isArray(connection.outputType)
            ? connection.outputType
            : [connection.outputType],
        },
      })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsConnecting(false)
  }

  // Use connections in distance order (already sorted and deduplicated by the hook)
  const sortedConnections = incomingConnections

  // Helper function to render a connection card
  const renderConnectionCard = (connection: ConnectedBlock) => {
    // Get block configuration for icon and color
    const blockConfig = getBlock(connection.type)
    const displayName = connection.name // Use the actual block name instead of transforming it

    // Handle special blocks that aren't in the registry (loop and parallel)
    let Icon = blockConfig?.icon
    const accentColor = blockConfig?.bgColor || '#6B7280'

    if (!blockConfig) {
      if (connection.type === 'loop') {
        return renderChip(connection, RepeatIcon, '#2FB3FF')
      }
      if (connection.type === 'parallel') {
        return renderChip(connection, SplitIcon, '#FEE12B')
      }
    }

    return renderChip(connection, Icon, accentColor)
  }

  function renderChip(
    connection: ConnectedBlock,
    IconComponent: ComponentType<{ className?: string }> | undefined,
    accentColor: string
  ) {
    const displayName = connection.name
    const sharedStyles: CSSProperties = {
      borderColor: accentColor,
      backgroundColor: accentColor,
    }

    const baseClasses =
      'group inline-flex w-max items-center gap-1 rounded-full border bg-card/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-white'

    const enabledClasses =
      'cursor-grab transition-transform active:cursor-grabbing'
    const disabledClasses = 'cursor-not-allowed opacity-50'

    return (
      <div
        key={`${connection.id}-${connection.name}`}
        draggable={!isDisabled}
        onDragStart={(e) => handleDragStart(e, connection)}
        onDragEnd={handleDragEnd}
        className={`${baseClasses} ${isDisabled ? disabledClasses : enabledClasses}`}
        style={sharedStyles}
      >
        {IconComponent && (
          <div
            className='flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full'
            style={{ backgroundColor: accentColor }}
          >
            <IconComponent className='h-2.5 w-2.5 text-white' />
          </div>
        )}
        <span className='leading-none text-white'>
          {displayName.toUpperCase()}
        </span>
      </div>
    )
  }

  // Generate all connection cards - one per block, not per output field
  const connectionCards: React.ReactNode[] = []

  sortedConnections.forEach((connection) => {
    connectionCards.push(renderConnectionCard(connection))
  })

  if (horizontalHandles) {
    return (
      <div className='px-4 pb-3'>
        <div className='flex w-full flex-wrap items-center gap-1.5 pt-2'>{connectionCards}</div>
      </div>
    )
  }

  return (
    <div className='absolute top-0 right-full flex max-h-[400px] max-w-[200px] flex-col items-end gap-1.5 overflow-y-auto pr-3'>
      {connectionCards}
    </div>
  )
}

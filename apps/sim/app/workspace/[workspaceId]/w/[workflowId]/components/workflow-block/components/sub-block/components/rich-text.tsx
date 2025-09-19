import { useMemo } from 'react'
import { useSubBlockValue } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'
import type { SubBlockConfig } from '@/blocks/types'
import { LongInput } from './long-input'

type RichTextInputProps = {
  blockId: string
  subBlockId: string
  placeholder?: string
  isConnecting: boolean
  config: SubBlockConfig
  isPreview?: boolean
  previewValue?: string | null
  disabled?: boolean
}

export function RichTextInput({
  blockId,
  subBlockId,
  placeholder,
  isConnecting,
  config,
  isPreview = false,
  previewValue,
  disabled,
}: RichTextInputProps) {
  const [storeValue] = useSubBlockValue<string>(blockId, subBlockId)
  const content = isPreview ? (previewValue ?? '') : (storeValue ?? '')
  const lineCount = useMemo(() => {
    if (!content) return 0
    return content.split(/\r?\n/).length
  }, [content])

  return (
    <div className='space-y-2'>
      <LongInput
        blockId={blockId}
        subBlockId={subBlockId}
        placeholder={placeholder}
        isConnecting={isConnecting}
        config={config}
        isPreview={isPreview}
        previewValue={previewValue}
        disabled={disabled}
      />
      <div className='flex items-center justify-end text-muted-foreground text-xs'>
        <span>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
      </div>
    </div>
  )
}

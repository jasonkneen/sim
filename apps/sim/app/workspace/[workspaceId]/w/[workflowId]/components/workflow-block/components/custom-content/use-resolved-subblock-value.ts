import { useCallback } from 'react'
import { useSubBlockValue } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'

type PreviewValueRecord = Record<string, { value: unknown }>

interface UseResolvedSubBlockValueOptions {
  isPreview?: boolean
  previewValues?: PreviewValueRecord
}

export function useResolvedSubBlockValue<T>(
  blockId: string,
  subBlockId: string,
  { isPreview, previewValues }: UseResolvedSubBlockValueOptions = {}
): readonly [T | null, (value: T) => void] {
  const [storeValue, setStoreValue] = useSubBlockValue<T>(blockId, subBlockId)

  const previewValue = isPreview
    ? (previewValues?.[subBlockId]?.value as T | null | undefined)
    : undefined
  const resolvedValue = isPreview ? (previewValue ?? null) : (storeValue ?? null)

  const setValue = useCallback(
    (next: T) => {
      if (isPreview) return
      setStoreValue(next)
    },
    [isPreview, setStoreValue]
  )

  return [resolvedValue, setValue] as const
}

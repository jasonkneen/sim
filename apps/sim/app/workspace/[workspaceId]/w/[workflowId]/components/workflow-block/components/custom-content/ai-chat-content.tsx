'use client'

import { useMemo } from 'react'
import { MessageCircle, Sparkles, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/panel/chat/store'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface ChatMessage {
  id: string
  content: string | any
  workflowId: string
  type: 'user' | 'workflow'
  timestamp: string
  blockId?: string
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown time'
  return date.toLocaleString()
}

export function AIChatContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const params = useParams()
  const workflowId = params?.workflowId as string | undefined

  const [model] = useResolvedSubBlockValue<string>(blockId, 'model', {
    isPreview,
    previewValues,
  })
  const [systemPrompt] = useResolvedSubBlockValue<string>(blockId, 'systemPrompt', {
    isPreview,
    previewValues,
  })
  const [userPrompt] = useResolvedSubBlockValue<string>(blockId, 'userPrompt', {
    isPreview,
    previewValues,
  })

  const messages = useChatStore((state) => state.messages)
  const conversation = useMemo(() => {
    if (!workflowId) return []
    return messages
      .filter(
        (message) =>
          message.workflowId === workflowId && (!message.blockId || message.blockId === blockId)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [blockId, messages, workflowId])

  return (
    <div className='space-y-3 rounded-lg border border-border/70 bg-card/50 p-4'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide'>
          <MessageCircle className='h-3.5 w-3.5' />
          <span>Conversation</span>
          {model && <Badge variant='outline'>{model}</Badge>}
        </div>
        {(systemPrompt || userPrompt) && (
          <div className='rounded-md border border-border/60 bg-background/70 p-3 text-muted-foreground text-xs'>
            {systemPrompt && (
              <div className='mb-2'>
                <p className='mb-1 font-semibold text-foreground/70 uppercase tracking-wide'>
                  System prompt
                </p>
                <p className='whitespace-pre-wrap leading-relaxed'>{systemPrompt}</p>
              </div>
            )}
            {userPrompt && (
              <div>
                <p className='mb-1 font-semibold text-foreground/70 uppercase tracking-wide'>
                  Starter message
                </p>
                <p className='whitespace-pre-wrap leading-relaxed'>{userPrompt}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {conversation.length === 0 ? (
        <div className='rounded-md border border-border/70 border-dashed bg-muted/30 p-4 text-muted-foreground text-sm'>
          Run the workflow to populate conversation history from this agent.
        </div>
      ) : (
        <ScrollArea className='max-h-60 rounded-md border border-border/60 bg-background/50'>
          <div className='space-y-3 p-3'>
            {conversation.map((message: ChatMessage) => {
              const isUser = message.type === 'user'
              const content =
                typeof message.content === 'string'
                  ? message.content
                  : JSON.stringify(message.content, null, 2)
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1 rounded-lg border border-border/40 p-3 text-sm shadow-sm',
                    isUser
                      ? 'border-primary/20 bg-primary/5'
                      : 'border-secondary/40 bg-secondary/20'
                  )}
                >
                  <div className='flex items-center justify-between gap-2 text-muted-foreground text-xs uppercase tracking-wide'>
                    <span className='flex items-center gap-1'>
                      {isUser ? (
                        <User className='h-3.5 w-3.5' />
                      ) : (
                        <Sparkles className='h-3.5 w-3.5' />
                      )}
                      {isUser ? 'User' : 'Assistant'}
                    </span>
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                  <pre className='whitespace-pre-wrap break-words text-foreground text-sm leading-relaxed'>
                    {content}
                  </pre>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

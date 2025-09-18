'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, Settings2, Sparkles, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useWorkflowExecution } from '@/app/workspace/[workspaceId]/w/[workflowId]/hooks/use-workflow-execution'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'

interface SmartMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant.'
const MODEL_OPTIONS = ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet', 'o4-mini', 'gemini-1.5-flash']

function buildContextHint(systemPrompt: string | null, messages: SmartMessage[]): string {
  const sanitize = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 72)

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content?.trim())

  if (latestAssistant?.content) {
    return `Ask a follow-up about "${sanitize(latestAssistant.content)}${
      latestAssistant.content.trim().length > 72 ? '…' : ''
    }"`
  }

  if (systemPrompt?.trim()) {
    return `Ask something related to "${sanitize(systemPrompt)}${
      systemPrompt.trim().length > 72 ? '…' : ''
    }"`
  }

  return 'Ask something with the current block context and press Enter to run'
}

export function SmartNodeContent({ blockId, isPreview, previewValues }: CustomBlockContentProps) {
  const [storedConversation, setStoredConversation] = useResolvedSubBlockValue<SmartMessage[]>(
    blockId,
    'conversation',
    { isPreview, previewValues }
  )
  const [model, setModel] = useResolvedSubBlockValue<string>(blockId, 'model', {
    isPreview,
    previewValues,
  })
  const [systemPrompt, setSystemPrompt] = useResolvedSubBlockValue<string>(
    blockId,
    'systemPrompt',
    {
      isPreview,
      previewValues,
    }
  )
  const [temperature, setTemperature] = useResolvedSubBlockValue<number>(blockId, 'temperature', {
    isPreview,
    previewValues,
  })
  const [apiKey, setApiKey] = useResolvedSubBlockValue<string>(blockId, 'apiKey', {
    isPreview,
    previewValues,
  })
  const [, setUserPrompt] = useResolvedSubBlockValue<string>(blockId, 'userPrompt', {
    isPreview,
    previewValues,
  })

  const conversation = useMemo(
    () => (Array.isArray(storedConversation) ? storedConversation : []),
    [storedConversation]
  )
  const conversationRef = useRef<SmartMessage[]>(conversation)

  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])

  useEffect(() => {
    if (!isPreview && !model) {
      setModel(DEFAULT_MODEL)
    }
  }, [isPreview, model, setModel])

  useEffect(() => {
    if (!isPreview && !systemPrompt) {
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
    }
  }, [isPreview, setSystemPrompt, systemPrompt])

  useEffect(() => {
    if (!isPreview && (temperature === null || temperature === undefined)) {
      setTemperature(0.7)
    }
  }, [isPreview, setTemperature, temperature])

  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isSending, setIsSending] = useState(false)
  const { handleRunBlock, isExecuting } = useWorkflowExecution()

  const disabled = isPreview || isSending || isExecuting

  const appendConversation = useCallback(
    (messages: SmartMessage[]) => {
      if (isPreview) return
      setStoredConversation(messages)
      conversationRef.current = messages
    },
    [isPreview, setStoredConversation]
  )

  const handleClear = useCallback(() => {
    if (isPreview) return
    appendConversation([])
  }, [appendConversation, isPreview])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    if (isPreview) return

    const userMessage: SmartMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    const assistantMessage: SmartMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    const baseConversation = [...conversationRef.current, userMessage, assistantMessage]
    appendConversation(baseConversation)
    setInput('')
    setIsSending(true)
    setUserPrompt(trimmed)

    try {
      const result = await handleRunBlock(blockId)

      let content = ''
      if (result && 'stream' in result) {
        const reader = result.stream.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6)
            if (!payload || payload === '[DONE]') continue
            try {
              const data = JSON.parse(payload)
              if (typeof data?.chunk === 'string') {
                content += data.chunk
                const updated = conversationRef.current.map((message) =>
                  message.id === assistantMessage.id ? { ...message, content } : message
                )
                appendConversation(updated)
              }
            } catch (error) {
              console.error('Failed to parse streaming payload', error)
            }
          }
        }
        const finalResult = result.execution?.output?.content
        if (typeof finalResult === 'string' && finalResult.length > 0) {
          content = finalResult
        }
      } else if (result && 'success' in result) {
        if (result.success) {
          if (typeof result.output === 'string') {
            content = result.output
          } else if (result.output?.content) {
            content = String(result.output.content)
          } else if (result.output) {
            content = JSON.stringify(result.output)
          }
        } else {
          content = result.error || 'Smart node execution failed.'
        }
      }

      if (!content) {
        content = 'No response was returned.'
      }

      const updatedConversation = conversationRef.current.map((message) =>
        message.id === assistantMessage.id ? { ...message, content } : message
      )
      appendConversation(updatedConversation)
    } catch (error) {
      console.error(error)
      const fallback = conversationRef.current.map((message) =>
        message.id === assistantMessage.id
          ? {
              ...message,
              content: 'An error occurred while running the smart node.',
            }
          : message
      )
      appendConversation(fallback)
    } finally {
      setIsSending(false)
      setUserPrompt('')
    }
  }, [appendConversation, blockId, disabled, handleRunBlock, input, isPreview, setUserPrompt])

  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  if (isPreview) {
    return (
      <div
        className={cn(
          'flex h-full flex-col items-center justify-center gap-3 rounded-xl p-6 text-center text-muted-foreground text-sm',
          'border border-border/60 border-dashed bg-muted/30'
        )}
      >
        <Sparkles className='h-6 w-6 opacity-70' />
        <p>Smart node preview will appear here after the workflow runs.</p>
      </div>
    )
  }

  const contextHint = useMemo(
    () => buildContextHint(systemPrompt ?? null, conversation),
    [conversation, systemPrompt]
  )

  return (
    <div className='flex h-[480px] min-h-[420px] flex-col rounded-2xl border border-border/70 bg-card/60'>
      <div className='flex flex-col gap-3 border-border/60 border-b px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 font-medium text-sm'>
            <Sparkles className='h-4 w-4 text-primary' />
            Smart Assistant
          </div>
          <div className='flex items-center gap-2'>
            <Select
              value={model || DEFAULT_MODEL}
              onValueChange={(value) => {
                if (isPreview) return
                setModel(value)
              }}
            >
              <SelectTrigger className='h-8 w-[160px] text-xs'>
                <SelectValue placeholder='Select model' />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <Settings2 className='h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[260px] space-y-4' align='end'>
                <div className='space-y-2'>
                  <div className='font-medium text-muted-foreground text-xs'>System prompt</div>
                  <Textarea
                    value={systemPrompt ?? ''}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                    placeholder={DEFAULT_SYSTEM_PROMPT}
                    className='min-h-[80px] text-xs'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between font-medium text-muted-foreground text-xs'>
                    <span>Temperature</span>
                    <span>{(temperature ?? 0.7).toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[typeof temperature === 'number' ? temperature : 0.7]}
                    onValueChange={(value) => setTemperature(value[0] ?? 0.7)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div className='space-y-2'>
                  <div className='font-medium text-muted-foreground text-xs'>API key</div>
                  <Input
                    type='password'
                    value={apiKey ?? ''}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder='Optional provider override'
                    className='h-8 text-xs'
                  />
                </div>
                <Button variant='outline' size='sm' className='w-full gap-2' onClick={handleClear}>
                  <Trash2 className='h-3.5 w-3.5' />
                  Clear conversation
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='relative rounded-xl border border-border/40 bg-background/60 px-4 py-3 shadow-sm'>
          <input
            ref={inputRef}
            type='text'
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={contextHint}
            className='w-full border-none bg-transparent text-base leading-6 placeholder:text-muted-foreground/70 focus:outline-none'
            disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
          />
          <div className='mt-1 flex items-center justify-between text-[11px] text-muted-foreground/80'>
            <span>
              {disabled ? 'Waiting for execution to finish…' : 'Press Enter to run this block'}
            </span>
            <span>Model: {model || DEFAULT_MODEL}</span>
          </div>
          {isSending && (
            <div className='absolute inset-y-0 right-3 flex items-center text-primary/80'>
              <Loader2 className='h-4 w-4 animate-spin' />
            </div>
          )}
        </div>
      </div>

      <div className='flex-1 overflow-hidden'>
        <ScrollArea className='h-full px-4 py-4'>
          {conversation.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-xs'>
              <Sparkles className='h-5 w-5 opacity-60' />
              <span>Run the smart node with real context to populate the thread.</span>
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {conversation
                .slice()
                .reverse()
                .map((message) => {
                  const isAssistant = message.role === 'assistant'
                  const isThinking = isAssistant && !message.content.trim()

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex flex-col gap-2 rounded-xl border border-border/50 bg-background/80 p-4 text-sm shadow-sm',
                        isAssistant ? 'border-primary/40' : 'border-border/40'
                      )}
                    >
                      <div className='flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide'>
                        <div className='flex h-6 w-6 items-center justify-center rounded-full border border-border/30 bg-muted/50'>
                          {isAssistant ? (
                            <Bot className='h-3.5 w-3.5' />
                          ) : (
                            <User className='h-3.5 w-3.5' />
                          )}
                        </div>
                        <span>{isAssistant ? 'Assistant' : 'You'}</span>
                        <span className='text-[10px] text-muted-foreground/70'>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className='whitespace-pre-wrap text-[13px] leading-relaxed'>
                        {isThinking ? (
                          <span className='flex items-center gap-2 text-muted-foreground'>
                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                            Thinking…
                          </span>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

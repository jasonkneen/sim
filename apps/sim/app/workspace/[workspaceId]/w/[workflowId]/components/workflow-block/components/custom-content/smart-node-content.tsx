'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, Sparkles, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { useWorkflowStore } from '@/stores/workflows/workflow/store'
import type { CustomBlockContentProps } from './types'
import { useResolvedSubBlockValue } from './use-resolved-subblock-value'
import { useSmartNodeSettingsStore } from './use-smart-node-settings'

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

// Function to group messages into user-assistant pairs and show them in descending order
function pairAndReverseMessages(messages: SmartMessage[]): SmartMessage[] {
  // First sort all messages by timestamp to ensure correct chronological order
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp)

  // Group into pairs (user + assistant)
  const pairs: SmartMessage[][] = []

  for (let i = 0; i < sortedMessages.length; i++) {
    const message = sortedMessages[i]
    if (message.role === 'user') {
      const pair = [message]
      // Look for the next assistant message
      if (i + 1 < sortedMessages.length && sortedMessages[i + 1].role === 'assistant') {
        pair.push(sortedMessages[i + 1])
        i++ // Skip the assistant message in next iteration
      }
      pairs.push(pair)
    }
  }

  // Reverse pairs to show newest first, then flatten maintaining user->assistant order
  const result: SmartMessage[] = []

  // Reverse the pairs array so newest pair comes first
  for (let i = pairs.length - 1; i >= 0; i--) {
    const pair = pairs[i]
    result.push(pair[0]) // User message
    if (pair[1]) {
      result.push(pair[1]) // Assistant message
    }
  }

  return result
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
  const [, setMemories] = useResolvedSubBlockValue<Array<{ role: string; content: string }>>(
    blockId,
    'memories',
    {
      isPreview,
      previewValues,
    }
  )
  const [, setUserPrompt] = useResolvedSubBlockValue<string>(blockId, 'userPrompt', {
    isPreview,
    previewValues,
  })

  const conversation = useMemo(() => {
    const messages = Array.isArray(storedConversation) ? storedConversation : []
    return pairAndReverseMessages(messages)
  }, [storedConversation])
  const conversationRef = useRef<SmartMessage[]>(conversation)
  const lastMeasuredHeight = useRef<number | null>(null)
  const modelControlId = `${blockId}-model`
  const systemPromptControlId = `${blockId}-system-prompt`
  const apiKeyControlId = `${blockId}-api-key`

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
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isSending, setIsSending] = useState(false)
  const { handleRunBlock, isExecuting } = useWorkflowExecution()
  const { open: openSettings, close: closeSettings, openBlockId } = useSmartNodeSettingsStore()
  const updateBlockHeight = useWorkflowStore((state) => state.updateBlockHeight)

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
    setMemories([])
  }, [appendConversation, isPreview, setMemories])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    if (isPreview) return

    const conversationHistory = (Array.isArray(storedConversation) ? storedConversation : [])
      .filter((message) => message.content?.trim())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ role, content }) => ({ role, content }))

    setMemories(conversationHistory)

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
  }, [
    appendConversation,
    blockId,
    disabled,
    handleRunBlock,
    input,
    isPreview,
    setMemories,
    setUserPrompt,
    storedConversation,
  ])

  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  useEffect(() => {
    if (isPreview || !containerRef.current) return

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const minHeight = 280
      const maxHeight = 640
      const targetHeight = Math.max(
        minHeight,
        Math.min(maxHeight, Math.ceil(entry.contentRect.height + 24))
      )
      if (lastMeasuredHeight.current === targetHeight) return
      lastMeasuredHeight.current = targetHeight
      updateBlockHeight(blockId, targetHeight)
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [blockId, isPreview, updateBlockHeight])

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

  const isSettingsOpen = openBlockId === blockId

  return (
    <>
      {/* Model indicator - positioned outside node on the right */}
      <div className='absolute right-0 top-[-24px] z-30 text-[10px] text-muted-foreground/60 font-mono'>
        {model || DEFAULT_MODEL}
      </div>

      <Dialog
        open={isSettingsOpen}
        onOpenChange={(next) => {
          if (next) {
            openSettings(blockId)
          } else {
            closeSettings()
          }
        }}
      >
        <DialogContent className='max-w-sm space-y-6'>
          <DialogHeader>
            <DialogTitle>Smart node settings</DialogTitle>
            <DialogDescription>
              Adjust the model and behaviour for this block. Changes persist to the workflow.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 text-sm'>
            <div className='space-y-2'>
              <label
                className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                htmlFor={modelControlId}
              >
                Model
              </label>
              <Select
                value={model || DEFAULT_MODEL}
                onValueChange={(value) => {
                  if (isPreview) return
                  setModel(value)
                }}
              >
                <SelectTrigger id={modelControlId} className='h-9 text-sm'>
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
            </div>
            <div className='space-y-2'>
              <label
                className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                htmlFor={systemPromptControlId}
              >
                System prompt
              </label>
              <Textarea
                id={systemPromptControlId}
                value={systemPrompt ?? ''}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder={DEFAULT_SYSTEM_PROMPT}
                className='min-h-[100px] text-sm'
              />
            </div>
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between font-medium text-muted-foreground text-xs uppercase tracking-wide'>
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
              <label
                className='block font-medium text-muted-foreground text-xs uppercase tracking-wide'
                htmlFor={apiKeyControlId}
              >
                API key
              </label>
              <Input
                id={apiKeyControlId}
                type='password'
                value={apiKey ?? ''}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder='Optional provider override'
                className='text-sm'
              />
            </div>
            <Button variant='outline' size='sm' className='w-full gap-2' onClick={handleClear}>
              <Trash2 className='h-3.5 w-3.5' />
              Clear conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div ref={containerRef} className='flex flex-col gap-4 px-1 pt-2 pb-4'>
        <div className='flex flex-col gap-2'>
          <div className='relative'>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={contextHint}
              className='w-full bg-transparent text-[13px] font-semibold text-foreground leading-relaxed placeholder:text-muted-foreground/70 placeholder:font-normal focus:outline-none resize-none overflow-hidden'
              rows={1}
              disabled={disabled}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
            />
            {isSending && (
              <div className='absolute inset-y-0 right-0 flex items-center text-primary/80'>
                <Loader2 className='h-4 w-4 animate-spin' />
              </div>
            )}
          </div>
          {disabled && (
            <div className='text-[11px] text-muted-foreground/80'>
              <span>Waiting for execution to finish…</span>
            </div>
          )}
        </div>

        {conversation.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-muted/20 p-6 text-center text-muted-foreground text-sm'>
            <Sparkles className='h-5 w-5 opacity-60' />
            <span>Send a prompt to generate the first reply.</span>
          </div>
        ) : (
          <ScrollArea className='max-h-[480px] rounded-2xl'>
            <div className='flex flex-col gap-0.5 pr-2'>
              {conversation.map((message) => {
                const isAssistant = message.role === 'assistant'
                const isThinking = isAssistant && !message.content.trim()

                return (
                  <div
                    key={message.id}
                    className='flex flex-col gap-3 rounded-2xl bg-background/80 px-1 py-2 shadow-sm'
                  >
                    <div className='flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide'>
                      <div className='flex h-6 w-6 items-center justify-center rounded-full bg-muted/50'>
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
                    <div
                      className={cn(
                        'whitespace-pre-wrap text-[13px] leading-relaxed',
                        !isAssistant && 'font-semibold'
                      )}
                    >
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
          </ScrollArea>
        )}
      </div>
    </>
  )
}

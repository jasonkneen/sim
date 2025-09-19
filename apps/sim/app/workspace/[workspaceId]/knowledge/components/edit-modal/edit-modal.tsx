'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createLogger } from '@/lib/logs/console/logger'
import type { KnowledgeBaseData } from '@/stores/knowledge/store'

const logger = createLogger('EditKnowledgeBaseModal')

interface EditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  knowledgeBase: KnowledgeBaseData | null
  onKnowledgeBaseUpdated?: (knowledgeBase: KnowledgeBaseData) => void
}

const FormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .refine((value) => value.trim().length > 0, 'Name cannot be empty'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    minChunkSize: z
      .number()
      .min(50, 'Min chunk size must be at least 50')
      .max(2000, 'Min chunk size must be less than 2000'),
    maxChunkSize: z
      .number()
      .min(100, 'Max chunk size must be at least 100')
      .max(4000, 'Max chunk size must be less than 4000'),
    overlapSize: z
      .number()
      .min(0, 'Overlap size must be non-negative')
      .max(500, 'Overlap size must be less than 500'),
  })
  .refine((data) => data.minChunkSize < data.maxChunkSize, {
    message: 'Min chunk size must be less than max chunk size',
    path: ['minChunkSize'],
  })

type FormValues = z.infer<typeof FormSchema>

export function EditModal({
  open,
  onOpenChange,
  knowledgeBase,
  onKnowledgeBaseUpdated,
}: EditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      description: '',
      minChunkSize: 100,
      maxChunkSize: 1024,
      overlapSize: 200,
    },
    mode: 'onChange',
  })

  // Update form values when knowledgeBase changes
  useEffect(() => {
    if (knowledgeBase) {
      const chunkingConfig = knowledgeBase.chunkingConfig as any
      reset({
        name: knowledgeBase.name,
        description: knowledgeBase.description || '',
        minChunkSize: chunkingConfig?.minSize || 100,
        maxChunkSize: chunkingConfig?.maxSize || 1024,
        overlapSize: chunkingConfig?.overlap || 200,
      })
    }
  }, [knowledgeBase, reset])

  const onSubmit = async (data: FormValues) => {
    if (!knowledgeBase) return

    setIsSubmitting(true)
    setError(null)

    try {
      const updatePayload = {
        name: data.name,
        description: data.description || undefined,
        chunkingConfig: {
          maxSize: data.maxChunkSize,
          minSize: data.minChunkSize,
          overlap: data.overlapSize,
        },
      }

      const response = await fetch(`/api/knowledge/${knowledgeBase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update knowledge base')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update knowledge base')
      }

      logger.info(`Successfully updated knowledge base: ${knowledgeBase.id}`)

      // Call the callback if provided
      if (onKnowledgeBaseUpdated) {
        onKnowledgeBaseUpdated(result.data)
      }

      // Close modal
      onOpenChange(false)
    } catch (error) {
      logger.error('Error updating knowledge base:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!knowledgeBase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex h-[60vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[500px]'
        hideCloseButton
      >
        <DialogHeader className='flex-shrink-0 border-b px-6 py-4'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='font-medium text-lg'>Edit Knowledge Base</DialogTitle>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 p-0'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className='h-4 w-4' />
              <span className='sr-only'>Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className='flex flex-1 flex-col overflow-hidden'>
          <form onSubmit={handleSubmit(onSubmit)} className='flex h-full flex-col'>
            {/* Scrollable Content */}
            <div className='scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/25 scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto px-6'>
              <div className='flex min-h-full flex-col py-4'>
                {error && (
                  <div className='mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30'>
                    <p className='text-red-700 text-sm dark:text-red-400'>{error}</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Name *</Label>
                    <Input
                      id='name'
                      placeholder='Enter knowledge base name'
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className='mt-1 text-red-500 text-sm'>{errors.name.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      placeholder='Describe what this knowledge base contains (optional)'
                      rows={3}
                      {...register('description')}
                      className={errors.description ? 'border-red-500' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.description && (
                      <p className='mt-1 text-red-500 text-sm'>{errors.description.message}</p>
                    )}
                  </div>

                  {/* Chunk Configuration Section */}
                  <div className='space-y-4 rounded-lg border p-4'>
                    <h3 className='font-medium text-foreground text-sm'>Chunking Configuration</h3>

                    {/* Min and Max Chunk Size Row */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='minChunkSize'>Min Chunk Size</Label>
                        <Input
                          id='minChunkSize'
                          type='number'
                          placeholder='100'
                          {...register('minChunkSize', { valueAsNumber: true })}
                          className={errors.minChunkSize ? 'border-red-500' : ''}
                          disabled={isSubmitting}
                          autoComplete='off'
                          data-form-type='other'
                        />
                        {errors.minChunkSize && (
                          <p className='mt-1 text-red-500 text-xs'>{errors.minChunkSize.message}</p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='maxChunkSize'>Max Chunk Size</Label>
                        <Input
                          id='maxChunkSize'
                          type='number'
                          placeholder='1024'
                          {...register('maxChunkSize', { valueAsNumber: true })}
                          className={errors.maxChunkSize ? 'border-red-500' : ''}
                          disabled={isSubmitting}
                          autoComplete='off'
                          data-form-type='other'
                        />
                        {errors.maxChunkSize && (
                          <p className='mt-1 text-red-500 text-xs'>{errors.maxChunkSize.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Overlap Size */}
                    <div className='space-y-2'>
                      <Label htmlFor='overlapSize'>Overlap Size</Label>
                      <Input
                        id='overlapSize'
                        type='number'
                        placeholder='200'
                        {...register('overlapSize', { valueAsNumber: true })}
                        className={errors.overlapSize ? 'border-red-500' : ''}
                        disabled={isSubmitting}
                        autoComplete='off'
                        data-form-type='other'
                      />
                      {errors.overlapSize && (
                        <p className='mt-1 text-red-500 text-xs'>{errors.overlapSize.message}</p>
                      )}
                    </div>

                    <p className='text-muted-foreground text-xs'>
                      Configure how documents are split into chunks for processing. Smaller chunks
                      provide more precise retrieval but may lose context.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='mt-auto border-t px-6 pt-4 pb-6'>
              <div className='flex justify-between'>
                <Button
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  type='button'
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='bg-[#701FFC] font-[480] text-primary-foreground shadow-[0_0_0_0_#701FFC] transition-all duration-200 hover:bg-[#6518E6] hover:shadow-[0_0_0_4px_rgba(127,47,255,0.15)]'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    'Update Knowledge Base'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

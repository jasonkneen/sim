'use client'

import { useCallback, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSubBlockValue } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/workflow-block/components/sub-block/hooks/use-sub-block-value'

type TodoTask = {
  id: string
  text: string
  done: boolean
}

interface TodoListProps {
  blockId: string
  subBlockId: string
  isPreview?: boolean
  previewValue?: TodoTask[]
  disabled?: boolean
}

export function TodoList({
  blockId,
  subBlockId,
  isPreview = false,
  previewValue,
  disabled = false,
}: TodoListProps) {
  const [newTaskText, setNewTaskText] = useState('')
  const [storedTasks, setStoredTasks] = useSubBlockValue<TodoTask[]>(blockId, subBlockId)

  const tasks = isPreview ? (previewValue ?? []) : (storedTasks ?? [])

  const handleAddTask = useCallback(() => {
    if (!newTaskText.trim() || isPreview) return

    const newTask: TodoTask = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      done: false,
    }

    const updatedTasks = [...tasks, newTask]
    setStoredTasks(updatedTasks)
    setNewTaskText('')
  }, [newTaskText, tasks, setStoredTasks, isPreview])

  const handleToggleTask = useCallback((taskId: string) => {
    if (isPreview) return

    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, done: !task.done } : task
    )
    setStoredTasks(updatedTasks)
  }, [tasks, setStoredTasks, isPreview])

  const handleDeleteTask = useCallback((taskId: string) => {
    if (isPreview) return

    const updatedTasks = tasks.filter(task => task.id !== taskId)
    setStoredTasks(updatedTasks)
  }, [tasks, setStoredTasks, isPreview])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTask()
    }
  }

  return (
    <div className='space-y-3'>
      {/* Add new task */}
      <div className='flex gap-2'>
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder='Add a new task...'
          disabled={disabled || isPreview}
          onKeyDown={handleKeyDown}
          className='flex-1'
        />
        <Button
          onClick={handleAddTask}
          disabled={!newTaskText.trim() || disabled || isPreview}
          size='sm'
          className='px-3'
        >
          <Plus className='h-4 w-4' />
        </Button>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div className='space-y-1'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 rounded-md border p-2 transition-colors',
                task.done && 'bg-muted/30 opacity-75'
              )}
            >
              <Checkbox
                checked={task.done}
                onCheckedChange={() => handleToggleTask(task.id)}
                disabled={disabled || isPreview}
                className='flex-shrink-0'
              />
              <span
                className={cn(
                  'flex-1 text-sm',
                  task.done && 'line-through text-muted-foreground'
                )}
              >
                {task.text}
              </span>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                disabled={disabled || isPreview}
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
import { ReminderIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type TodoTask = {
  id: string
  text: string
  done: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

interface TodoToolResponse extends ToolResponse {
  output: {
    tasks: TodoTask[]
    autoSort?: boolean
    progress?: number
  }
}

export const TodoBlock: BlockConfig<TodoToolResponse> = {
  type: 'todo',
  name: 'Todo',
  description: 'Create task lists with progress tracking.',
  longDescription:
    'Manage hierarchical task lists with priorities, due dates, and automatic progress tracking. Tasks can reference workflow variables and broadcast updates downstream.',
  category: 'blocks',
  bgColor: '#4A90E2',
  icon: ReminderIcon,
  subBlocks: [
    {
      id: 'tasks',
      title: 'Tasks',
      type: 'todo-list',
      layout: 'full',
      description: 'Add tasks and check them off when complete.',
    },
  ],
  tools: { access: [] },
  inputs: {
    tasks: { type: 'json', description: 'Task collection for the list' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the todo operation was successful' },
    output: { type: 'json', description: 'The structured output containing todo data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    tasks: { type: 'json', description: 'Latest task list state' },
    progress: { type: 'number', description: 'Completion percentage across tasks' },
  },
}

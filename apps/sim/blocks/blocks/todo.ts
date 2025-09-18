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
      type: 'table',
      layout: 'full',
      columns: ['Task', 'Done', 'Priority', 'Due'],
      description: 'Enter tasks with completion state, priority, and optional due dates.',
    },
    {
      id: 'autoSort',
      title: 'Auto-sort by priority',
      type: 'switch',
      layout: 'half',
      description: 'Automatically sort tasks by priority and due date.',
    },
    {
      id: 'highlightActive',
      title: 'Highlight active task',
      type: 'switch',
      layout: 'half',
      description: 'Highlight the next incomplete task during execution.',
    },
  ],
  tools: { access: [] },
  inputs: {
    tasks: { type: 'json', description: 'Task collection for the list' },
    autoSort: { type: 'boolean', description: 'Whether to auto-sort tasks' },
    highlightActive: { type: 'boolean', description: 'Highlight current active task' },
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

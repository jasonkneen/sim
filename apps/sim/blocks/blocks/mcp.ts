import { AtomIcon } from '@/components/icons'
import type { BlockConfig } from '@/blocks/types'
import type { ToolResponse } from '@/tools/types'

type MCPExecution = {
  id: string
  tool: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  output?: string
  error?: string
  startedAt?: string
  finishedAt?: string
}

interface MCPToolResponse extends ToolResponse {
  output: {
    server: string
    tool: string
    toolInput?: string
    mcpExecutions: MCPExecution[]
  }
}

export const MCPBlock: BlockConfig<MCPToolResponse> = {
  type: 'mcp',
  name: 'MCP Tool',
  description: 'Execute Model Context Protocol server tools.',
  longDescription:
    'Connect to MCP servers and execute their tools with structured input. Configure MCP servers in Settings > MCP Servers first, then use their server names and tool names here. Execution history is exposed to downstream blocks.',
  category: 'tools',
  bgColor: '#2F55FF',
  icon: AtomIcon,
  subBlocks: [
    {
      id: 'server',
      title: 'Server Identifier',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Enter MCP server name (configure servers in Settings > MCP Servers)',
      required: true,
      description: 'MCP server identifier. Configure available servers in Settings.',
    },
    {
      id: 'tool',
      title: 'Tool',
      type: 'short-input',
      layout: 'full',
      placeholder: 'Tool name to execute (e.g., list_files, read_file)',
      required: true,
      description: 'Name of the tool to execute on the selected MCP server.',
    },
    {
      id: 'toolInput',
      title: 'Tool Input',
      type: 'code',
      layout: 'full',
      language: 'json',
      placeholder: 'Enter JSON parameters for the tool…',
      rows: 4,
      wandConfig: {
        enabled: true,
        prompt: 'Generate JSON input parameters for the MCP tool',
        generationType: 'json-object',
        placeholder: 'Describe what you want to do with this tool...',
      },
    },
    {
      id: 'mcpExecutions',
      title: 'Execution History',
      type: 'table',
      layout: 'full',
      columns: ['ID', 'Tool', 'Status', 'Output'],
    },
  ],
  tools: { access: [] },
  inputs: {
    server: { type: 'string', description: 'MCP server identifier' },
    tool: { type: 'string', description: 'Selected MCP tool name' },
    toolInput: { type: 'string', description: 'Tool parameter payload as JSON' },
    mcpExecutions: { type: 'json', description: 'Previous execution log' },
  },
  outputs: {
    success: { type: 'boolean', description: 'Whether the MCP operation was successful' },
    output: { type: 'json', description: 'The structured output containing MCP data' },
    error: { type: 'string', description: 'Error message if operation failed' },
    timing: { type: 'json', description: 'Execution timing information' },
    server: { type: 'string', description: 'Server identifier' },
    tool: { type: 'string', description: 'Tool executed' },
    toolInput: { type: 'string', description: 'Tool input payload' },
    mcpExecutions: { type: 'json', description: 'Execution history' },
  },
}

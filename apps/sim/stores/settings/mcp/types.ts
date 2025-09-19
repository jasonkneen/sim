export interface MCPServer {
  id: string
  name: string
  displayName: string
  command: string
  args: string[]
  env: Record<string, string>
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error' | 'connecting'
  tools: MCPTool[]
  lastConnected?: string
  lastError?: string
  createdAt: string
  updatedAt: string
}

export interface MCPTool {
  name: string
  description: string
  schema: any
  inputSchema?: any
}

export interface MCPServersState {
  servers: MCPServer[]
  isLoading: boolean
  error: string | null
  isServerLoading: Record<string, boolean>
  connectionStatus: Record<string, 'connected' | 'disconnected' | 'error' | 'connecting'>
}

export interface MCPServersActions {
  // Server management
  addServer: (
    server: Omit<MCPServer, 'id' | 'status' | 'tools' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  updateServer: (id: string, updates: Partial<MCPServer>) => Promise<void>
  deleteServer: (id: string) => Promise<void>
  toggleServer: (id: string) => Promise<void>

  // Connection management
  connectServer: (id: string) => Promise<void>
  disconnectServer: (id: string) => Promise<void>
  testConnection: (id: string) => Promise<boolean>
  refreshTools: (id: string) => Promise<void>

  // Data loading
  loadServers: (force?: boolean) => Promise<void>

  // Utility
  getServer: (id: string) => MCPServer | undefined
  getEnabledServers: () => MCPServer[]
  getConnectedServers: () => MCPServer[]
  getServerTools: (serverId: string) => MCPTool[]
  getAllTools: () => { server: MCPServer; tool: MCPTool }[]
}

export type MCPServersStore = MCPServersState & MCPServersActions

// Default MCP server configurations based on common servers
export const DEFAULT_MCP_SERVERS: Omit<
  MCPServer,
  'id' | 'status' | 'tools' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'filesystem',
    displayName: 'File System',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    env: {},
    enabled: false,
  },
  {
    name: 'fetch',
    displayName: 'Web Fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    env: {},
    enabled: false,
  },
  {
    name: 'memory',
    displayName: 'Memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
    enabled: false,
  },
  {
    name: 'github',
    displayName: 'GitHub',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: '',
    },
    enabled: false,
  },
  {
    name: 'puppeteer',
    displayName: 'Puppeteer (Browser Automation)',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {},
    enabled: false,
  },
  {
    name: 'brave-search',
    displayName: 'Brave Search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: '',
    },
    enabled: false,
  },
  {
    name: 'postgres',
    displayName: 'PostgreSQL',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    env: {
      POSTGRES_CONNECTION_STRING: '',
    },
    enabled: false,
  },
  {
    name: 'sqlite',
    displayName: 'SQLite',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
    env: {},
    enabled: false,
  },
]

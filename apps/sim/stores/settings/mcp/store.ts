import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import {
  type MCPServersStore,
  type MCPServer,
  type MCPTool,
  DEFAULT_MCP_SERVERS
} from './types'

const generateId = () => nanoid()

export const useMCPServersStore = create<MCPServersStore>()(
  persist(
    (set, get) => ({
      // State
      servers: [],
      isLoading: false,
      error: null,
      isServerLoading: {},
      connectionStatus: {},

      // Server management
      addServer: async (serverData) => {
        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          const server: MCPServer = {
            ...serverData,
            id: generateId(),
            status: 'disconnected',
            tools: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          set((state) => ({
            ...state,
            servers: [...state.servers, server],
            isLoading: false
          }))

          // Auto-connect if server is enabled
          if (server.enabled) {
            await get().connectServer(server.id)
          }
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to add server',
            isLoading: false
          }))
        }
      },

      updateServer: async (id, updates) => {
        try {
          set((state) => ({
            ...state,
            isServerLoading: { ...state.isServerLoading, [id]: true },
            error: null
          }))

          set((state) => ({
            ...state,
            servers: state.servers.map((server) =>
              server.id === id
                ? { ...server, ...updates, updatedAt: new Date().toISOString() }
                : server
            ),
            isServerLoading: { ...state.isServerLoading, [id]: false }
          }))

          // Handle connection state changes
          if (updates.enabled !== undefined) {
            if (updates.enabled) {
              await get().connectServer(id)
            } else {
              await get().disconnectServer(id)
            }
          }
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to update server',
            isServerLoading: { ...state.isServerLoading, [id]: false }
          }))
        }
      },

      deleteServer: async (id) => {
        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          // Disconnect first
          await get().disconnectServer(id)

          set((state) => ({
            ...state,
            servers: state.servers.filter((server) => server.id !== id),
            connectionStatus: Object.fromEntries(
              Object.entries(state.connectionStatus).filter(([key]) => key !== id)
            ),
            isLoading: false
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to delete server',
            isLoading: false
          }))
        }
      },

      toggleServer: async (id) => {
        const server = get().getServer(id)
        if (!server) return

        await get().updateServer(id, { enabled: !server.enabled })
      },

      // Connection management
      connectServer: async (id) => {
        try {
          set((state) => ({
            ...state,
            connectionStatus: { ...state.connectionStatus, [id]: 'connecting' },
            error: null
          }))

          // TODO: Implement actual MCP server connection
          // This would involve spawning the server process and establishing communication
          console.log(`Connecting to MCP server: ${id}`)

          // Simulate connection
          await new Promise(resolve => setTimeout(resolve, 1000))

          set((state) => ({
            ...state,
            servers: state.servers.map((server) =>
              server.id === id
                ? {
                    ...server,
                    status: 'connected',
                    lastConnected: new Date().toISOString()
                  }
                : server
            ),
            connectionStatus: { ...state.connectionStatus, [id]: 'connected' }
          }))

          // Refresh tools after connection
          await get().refreshTools(id)
        } catch (error) {
          set((state) => ({
            ...state,
            servers: state.servers.map((server) =>
              server.id === id
                ? {
                    ...server,
                    status: 'error',
                    lastError: error instanceof Error ? error.message : 'Connection failed'
                  }
                : server
            ),
            connectionStatus: { ...state.connectionStatus, [id]: 'error' },
            error: error instanceof Error ? error.message : 'Failed to connect to server'
          }))
        }
      },

      disconnectServer: async (id) => {
        try {
          // TODO: Implement actual disconnection logic
          console.log(`Disconnecting from MCP server: ${id}`)

          set((state) => ({
            ...state,
            servers: state.servers.map((server) =>
              server.id === id
                ? { ...server, status: 'disconnected', tools: [] }
                : server
            ),
            connectionStatus: { ...state.connectionStatus, [id]: 'disconnected' }
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to disconnect from server'
          }))
        }
      },

      testConnection: async (id) => {
        try {
          const server = get().getServer(id)
          if (!server) return false

          // TODO: Implement actual connection test
          console.log(`Testing connection to MCP server: ${id}`)

          // Simulate test
          await new Promise(resolve => setTimeout(resolve, 500))
          return true
        } catch (error) {
          console.error(`Connection test failed for server ${id}:`, error)
          return false
        }
      },

      refreshTools: async (id) => {
        try {
          set((state) => ({
            ...state,
            isServerLoading: { ...state.isServerLoading, [id]: true }
          }))

          // TODO: Implement actual tool discovery
          // This would involve querying the MCP server for available tools
          console.log(`Refreshing tools for MCP server: ${id}`)

          // Mock tools for now
          const mockTools: MCPTool[] = [
            {
              name: 'list_files',
              description: 'List files in a directory',
              schema: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'Directory path' }
                },
                required: ['path']
              }
            },
            {
              name: 'read_file',
              description: 'Read contents of a file',
              schema: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'File path' }
                },
                required: ['path']
              }
            }
          ]

          set((state) => ({
            ...state,
            servers: state.servers.map((server) =>
              server.id === id
                ? { ...server, tools: mockTools }
                : server
            ),
            isServerLoading: { ...state.isServerLoading, [id]: false }
          }))
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to refresh tools',
            isServerLoading: { ...state.isServerLoading, [id]: false }
          }))
        }
      },

      // Data loading
      loadServers: async (force = false) => {
        const { servers } = get()

        if (!force && servers.length > 0) return

        try {
          set((state) => ({ ...state, isLoading: true, error: null }))

          // Initialize with default servers if none exist
          if (servers.length === 0) {
            const defaultServers: MCPServer[] = DEFAULT_MCP_SERVERS.map(server => ({
              ...server,
              id: generateId(),
              status: 'disconnected' as const,
              tools: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))

            set((state) => ({
              ...state,
              servers: defaultServers,
              isLoading: false
            }))
          } else {
            set((state) => ({ ...state, isLoading: false }))
          }
        } catch (error) {
          set((state) => ({
            ...state,
            error: error instanceof Error ? error.message : 'Failed to load servers',
            isLoading: false
          }))
        }
      },

      // Utility functions
      getServer: (id) => {
        return get().servers.find((server) => server.id === id)
      },

      getEnabledServers: () => {
        return get().servers.filter((server) => server.enabled)
      },

      getConnectedServers: () => {
        return get().servers.filter((server) => server.status === 'connected')
      },

      getServerTools: (serverId) => {
        const server = get().getServer(serverId)
        return server?.tools || []
      },

      getAllTools: () => {
        const tools: { server: MCPServer; tool: MCPTool }[] = []

        get().getConnectedServers().forEach(server => {
          server.tools.forEach(tool => {
            tools.push({ server, tool })
          })
        })

        return tools
      }
    }),
    {
      name: 'mcp-servers-store',
      partialize: (state) => ({
        servers: state.servers
      })
    }
  )
)
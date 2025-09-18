import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Plus,
  Server,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Settings,
  Terminal,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useMCPServersStore } from '@/stores/settings/mcp/store'
import { type MCPServer, type MCPTool } from '@/stores/settings/mcp/types'

const STATUS_COLORS = {
  connected: 'text-green-600 border-green-600',
  disconnected: 'text-gray-600 border-gray-600',
  error: 'text-red-600 border-red-600',
  connecting: 'text-yellow-600 border-yellow-600',
}

const STATUS_ICONS = {
  connected: CheckCircle,
  disconnected: XCircle,
  error: XCircle,
  connecting: Clock,
}

export function MCPServers() {
  const [retryCount, setRetryCount] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedServers, setExpandedServers] = useState<Record<string, boolean>>({})

  const {
    servers,
    isLoading,
    error,
    isServerLoading,
    connectionStatus,
    addServer,
    updateServer,
    deleteServer,
    toggleServer,
    connectServer,
    disconnectServer,
    testConnection,
    refreshTools,
    loadServers,
  } = useMCPServersStore()

  useEffect(() => {
    loadServers(retryCount > 0)
  }, [loadServers, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleServerToggle = async (serverId: string) => {
    await toggleServer(serverId)
  }

  const handleConnect = async (serverId: string) => {
    await connectServer(serverId)
  }

  const handleDisconnect = async (serverId: string) => {
    await disconnectServer(serverId)
  }

  const handleTestConnection = async (serverId: string) => {
    const result = await testConnection(serverId)
    // TODO: Show toast notification with result
    console.log(`Connection test result for ${serverId}: ${result}`)
  }

  const handleRefreshTools = async (serverId: string) => {
    await refreshTools(serverId)
  }

  const handleDeleteServer = async (serverId: string) => {
    if (confirm('Are you sure you want to delete this MCP server?')) {
      await deleteServer(serverId)
    }
  }

  const toggleServerExpanded = (serverId: string) => {
    setExpandedServers(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }))
  }

  return (
    <div className='space-y-6 p-6'>
      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between'>
            <span>Failed to load MCP servers: {error}</span>
            <Button variant='outline' size='sm' onClick={handleRetry} disabled={isLoading}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className='flex items-center justify-between'>
        <div>
          <h2 className='font-medium text-lg'>MCP Servers</h2>
          <p className='text-muted-foreground text-sm mt-1'>
            Configure Model Context Protocol servers and their tools
          </p>
        </div>
        <AddServerDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={addServer}
        />
      </div>

      <div className='space-y-4'>
        {isLoading ? (
          <>
            <ServerSkeleton />
            <ServerSkeleton />
            <ServerSkeleton />
          </>
        ) : servers.length === 0 ? (
          <div className='text-center py-8'>
            <Server className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-medium'>No MCP servers configured</h3>
            <p className='text-muted-foreground mb-4'>
              Add MCP servers to extend capabilities with external tools
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Add MCP Server
            </Button>
          </div>
        ) : (
          servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              isLoading={isServerLoading[server.id] || false}
              isExpanded={expandedServers[server.id] || false}
              onToggle={() => handleServerToggle(server.id)}
              onConnect={() => handleConnect(server.id)}
              onDisconnect={() => handleDisconnect(server.id)}
              onTestConnection={() => handleTestConnection(server.id)}
              onRefreshTools={() => handleRefreshTools(server.id)}
              onDelete={() => handleDeleteServer(server.id)}
              onToggleExpanded={() => toggleServerExpanded(server.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ServerCardProps {
  server: MCPServer
  isLoading: boolean
  isExpanded: boolean
  onToggle: () => void
  onConnect: () => void
  onDisconnect: () => void
  onTestConnection: () => void
  onRefreshTools: () => void
  onDelete: () => void
  onToggleExpanded: () => void
}

function ServerCard({
  server,
  isLoading,
  isExpanded,
  onToggle,
  onConnect,
  onDisconnect,
  onTestConnection,
  onRefreshTools,
  onDelete,
  onToggleExpanded,
}: ServerCardProps) {
  const StatusIcon = STATUS_ICONS[server.status]

  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <h3 className='font-medium'>{server.displayName}</h3>
              <Badge variant='outline' className={STATUS_COLORS[server.status]}>
                <StatusIcon className='h-3 w-3 mr-1' />
                {server.status}
              </Badge>
              {server.enabled && (
                <Badge variant='outline' className='text-green-600 border-green-600'>
                  Enabled
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-2 mt-1'>
              <span className='text-xs text-muted-foreground font-mono'>{server.name}</span>
              <span className='text-xs text-muted-foreground'>•</span>
              <span className='text-xs text-muted-foreground'>
                {server.tools.length} tool{server.tools.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={onDelete}
                className='text-destructive hover:text-destructive'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete server</TooltipContent>
          </Tooltip>
          <Switch
            checked={server.enabled}
            onCheckedChange={onToggle}
            disabled={isLoading}
          />
        </div>
      </div>

      <Separator />

      <div className='space-y-3'>
        {/* Command and Environment */}
        <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant='ghost' className='w-full justify-between h-auto p-0'>
              <div className='flex items-center gap-2'>
                <Settings className='h-4 w-4' />
                <span className='text-sm font-medium'>Configuration</span>
              </div>
              <Terminal className='h-4 w-4' />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className='space-y-3 mt-3'>
            <div className='bg-muted/50 rounded-lg p-3 space-y-2'>
              <div className='text-xs font-medium text-muted-foreground'>Command</div>
              <div className='font-mono text-sm bg-background rounded p-2 border'>
                {server.command} {server.args.join(' ')}
              </div>
            </div>

            {Object.keys(server.env).length > 0 && (
              <div className='bg-muted/50 rounded-lg p-3 space-y-2'>
                <div className='text-xs font-medium text-muted-foreground'>Environment Variables</div>
                <div className='space-y-1'>
                  {Object.entries(server.env).map(([key, value]) => (
                    <div key={key} className='flex items-center gap-2 text-sm'>
                      <span className='font-mono text-muted-foreground'>{key}:</span>
                      <span className='font-mono bg-background rounded px-2 py-1 border flex-1 truncate'>
                        {value || '<not set>'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Connection Controls */}
        <div className='flex items-center gap-2'>
          {server.status === 'connected' ? (
            <Button
              variant='outline'
              size='sm'
              onClick={onDisconnect}
              disabled={isLoading}
            >
              <Square className='h-3 w-3 mr-1' />
              Disconnect
            </Button>
          ) : (
            <Button
              variant='outline'
              size='sm'
              onClick={onConnect}
              disabled={isLoading || !server.enabled}
            >
              <Play className='h-3 w-3 mr-1' />
              Connect
            </Button>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={onTestConnection}
            disabled={isLoading}
          >
            Test
          </Button>

          {server.status === 'connected' && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRefreshTools}
              disabled={isLoading}
            >
              <RefreshCw className='h-3 w-3 mr-1' />
              Refresh Tools
            </Button>
          )}
        </div>

        {/* Tools List */}
        {server.tools.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Label className='text-sm font-medium'>Available Tools</Label>
              <Badge variant='secondary'>{server.tools.length}</Badge>
            </div>
            <div className='space-y-1 max-h-32 overflow-y-auto'>
              {server.tools.map((tool) => (
                <ToolItem key={tool.name} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* Status Information */}
        {server.lastConnected && (
          <div className='text-xs text-muted-foreground'>
            Last connected: {new Date(server.lastConnected).toLocaleString()}
          </div>
        )}

        {server.lastError && (
          <Alert variant='destructive' className='mt-2'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription className='text-sm'>
              {server.lastError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

interface ToolItemProps {
  tool: MCPTool
}

function ToolItem({ tool }: ToolItemProps) {
  return (
    <div className='flex items-center justify-between p-2 bg-muted/50 rounded'>
      <div className='flex-1'>
        <div className='font-mono text-sm font-medium'>{tool.name}</div>
        <div className='text-xs text-muted-foreground'>{tool.description}</div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
            <Eye className='h-3 w-3' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <pre className='text-xs max-w-sm overflow-hidden'>
            {JSON.stringify(tool.schema, null, 2)}
          </pre>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

interface AddServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (server: Omit<MCPServer, 'id' | 'status' | 'tools' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

function AddServerDialog({ open, onOpenChange, onAdd }: AddServerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    command: '',
    args: '',
    env: '',
    enabled: false,
  })

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.displayName.trim() || !formData.command.trim()) return

    const args = formData.args.trim() ? formData.args.split(' ') : []
    const env: Record<string, string> = {}

    if (formData.env.trim()) {
      formData.env.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim()
        }
      })
    }

    await onAdd({
      name: formData.name,
      displayName: formData.displayName,
      command: formData.command,
      args,
      env,
      enabled: formData.enabled,
    })

    setFormData({
      name: '',
      displayName: '',
      command: '',
      args: '',
      env: '',
      enabled: false,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Add MCP Server
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            Configure a new Model Context Protocol server
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='server-name'>Server ID</Label>
              <Input
                id='server-name'
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder='filesystem'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='server-displayname'>Display Name</Label>
              <Input
                id='server-displayname'
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder='File System MCP'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='server-command'>Command</Label>
            <Input
              id='server-command'
              value={formData.command}
              onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
              placeholder='npx'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='server-args'>Arguments</Label>
            <Input
              id='server-args'
              value={formData.args}
              onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
              placeholder='-y @modelcontextprotocol/server-filesystem'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='server-env'>Environment Variables</Label>
            <Textarea
              id='server-env'
              value={formData.env}
              onChange={(e) => setFormData(prev => ({ ...prev, env: e.target.value }))}
              placeholder='VARIABLE_NAME=value&#10;ANOTHER_VAR=another_value'
              rows={3}
            />
            <p className='text-xs text-muted-foreground'>
              One variable per line, in the format: VARIABLE_NAME=value
            </p>
          </div>

          <div className='flex items-center space-x-2'>
            <Switch
              id='server-enabled'
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor='server-enabled'>Enable and connect immediately</Label>
          </div>
        </div>

        <div className='flex justify-end space-x-2 pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || !formData.displayName.trim() || !formData.command.trim()}
          >
            Add Server
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ServerSkeleton = () => (
  <div className='border rounded-lg p-4 space-y-4'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <Skeleton className='h-6 w-12' />
    </div>
    <Separator />
    <div className='space-y-3'>
      <Skeleton className='h-8 w-24' />
      <div className='space-y-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-6 w-full' />
      </div>
    </div>
  </div>
)
# Canvas Application Node Specification

## Overview
This document provides a comprehensive specification of all nodes available in the Canvas application, a visual flow-based programming environment. Each node represents a functional component that can be connected to create complex workflows.


## Node Types

### 1. API Node
**Purpose:** Make HTTP API requests with full configuration options

**Inputs:**
- API endpoints configuration
- Authentication credentials
- Headers and parameters
- Request body data

**Outputs:**
- API response data
- Status codes
- Error information

**Key Features:**
- Multiple endpoint management
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Authentication types: Bearer, Basic, API Key, OAuth2, Custom
- Body formats: JSON, Form Data, URL-encoded, Raw, Binary
- Global settings inheritance
- Request/response visualization
- Retry and timeout configuration

**Data Structure:**
```typescript
{
  endpoints?: APIEndpoint[]
  selectedEndpointId?: string
  globalAuth?: AuthConfiguration
  globalHeaders?: Record<string, string>
  globalTimeout?: number
  isLoading?: boolean
}
```

### 2. Chat Node
**Purpose:** Interactive AI chat with model selection and conversation management

**Inputs:**
- User messages
- System prompts

**Outputs:**
- AI responses
- Conversation history
- Extracted data

**Key Features:**
- Multiple AI model support (OpenAI, Anthropic, etc.)
- Conversation history management
- System prompt configuration
- Tool/function calling support
- Message timestamps and time-ago display

**Data Structure:**
```typescript
{
  messages?: ChatMessage[]
  model?: string
  systemPrompt?: string
  enableTools?: boolean
  combinationStrategy?: string
  connectedBrowserId?: string
}
```

### 3. Code Node
**Purpose:** Execute JavaScript or Python code with access to connected inputs

**Inputs:**
- Code to execute
- File system access (optional)

**Outputs:**
- Execution results
- Console output
- Error messages

**Key Features:**
- JavaScript and Python support
- Web Worker execution for safety
- File system integration
- Code snippets and templates
- Image/media byte access
- Directory handle management

**Data Structure:**
```typescript
{
  language?: 'javascript' | 'python'
  code?: string
  output?: unknown
  fontSize?: number
}
```

### 4. Browser Node
**Purpose:** Embedded browser with automation capabilities

**Inputs:**
- URLs to navigate
- AI commands for automation
- Extension configurations

**Outputs:**
- Page content
- Screenshots
- Extracted data

**Key Features:**
- Multi-tab management
- Browser history and bookmarks
- Extension support (packaged/unpackaged)
- AI-powered browser automation
- Command types: act, extract, observe
- Element finding via CSS selectors or text
- Screenshot capture
- Pinned/floating mode
- Settings panel for configuration

**Data Structure:**
```typescript
{
  tabs?: BrowserTab[]
  activeTabId?: string
  bookmarks?: Bookmark[]
  history?: string[]
  extensions?: ExtensionInfo[]
  aiEnabled?: boolean
  aiCommands?: AICommand[]
  pinned?: boolean
}
```

### 5. Terminal Node
**Purpose:** Interactive terminal with WebSocket connection

**Inputs:**
- Shell commands
- Environment variables
- Connected code outputs

**Outputs:**
- Terminal output
- Command results
- Error streams

**Key Features:**
- WebSocket-based terminal connection
- Session persistence
- Search functionality
- Copy/paste support
- Sticky/floating mode
- Terminal resizing
- Output buffering
- Heartbeat monitoring
- Reconnection handling

**Data Structure:**
```typescript
{
  sessionId?: string
  isConnected?: boolean
  isSticky?: boolean
  stickyPosition?: { x: number, y: number }
  stickySize?: { width: number, height: number }
  lastCommand?: string
}
```

### 6. Media Node
**Purpose:** Display and manage media files (images, videos, audio, PDFs)

**Inputs:**
- File drops or URLs
- Connected media from other nodes

**Outputs:**
- Media content object
- File metadata

**Key Features:**
- Support for images, videos, audio, PDFs, URLs
- Drag and drop file upload
- Preview rendering
- Metadata extraction
- Content type detection
- Object URL management

**Data Structure:**
```typescript
{
  content?: NodeContent {
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'url' | 'text'
    src?: string
    name?: string
    type?: string
    size?: number
  }
}
```

### 7. Note Node
**Purpose:** Rich text notes with variable integration

**Inputs:**
- Text content
- Variables from connected nodes
- Form data broadcasts

**Outputs:**
- Note content
- Structured data

**Key Features:**
- Sticky note color themes (8 predefined colors)
- Variable interpolation
- BAML form data integration
- Data visualization mode
- Connected data display
- Auto-resize support
- Version history
- Form data reception indicator

**Data Structure:**
```typescript
{
  content?: string
  noteColor?: string
  formData?: Record<string, any>
  bamlStatus?: BAMLStatusData
  showDataViz?: boolean
}
```

### 8. Todo Node
**Purpose:** Task list management with hierarchical structure

**Inputs:**
- Task items
- Variables for dynamic tasks

**Outputs:**
- Task list data
- Completion status

**Key Features:**
- Hierarchical task structure (subtasks)
- Drag and drop reordering
- Task search
- Inline editing
- Collapsible sections
- Variable integration
- Audio player synchronization
- Task highlighting
- Progress tracking

**Data Structure:**
```typescript
{
  tasks?: Array<{
    id: string
    text: string
    done: boolean
    children?: Task[]
    collapsed?: boolean
  }>
}
```

### 9. Audio Player Node
**Purpose:** Audio playback with playlist management

**Inputs:**
- Audio files or URLs
- Playlist data

**Outputs:**
- Playback status
- Current track information

**Key Features:**
- Playlist management
- Loop and shuffle modes
- Radio station mode
- Auto-play support
- Live indicator
- Track selection
- Variable naming for tracks

**Data Structure:**
```typescript
{
  playlist?: AudioTrack[]
  currentTrack?: number
  loop?: boolean
  shuffle?: boolean
  radioMode?: boolean
  autoPlay?: boolean
}
```

### 10. Audio Recorder Node
**Purpose:** Audio recording with transcription capabilities

**Inputs:**
- Microphone input
- System audio
- App-specific audio

**Outputs:**
- Recorded audio files
- Transcriptions
- Audio analysis

**Key Features:**
- Multiple recording modes (microphone, system, app-targeted)
- Device selection
- Auto-transcription
- Smart analysis
- Speech bubble display
- Recording management
- Processing status tracking

**Data Structure:**
```typescript
{
  recordingMode?: 'microphone' | 'system' | 'app-targeted'
  deviceId?: string
  recordings?: Recording[]
  autoTranscribe?: boolean
  smartAnalysis?: boolean
  processingStatus?: string
}
```

### 11. TTS (Text-to-Speech) Node
**Purpose:** Convert text to speech with multiple voice options

**Inputs:**
- Text content
- Voice selection
- TTS parameters

**Outputs:**
- Audio files
- Speech data

**Key Features:**
- Multiple TTS providers (ElevenLabs, Cartesia, OpenAI)
- Voice selection
- Audio format options (MP3, WAV, OGG, AAC)
- Provider-specific parameters
- Responses API integration
- Style and latency optimization

**Data Structure:**
```typescript
{
  voice?: string
  audioFormat?: 'mp3' | 'wav' | 'ogg' | 'aac'
  useResponsesApi?: boolean
  ttsParams?: ProviderParameters
}
```

### 12. Webhook Node
**Purpose:** Receive and process webhook requests

**Inputs:**
- Webhook configuration
- Request filters

**Outputs:**
- Webhook payload data
- Request metadata

**Key Features:**
- Webhook listener setup
- Request logging
- Payload processing
- Real-time updates
- Mode switching
- Request filtering

**Data Structure:**
```typescript
{
  webhookLogs?: WebhookLog[]
  lastWebhook?: any
  isListening?: boolean
  webhookMode?: boolean
}
```

### 13. Folder Node
**Purpose:** File system folder management

**Inputs:**
- Directory selection
- File filters

**Outputs:**
- Folder contents
- Selected files

**Key Features:**
- Directory browsing
- File selection
- Content preview
- Metadata display
- Change tracking

**Data Structure:**
```typescript
{
  content?: NodeContent
  selected?: NodeContent
  changed?: boolean
  children?: FileInfo[]
}
```

### 14. App Node
**Purpose:** Application integration and automation

**Inputs:**
- App selection
- Commands

**Outputs:**
- App status
- Window information

**Key Features:**
- App launch and control
- Window management
- URL scheme support
- Macro capabilities
- Automation support
- Audio recording from apps
- Script generation
- Command sending

**Data Structure:**
```typescript
{
  bundleId?: string
  appPath?: string
  isRunning?: boolean
  windowTitles?: string[]
  automationSupport?: boolean
  canRecordAudio?: boolean
}
```

### 15. MCP (Model Context Protocol) Node
**Purpose:** Execute MCP server tools

**Inputs:**
- Server selection
- Tool parameters

**Outputs:**
- Tool execution results
- Error information

**Key Features:**
- MCP server connection
- Tool discovery and selection
- Parameter input
- Execution history
- Error handling
- Status tracking

**Data Structure:**
```typescript
{
  selectedServer?: string
  selectedTool?: string
  toolInput?: string
  mcpExecutions?: MCPExecution[]
}
```

### 16. LiveKit Conference Node
**Purpose:** Video conferencing with LiveKit

**Inputs:**
- Room configuration
- Participant settings

**Outputs:**
- Conference state
- Participant data

**Key Features:**
- Multi-participant support
- Screen sharing
- Audio/video controls
- Chat integration
- Recording capabilities

### 17. LiveStream Node
**Purpose:** Live streaming functionality

**Inputs:**
- Stream configuration
- Media sources

**Outputs:**
- Stream status
- Viewer statistics

**Key Features:**
- Multiple streaming platforms
- Quality settings
- Chat integration
- Stream recording

### 18. Model Node
**Purpose:** AI model selection and configuration

**Inputs:**
- Model parameters
- Provider settings

**Outputs:**
- Model configuration
- Provider information

**Key Features:**
- Multi-provider support
- Model comparison
- Parameter tuning
- Cost estimation

### 19. Group Node
**Purpose:** Visual grouping of related nodes

**Inputs:**
- Child nodes

**Outputs:**
- Group metadata

**Key Features:**
- Visual organization
- Batch operations
- Collapsible groups
- Label management

### 20. 3D Node
**Purpose:** 3D visualization and manipulation

**Inputs:**
- 3D model data
- Scene configuration

**Outputs:**
- Rendered views
- 3D transformations

**Key Features:**
- 3D model loading
- Camera controls
- Lighting setup
- Animation support

## Node Communication

### Connection Types
1. **Direct Connections**: Edge-based data flow between nodes
2. **Variable Broadcasting**: Shared variable system
3. **Form Data Broadcasting**: BAML form data distribution
4. **Context Graph**: Hierarchical context resolution
5. **Event System**: Custom events for node coordination

### Data Flow Patterns
- **Input Variables**: Typed variables from connected nodes
- **Output Propagation**: Send data to connected outputs
- **Bidirectional Updates**: Two-way data synchronization
- **Broadcast Channels**: Multi-node communication
- **Context Inheritance**: Hierarchical data inheritance

## Advanced Features

### BAML Integration
- Automatic form detection
- Data extraction
- Schema generation
- Form field mapping
- Validation rules

### Variable System
- Variable discovery
- Type inference
- Autocomplete support
- Nested variable access
- Variable transformation

### Versioning and History
- Data version tracking
- Change history
- Version comparison
- Rollback support

### Performance Optimization
- Node dormancy detection
- Thumbnail caching
- Lazy loading
- Virtual scrolling
- Worker thread execution

## Node Lifecycle

### Creation
1. Node instantiation with default data
2. Initial configuration
3. Connection establishment
4. Variable registration

### Updates
1. Data modification
2. Validation
3. Output propagation
4. UI refresh

### Deletion
1. Connection cleanup
2. Variable deregistration
3. Resource disposal
4. Cache clearing

## Best Practices

### Node Design
- Keep nodes focused on single responsibility
- Provide clear inputs and outputs
- Include validation and error handling
- Support theme switching
- Enable variable integration

### Performance
- Minimize re-renders
- Use memoization for expensive operations
- Implement dormancy for inactive nodes
- Batch updates when possible
- Clean up resources on unmount

### User Experience
- Provide visual feedback for operations
- Include helpful placeholder text
- Support keyboard shortcuts
- Enable drag and drop where appropriate
- Maintain consistent UI patterns

## Summary

The Canvas application provides a rich set of nodes for building complex workflows. Each node is built on a common base architecture while providing specialized functionality. The system supports sophisticated data flow patterns, variable management, and integration capabilities, making it suitable for a wide range of automation and workflow scenarios.
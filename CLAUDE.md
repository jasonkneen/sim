# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

**From project root:**
- Build all apps: `bun run build`
- Dev mode (all apps): `bun run dev`
- Dev with realtime sockets: `bun run dev:full`
- Run tests: `bun run test`
- Type check: `bun run type-check`
- Lint check: `bun run lint:check`
- Lint fix: `bun run lint`
- Format check: `bun run format:check`
- Format fix: `bun run format`

**From apps/sim directory:**
- Dev mode (Next.js only): `bun run dev`
- Dev mode (sockets only): `bun run dev:sockets`
- Dev mode (both): `bun run dev:full`
- Build: `bun run build`
- Run single test: `bunx vitest run path/to/test.test.ts`
- Database push: `bunx drizzle-kit push`
- Database studio: `bunx drizzle-kit studio`

## Architecture Overview

This is a monorepo managed with Turborepo and Bun workspaces, containing:

- **apps/sim**: Main Next.js 15 application with Turbopack
- **apps/docs**: Documentation site using Fumadocs
- **packages/***: Shared packages and utilities

### Tech Stack

- **Runtime**: Bun (1.2.12+)
- **Framework**: Next.js 15 with App Router and Turbopack
- **Database**: PostgreSQL with pgvector extension (required for AI embeddings)
- **ORM**: Drizzle ORM
- **Auth**: Better Auth
- **UI**: Shadcn/ui components with Tailwind CSS
- **State**: Zustand stores
- **Flow Editor**: ReactFlow for visual workflow building
- **Realtime**: Socket.io server (runs separately on port 8080)
- **Background Jobs**: Trigger.dev
- **Linting/Formatting**: Biome (replaces ESLint/Prettier)

### Key Architectural Patterns

**1. Socket Server Architecture:**
- Separate Socket.io server runs on port 8080 for realtime features
- Located in `apps/sim/socket-server/`
- Must be running for full functionality (`bun run dev:full` starts both)

**2. Database Requirements:**
- PostgreSQL 12+ with pgvector extension for AI embeddings
- Vector columns used for knowledge bases and semantic search
- Schema defined in `apps/sim/db/schema.ts`

**3. Path Aliases:**
Key aliases configured in tsconfig:
- `@/components/*`: UI components
- `@/lib/*`: Utilities and helpers
- `@/stores/*`: Zustand state stores
- `@/blocks/*`: Workflow block definitions
- `@/tools/*`: AI tool implementations
- `@/executor/*`: Workflow execution logic
- `@/db/*`: Database schema and queries
- `@/serializer/*`: Workflow serialization

**4. Workflow System:**
- Visual workflow builder using ReactFlow
- Block-based architecture for different node types
- Executor system for running workflows
- Tools directory contains AI agent tool implementations

## Code Style

**TypeScript:**
- Strict mode enabled
- Explicit function return types preferred
- Use path aliases for imports

**Formatting (Biome):**
- 2-space indentation
- Single quotes for strings
- No semicolons (ASI)
- Trailing commas in multi-line
- 100 character line width
- Organized imports by groups

**React:**
- Functional components with hooks
- TypeScript for all components
- Shadcn/ui component patterns

## Testing

- **Framework**: Vitest
- **Setup**: `vitest.setup.ts` for test configuration
- **Patterns**: Mock with `vi.mock()` and `vi.spyOn()`
- **Run**: `bun run test` or `bunx vitest run path/to/test.test.ts`

## Development Workflow

1. **Full Development**: Use `bun run dev:full` from project root to start both Next.js and Socket server
2. **Database Changes**: Use Drizzle Kit commands (`bunx drizzle-kit push/migrate`)
3. **Code Quality**: Biome handles both linting and formatting
4. **Testing**: Write tests alongside components/utilities
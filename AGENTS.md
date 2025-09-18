# Repository Guidelines

## Project Structure & Module Organization
- `apps/sim` – Next.js app plus realtime sockets; core views live in `app/`, `blocks/`, and `tools/`.
- `apps/docs` – Fumadocs-powered documentation site; update alongside user-facing changes.
- `packages/` – Shared SDKs (`sdk`, `ts-sdk`, `python-sdk`) and CLI utilities; keep generated clients aligned.
- `scripts/`, `docker/`, `helm/` – Local automation, container recipes, and Helm charts for deployments.
- Root configs (`biome.json`, `turbo.json`, `bunfig.toml`) define formatting, pipelines, and Bun defaults.

## Build, Test, and Development Commands
- `bun install` – Install monorepo dependencies (Bun ≥1.2.13).
- `bun run dev:full` – Launch Next.js plus sockets for parity with production behaviour.
- `bun run build` – Execute `turbo run build`; `prebuild` enforces linting before artifacts are produced.
- `bun run test` – Run every package’s `test` target; gate pull requests on a clean run.
- `bun run lint:check`, `bun run format:check` – Biome linting/formatting in read-only mode.
- `cd apps/sim && bun run db:push` – Apply Drizzle migrations to your local Postgres instance.

## Coding Style & Naming Conventions
- Biome enforces 2-space indentation, LF newlines, single quotes, and sorted Tailwind classes; use `bun run format` to autofix.
- PascalCase React components, camelCase utilities, and kebab-case route/file names keep parity with existing modules.
- Share types through `packages/sdk` (and language-specific SDKs) to avoid duplicating contracts inside `apps/sim`.

## Testing Guidelines
- Vitest + Testing Library power unit/UI specs; colocate `*.test.ts(x)` beside source files.
- `bun run -C apps/sim test:watch` for fast feedback, `bun run -C apps/sim test:coverage` before merging high-impact work.
- Socket-heavy features should run against `bun run dev:sockets` or mock transports to keep tests deterministic.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat(flow): …`, `fix(auth): …`) and branch names like `feat/feature-name`.
- Open PRs against `staging`, rebase before submission, and reference issues (`fixes #123`) plus schema or env changes.
- Include concise descriptions, screenshots or GIFs for UI changes, and note any docs that need follow-up.
- Validate `bun run lint:all`, `bun run type-check`, and relevant test suites locally before requesting review.

## Environment & Security Tips
- Copy `apps/sim/.env.example` to `.env` and populate secrets locally; never commit real credentials.
- PostgreSQL with the `pgvector` extension is required; use `docker compose -f docker-compose.prod.yml up -d` for a preconfigured stack.
- Pass provider keys (OpenAI, Stripe, S3) through environment variables or your deployment platform’s secret store.

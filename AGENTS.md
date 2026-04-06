# Repository Guidelines

## Project Structure & Module Organization
This repository is currently docs-first. Core files:
- `README.md`: short project identifier.
- `docs/PLAN.md`: phased implementation overview.
- `docs/phase-*-spec.md`: phase-specific specs (MVP through advanced features).
- `docs/rds-vue-ui-mcp-server-plan.md`: detailed architecture and source-of-truth plan.

When implementation starts, follow the planned layout from `docs/phase-1-mvp-spec.md` (for example `src/connectors/`, `src/tools/`, `src/cache/`, `src/types/`) and keep tests adjacent to modules or under `tests/`.

## Build, Test, and Development Commands
No build/test toolchain is committed yet. Current contributor workflow is documentation and planning validation:
- `rg --files` — list tracked files quickly.
- `rg "Phase|Acceptance Criteria|Verification" docs/` — verify consistency across specs.
- `git log --oneline` — review prior commit style before committing.

If you add runtime code, also add and document project-standard commands in `README.md` (for example `yarn test`, `yarn build`, `yarn lint`).

## Tech Stack
Use this baseline stack for implementation unless a phase spec explicitly changes it:
- Runtime: Node.js 22+
- Language: TypeScript (strict mode)
- Package manager: Yarn
- MCP SDK: `@modelcontextprotocol/sdk`
- Schema validation: `zod`
- HTTP client: native `fetch` (Node 22) or `undici`
- Registry tarball extraction: `tar`
- Type declaration parsing: `ts-morph`
- Vue SFC parsing: `@vue/compiler-sfc`
- Fuzzy search: `fuse.js`
- Logging: `pino`
- Cache/persistence: filesystem JSON via `fs/promises` in `cache/`
- Visual scraping/screenshots (Phase 2+): `playwright`
- Testing: `vitest` (add `supertest` when HTTP endpoints are introduced)
- Build tool: `tsc` initially (upgrade to `tsup` if bundling/startup needs it)
- Remote deployment target (Phase 4): Fly.io (containerized Node + Playwright)

## Coding Style & Naming Conventions
For Markdown docs:
- Use clear, scannable headings (`## Objective`, `## Scope`, `## Verification`).
- Prefer short bullets and deterministic wording for tool contracts.
- Keep filenames kebab-case and phase-oriented (for example `phase-3-freshness-automation-spec.md`).

For future TypeScript code, follow the structure and naming described in Phase 1 specs (connector-focused modules, explicit types, schema-validated responses).

## Testing Guidelines
Today, validate by cross-checking requirements and acceptance criteria across docs.
Before opening a PR:
- Ensure each phase spec includes `Objective`, `Scope`, `Acceptance Criteria`, and `Verification`.
- Confirm tool names and behaviors are consistent between `PLAN.md` and phase specs.

When tests are introduced, use predictable names like `*.test.ts` and include unit + integration coverage for connectors, cache, and merge logic.

## Commit & Pull Request Guidelines
Current history uses short, imperative commit subjects (for example: `specs for phasewise implementation and PLAN.md`). Keep commits focused and descriptive.

PRs should include:
- What changed and why.
- Files/sections affected.
- Any contract-impacting changes (tool names, payload fields, acceptance criteria).
- Follow-up work or open questions.

# Phase 1 Spec — MVP (Core MCP on stdio)

## Objective
Deliver a usable local MCP server with core discovery and codegen capabilities.

## Scope
- Runtime/server bootstrap in TypeScript.
- Registry connector (package discovery, metadata fetch, tarball download/extract, `.d.ts` parse).
- Storybook connector (`/index.json` fetch + category/story mapping only).
- Merge layer for component records.
- Persistent cache (`version-map.json`, `components.json`).
- stdio transport.
- Tools:
  - `list_components`
  - `search_components`
  - `get_component_details`
  - `get_component_usage`
  - `get_installation_info`

## Out of Scope
- Playwright scraping.
- Token extraction.
- Screenshot generation.
- Remote HTTP transport and webhook invalidation.

## Required Behavior
- `NPM_REGISTRY_TOKEN` optional; auth header sent only if provided.
- Responses include `lastIndexed` and structured JSON payloads.
- Usage/install responses include private registry install command and import statement.
- Component resolution accepts package name and common aliases (`RdsButton`, `button`, `@rds-vue-ui/button`).

## Suggested Structure
- `src/index.ts`, `src/server.ts`
- `src/connectors/registry/*`
- `src/connectors/storybook/index-fetcher.ts`
- `src/cache/*`
- `src/merge/component-merger.ts`
- `src/tools/{discovery,codegen}.ts`
- `src/types/*`

## Acceptance Criteria
- Connectable MCP server in Claude, Cursor, and Codex agent over stdio.
- Tool outputs are schema-valid and consistent.
- Restart uses disk cache without full re-index.
- No auth required for current public registry.

## Verification
- Unit tests: parser, merger, cache, resolver.
- Integration tests: mocked registry + mocked Storybook index.
- CLI smoke test calling all Phase 1 tools.

# rds-mcp-server
Rocket Design System (RDS) MCP Server.

## Phase 1 (MVP) Status
Implemented:
- stdio MCP server bootstrap
- registry connector (`@rds-vue-ui/*` discovery + metadata + tarball + `.d.ts` parsing)
- Storybook `index.json` ingestion (category + story mapping)
- merged component index with disk cache persistence
- core tools:
  - `list_components`
  - `search_components`
  - `get_component_details`
  - `get_component_usage`
  - `get_installation_info`

## Phase 2 Status
Implemented:
- Playwright-backed Storybook foundations extraction
- Incremental theme/token/guideline cache persisted under `CACHE_DIR`
- Delay between Storybook calls to reduce transient 404/early-load issues
- Partial failure handling (failed story extraction does not fail full refresh)
- visual tools:
  - `list_themes`
  - `get_design_tokens`
  - `get_foundation_guidelines`
  - `screenshot_story`

## Setup
1. Install dependencies:
```bash
yarn install
```

2. Configure environment:
```bash
cp .env.example .env
```

`NPM_REGISTRY_TOKEN` is optional while the registry is public.
The server auto-loads `.env` at startup.
Use `STORYBOOK_CALL_DELAY_MS` to tune request pacing between Storybook calls.

3. Build:
```bash
yarn build
```

4. Run server:
```bash
yarn start
```

## Dev Commands
- `yarn dev`
- `yarn typecheck`
- `yarn build`
- `yarn test`

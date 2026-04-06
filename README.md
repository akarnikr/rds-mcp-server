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

# Phase 1 Spec — MVP (Core MCP on stdio)

## Objective
Deliver a usable local MCP server with core discovery and codegen capabilities.

## Scope
- Runtime/server bootstrap in TypeScript.
- Storybook connector (`/index.json` fetch + category/story mapping).
- Merge layer that can build `ComponentInfo` from Storybook-only metadata.
- Registry connector remains optional and must not block indexing.
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
- Index refresh succeeds when only Storybook is reachable.
- Storybook-only component records use a sentinel version (for example `storybook-only`) and set source metadata accordingly.
- Discovery/codegen tools include source-qualified metadata (`sourceMeta`, `metadataCompleteness`, and warnings where relevant).
- Installation info reports unresolved inputs and low-confidence mappings.
- Refresh is non-destructive on partial failures (failed merges keep prior cached records).

## Source Strategy
- Storybook is the canonical discovery source for Phase 1 indexing.
- Registry enrichment is optional and can be added without changing the tool contract.
- Registry failures must degrade metadata quality only; they must not produce an empty component index when Storybook data exists.
- Storybook mapping includes confidence scoring (`high|medium|low`) and collision-safe grouping.
- Non-component Storybook sections (for example foundations/introduction) are excluded from component indexing.

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
- `list_components` returns non-empty output when Storybook is available even if registry endpoints fail.
- `get_component_details` and `get_component_usage` include completeness + warning metadata.
- `get_installation_info` includes `unresolved` and `lowConfidenceMappings` diagnostics.
- A failed merge for one package does not block persistence for other packages.

## Verification
- Unit tests: parser, merger, cache, resolver.
- Integration tests: mocked Storybook index with and without registry availability.
- CLI smoke test calling all Phase 1 tools.
- Storybook-only compatibility test:
  - Verify `refresh()` persists components from Storybook map without registry responses.
  - Verify resulting `ComponentInfo.sourceMeta.registry` is `false` for Storybook-only records.
- Tool contract test:
  - Verify discovery/codegen responses contain `metadataCompleteness` and source/warning fields.
- Mapping-quality test:
  - Verify foundations/introduction entries are filtered.
  - Verify component leaf-title mapping (for example `CardInfoHorizontal`) yields expected package slug.

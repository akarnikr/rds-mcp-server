# RDS Vue UI MCP Server — Implementation Plan

## Goal
Build an MCP server that gives AI coding agents accurate, current, and actionable context for the `@rds-vue-ui/*` library, including component APIs, usage examples, design tokens, and visual references.

## High-Level Strategy
Implement in phased increments to de-risk delivery:

1. Phase 1 (MVP): Core discovery/codegen over stdio with registry + Storybook index integration.
2. Phase 2: Playwright-powered Storybook scraping for tokens and screenshots.
3. Phase 3: Freshness automation with polling, diff-based re-indexing, and update tools.
4. Phase 4: Remote deployment over HTTP with auth and operational hardening.
5. Phase 5: Advanced features (validation, accessibility metadata, prerelease channels, patterns).

## Source Priority Policy
- Storybook-first for category/story organization and docs-oriented labels.
- Registry fallback for missing/stale API details (props/events/slots/dependencies/version).
- Each merged record should keep source metadata and `lastIndexed` timestamps.

## Cross-Phase Non-Functional Requirements
- Deterministic JSON tool responses.
- Strong schema validation using `zod`.
- Disk-backed cache for restart speed.
- Structured logging and clear error semantics.
- Backward-compatible tool contract evolution.

## Success Targets
- Staleness: <= 5 minutes after publish (Phase 3+).
- Cached response latency: < 100ms.
- Screenshot (uncached): < 5s.
- Full re-index (~50 components): < 2 minutes.
- Cold start from persisted cache: < 3 seconds.

## Documents
- `phase-1-mvp-spec.md`
- `phase-2-storybook-visual-spec.md`
- `phase-3-freshness-automation-spec.md`
- `phase-4-remote-deployment-spec.md`
- `phase-5-advanced-features-spec.md`
- `rds-vue-ui-mcp-server-plan.md` (source plan)

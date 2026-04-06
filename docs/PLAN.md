# RDS Vue UI MCP Server — Implementation Plan

## Goal
Build an MCP server that gives AI coding agents accurate, current, and actionable context for the `@rds-vue-ui/*` library, including component APIs, usage examples, design tokens, and visual references.

## High-Level Strategy
Implement in phased increments to de-risk delivery:

1. Phase 1 (MVP): Core discovery/codegen over stdio with Storybook-first indexing and optional registry enrichment.
2. Phase 2: Playwright-powered Storybook scraping for tokens and screenshots.
3. Phase 3: Freshness automation with polling, diff-based re-indexing, and update tools.
4. Phase 4: Remote deployment over HTTP with auth and operational hardening.
5. Phase 5: Advanced features (validation, accessibility metadata, prerelease channels, patterns).

## Source Priority Policy
- Storybook is the baseline source for discovery and indexing.
- Registry is a non-blocking enrichment source for API metadata when available.
- Each merged record keeps source metadata and `lastIndexed` timestamps so clients can reason about completeness.
- Storybook mapping applies confidence scoring and excludes non-component sections to reduce false package inference.
- Refresh operations are partial-failure tolerant and avoid destructive pruning when merge errors occur.

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

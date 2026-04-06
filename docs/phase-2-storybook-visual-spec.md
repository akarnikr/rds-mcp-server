# Phase 2 Spec — Storybook Scraping, Tokens, and Visuals

## Objective
Add visual and foundation/theme intelligence via Playwright, while preserving Phase 1 Storybook-first component indexing and tool contracts.

## Scope
- Playwright runtime with context/page lifecycle management.
- Storybook Foundations extractors for:
  - palette
  - typography
  - spacing
  - breakpoints
  - shadows (if available)
- Theme profile extraction from foundation/theme pages (for example Base, AirUniversity, Army, DSL, Starbucks when present).
- Screenshot capture for individual stories.
- Build-aware screenshot and foundation cache.
- Tools:
  - `list_themes`
  - `get_design_tokens`
  - `get_foundation_guidelines`
  - `screenshot_story`

## Implementation Notes
- Add extractor discovery mode for DOM drift debugging.
- Include retry/backoff for flaky loads.
- Normalize viewport presets (`mobile`, `tablet`, `desktop`).
- Keep current component discovery path unchanged (`list_components`, `search_components`, `get_component_details`, `get_component_usage`, `get_installation_info`).
- Do not re-introduce registry dependency for Phase 2 indexing; registry remains optional enrichment only.
- Continue emitting source-quality diagnostics (`sourceMeta`, `metadataCompleteness`, warnings) and extend them for theme/foundation outputs.

## Data Contract Expectations
- Tokens return normalized maps and raw source hints.
- Palette includes color name, value, optional CSS var, optional contrast metadata.
- Theme output includes:
  - `themeId`
  - `themeName`
  - `sourcePath` (Storybook title/id references)
  - `mappingConfidence` (`high|medium|low`)
  - `tokenCoverage` summary.
- Foundation guideline output includes normalized sections (`color`, `typography`, `spacing`, `layout`) plus source excerpts/anchors.
- Screenshots return base64 PNG + cache metadata.

## Acceptance Criteria
- Theme/foundation scraping succeeds for known Foundations pages without breaking existing component tools.
- Foundation-only failures degrade gracefully (existing component index still serves cached/current data).
- Cached screenshots are fast and build-aware invalidation works.
- New tool responses are deterministic JSON with completeness/warning metadata.
- Graceful error handling on Storybook load failures.

## Verification
- Unit tests for extractor mapping, confidence scoring, and cache keying.
- Integration tests for representative story capture and foundation/theme extraction.
- Contract tests for new tools (`list_themes`, `get_design_tokens`, `get_foundation_guidelines`) and backward-compat checks for Phase 1 tools.
- Snapshot tests for token/foundation payload schema.

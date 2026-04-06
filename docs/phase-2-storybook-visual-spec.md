# Phase 2 Spec — Storybook Scraping, Tokens, and Visuals

## Objective
Add visual and design-token intelligence via Playwright.

## Scope
- Playwright runtime with context/page lifecycle management.
- Storybook Foundations extractors for:
  - palette
  - typography
  - spacing
  - breakpoints
  - shadows (if available)
- Screenshot capture for individual stories.
- Version-aware screenshot cache.
- Tools:
  - `get_design_tokens`
  - `get_color_palette`
  - `screenshot_story`

## Implementation Notes
- Add extractor discovery mode for DOM drift debugging.
- Include retry/backoff for flaky loads.
- Normalize viewport presets (`mobile`, `tablet`, `desktop`).

## Data Contract Expectations
- Tokens return normalized maps and raw source hints.
- Palette includes color name, value, optional CSS var, optional contrast metadata.
- Screenshots return base64 PNG + cache metadata.

## Acceptance Criteria
- Token scraping succeeds for all known Foundations pages.
- Cached screenshots are fast and version invalidation works.
- Graceful error handling on Storybook load failures.

## Verification
- Unit tests for extractor mapping and cache keying.
- Integration tests for representative story capture.
- Snapshot tests for token payload schema.

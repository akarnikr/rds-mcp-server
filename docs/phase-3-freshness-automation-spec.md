# Phase 3 Spec — Freshness Automation and Update Intelligence

## Objective
Ensure data stays current with minimal manual intervention.

## Scope
- Background poller every 6 hours.
- Diff-based version detection:
  - `UNCHANGED`
  - `UPDATED`
  - `NEW`
  - `REMOVED`
- Surgical re-indexing for changed packages only.
- Cache invalidation for affected component/tokens/screenshots.
- Webhook endpoint for CI-triggered invalidation.
- On-demand refresh endpoint/tool path for immediate re-index when requested by users or agents.
- Tools:
  - `check_for_updates`
  - `refresh_components`
  - `whats_new`

## Required Behavior
- No full re-index when no changes detected.
- `refresh_components` supports both scoped refresh (`packages[]`) and full refresh (`all`) on demand.
- On-demand refresh bypasses the poll schedule and starts indexing immediately.
- `whats_new` supports `since` date/version inputs.
- All tool responses include freshness timestamps.

## Security
- Webhook protected by shared secret.
- Audit log for refresh/invalidation actions.

## Acceptance Criteria
- Publish-to-availability <= 6 hours via poller, or near-immediate via webhook/on-demand refresh.
- Stable incremental refresh under partial upstream failure.
- Change summaries correctly list new/updated/deprecated packages.

## Verification
- Integration tests for diff scenarios.
- Poller resilience tests (timeouts/retries).
- End-to-end update flow test with simulated publish events.

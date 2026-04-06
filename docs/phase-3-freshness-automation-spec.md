# Phase 3 Spec — Freshness Automation and Update Intelligence

## Objective
Ensure data stays current with minimal manual intervention.

## Scope
- Background poller every 5 minutes.
- Diff-based version detection:
  - `UNCHANGED`
  - `UPDATED`
  - `NEW`
  - `REMOVED`
- Surgical re-indexing for changed packages only.
- Cache invalidation for affected component/tokens/screenshots.
- Webhook endpoint for CI-triggered invalidation.
- Tools:
  - `check_for_updates`
  - `refresh_components`
  - `whats_new`

## Required Behavior
- No full re-index when no changes detected.
- `whats_new` supports `since` date/version inputs.
- All tool responses include freshness timestamps.

## Security
- Webhook protected by shared secret.
- Audit log for refresh/invalidation actions.

## Acceptance Criteria
- Publish-to-availability <= 5 minutes (or faster with webhook).
- Stable incremental refresh under partial upstream failure.
- Change summaries correctly list new/updated/deprecated packages.

## Verification
- Integration tests for diff scenarios.
- Poller resilience tests (timeouts/retries).
- End-to-end update flow test with simulated publish events.

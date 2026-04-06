# Phase 5 Spec — Advanced Agent Assistance Features

## Objective
Increase agent accuracy and capability beyond basic discovery.

## Scope
- `screenshot_all_variants` for batch visual coverage.
- `validate_usage` for snippet-level API correctness checks.
- `get_accessibility_info` (ARIA, keyboard patterns, a11y notes).
- `get_layout_patterns` for common component compositions.
- Prerelease channel support (`beta`, `next`) with explicit opt-in.
- Multi-theme support where available.

## Design Principles
- Keep stable and prerelease outputs clearly separated.
- Return machine-readable diagnostics for validation tools.
- Preserve deterministic responses across repeated calls.

## Acceptance Criteria
- Validation detects incorrect props/slots/events with high precision.
- Batch screenshots complete within bounded concurrency limits.
- Prerelease querying never pollutes stable defaults.

## Verification
- Contract tests for new tool schemas.
- Regression tests to ensure Phase 1-4 tools remain stable.
- Performance checks under advanced feature load.

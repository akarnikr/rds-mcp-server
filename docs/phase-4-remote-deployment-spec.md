# Phase 4 Spec — Remote MCP Deployment (HTTP)

## Objective
Enable team-wide shared MCP endpoint with production-grade operations.

## Scope
- Add Streamable HTTP transport alongside stdio.
- Deploy target: Fly.io.
- API key auth (initial); extensible path to OAuth 2.1 PKCE.
- Health/readiness endpoints (`/health`, `/ready`).
- Secrets management and environment hardening.
- Persistent cache volume configuration.

## Operational Requirements
- Structured logs with request correlation IDs.
- Rate limiting and basic abuse controls.
- Rollout strategy with staged environment and rollback plan.

## Endpoint
- Planned MCP endpoint: `https://mcp.rds-vue-ui.edpl.us/mcp`

## Acceptance Criteria
- Multiple users can connect concurrently.
- Cold start from persisted cache < 3 seconds.
- Auth enforcement + health checks verified in staging.

## Verification
- Smoke tests from Claude, Cursor, and Codex agent clients.
- Load test for concurrent tool usage.
- Failover/restart test for cache persistence.

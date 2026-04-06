# RDS Vue UI — MCP Server Plan

## 1. Purpose

Build an MCP server that gives AI coding agents complete, always-current context about the **@rds-vue-ui** component library. Agents connecting to this server will be able to discover components, look up props/slots/events, get working code snippets, inspect design tokens, and visually verify component appearance — all through standard MCP tool calls.

---

## 2. Data Sources

The server draws from two complementary sources. Each source has a distinct role; neither is redundant.

### 2.1 npm Registry (Primary — API & Versioning)

| Detail | Value |
|---|---|
| URL | `https://npm.edpl.us/` |
| Scope | `@rds-vue-ui/*` |
| Type | Private registry (likely Verdaccio) |
| Auth | Bearer token (read-only service account) |

**What it provides:**

- Canonical list of every published component package
- Version history and dist-tags (`latest`, `beta`, `next`)
- Publish timestamps per version (the `time` object in metadata)
- Downloadable tarballs containing `.d.ts` type declarations, built `.js` files, source `.vue` files (if shipped), and per-package `README.md`
- Dependency and peer-dependency graphs between components
- Deprecation status

**API endpoints used:**

| Endpoint | Purpose |
|---|---|
| `GET /-/v1/search?text=@rds-vue-ui&size=250` | Discover all packages under the scope |
| `GET /@rds-vue-ui/{name}` | Full metadata for a single package (all versions, dist-tags, time) |
| `GET /@rds-vue-ui/{name}/-/{name}-{version}.tgz` | Download a specific version's tarball |

### 2.2 Storybook (Secondary — Visual & Organizational)

| Detail | Value |
|---|---|
| URL | `https://rds-vue-ui.edpl.us/` |
| Type | Deployed Storybook (SPA) |
| Auth | None (public) |

**What it provides:**

- Component categories and navigation hierarchy (e.g., `Foundations > Base Theme > Palette`)
- Story variants per component (Primary, Disabled, Loading, etc.)
- Design tokens: color palette, typography scale, spacing, breakpoints
- Live rendered previews for screenshot capture
- Documentation pages with usage guidance

**Data extraction methods:**

| Method | What it extracts |
|---|---|
| `GET /index.json` | Full story index — component IDs, titles, categories, story counts |
| Playwright headless browser → iframe docs pages | Props tables, slot descriptions, event signatures from rendered docs |
| Playwright headless browser → story canvas | Screenshots of individual component variants |
| Playwright → Foundations pages | Design tokens (palette, typography, spacing) from pages like `/story/foundations-base-theme--palette` |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Server                           │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Registry     │  │  Storybook    │  │  Cache Layer    │  │
│  │  Connector    │  │  Connector    │  │                 │  │
│  │               │  │               │  │  Version Map    │  │
│  │  • Poller     │  │  • Index      │  │  Component DB   │  │
│  │  • Tarball    │  │    Fetcher    │  │  Token Store    │  │
│  │    Downloader │  │  • Playwright │  │  Screenshot     │  │
│  │  • .d.ts      │  │    Scraper    │  │    Cache        │  │
│  │    Parser     │  │  • Screenshot │  │                 │  │
│  │  • .vue       │  │    Engine     │  │  TTL + Version  │  │
│  │    Parser     │  │               │  │  Keyed          │  │
│  └───────┬───────┘  └───────┬───────┘  └────────┬────────┘  │
│          │                  │                    │           │
│          └──────────┬───────┘                    │           │
│                     ▼                            │           │
│          ┌──────────────────┐                    │           │
│          │  Component Index │◄───────────────────┘           │
│          │  (Merged View)   │                                │
│          └────────┬─────────┘                                │
│                   ▼                                          │
│          ┌──────────────────┐                                │
│          │  Tool Handlers   │                                │
│          │                  │                                │
│          │  Discovery       │                                │
│          │  Code Generation │                                │
│          │  Design Tokens   │                                │
│          │  Visual          │                                │
│          │  Freshness       │                                │
│          └────────┬─────────┘                                │
│                   │                                          │
│         ┌─────────┴──────────┐                               │
│         │  Transport Layer   │                               │
│         │  stdio (local)     │                               │
│         │  Streamable HTTP   │                               │
│         │  (remote)          │                               │
│         └────────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
     Claude Code       Cursor         VS Code Copilot
```

---

## 4. Project Structure

```
rds-vue-ui-mcp/
├── src/
│   ├── index.ts                    # Entry point — starts MCP server
│   ├── server.ts                   # McpServer setup, tool registration
│   │
│   ├── connectors/
│   │   ├── registry/
│   │   │   ├── client.ts           # HTTP client for npm.edpl.us
│   │   │   ├── poller.ts           # Periodic version-check loop
│   │   │   ├── tarball.ts          # Download + extract .tgz files
│   │   │   ├── dts-parser.ts       # Parse .d.ts files → prop/event/slot types
│   │   │   └── vue-parser.ts       # Parse .vue SFCs → template patterns, usage
│   │   │
│   │   └── storybook/
│   │       ├── index-fetcher.ts    # Fetch + parse /index.json
│   │       ├── docs-scraper.ts     # Playwright: scrape docs iframe for props tables
│   │       ├── token-scraper.ts    # Playwright: extract design tokens from Foundations pages
│   │       └── screenshot.ts       # Playwright: capture story renders as images
│   │
│   ├── cache/
│   │   ├── version-map.ts          # { packageName → lastIndexedVersion } lookup
│   │   ├── component-store.ts      # Merged component data (registry + storybook)
│   │   └── persistence.ts          # Write/read cache to disk for fast restarts
│   │
│   ├── tools/
│   │   ├── discovery.ts            # list_components, search_components, get_component_details
│   │   ├── codegen.ts              # get_component_usage, get_installation_info
│   │   ├── tokens.ts               # get_design_tokens, get_color_palette, get_typography
│   │   ├── visual.ts               # screenshot_story, screenshot_all_variants
│   │   └── freshness.ts            # check_for_updates, refresh_components, whats_new
│   │
│   ├── merge/
│   │   └── component-merger.ts     # Merge registry data + storybook data into unified model
│   │
│   └── types/
│       ├── component.ts            # ComponentInfo, PropDef, SlotDef, EventDef
│       ├── token.ts                # ColorToken, TypographyToken, SpacingToken
│       └── registry.ts             # NpmPackageMetadata, TarballContents
│
├── cache/                          # Persisted cache files (gitignored)
│   ├── version-map.json
│   ├── components.json
│   └── screenshots/
│
├── .env.example                    # NPM_REGISTRY_URL, NPM_TOKEN, STORYBOOK_URL
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. MCP Tools

### 5.1 Discovery Tools

#### `list_components`

Returns the full component inventory grouped by category.

- **Input:** `{ category?: string }` — optional filter (e.g., "Foundations", "Forms")
- **Source:** Registry search API (package list) + Storybook index.json (category mapping)
- **Output:** Array of `{ name, package, version, category, description, storyCount }`
- **Freshness:** Served from cache; background poll ensures ≤5 min staleness

#### `search_components`

Fuzzy search across component names, descriptions, and prop names.

- **Input:** `{ query: string }` — e.g., "date picker", "form validation", "icon"
- **Source:** Cached component index (pre-built search index)
- **Output:** Ranked results with `{ name, package, relevance, matchedField }`

#### `get_component_details`

Full API reference for a single component.

- **Input:** `{ component: string }` — e.g., "RdsButton" or "@rds-vue-ui/button"
- **Source:** Registry tarball (`.d.ts` → props, events, slots) + Storybook (stories list, category)
- **Output:**
  ```
  {
    name, package, version, description, category,
    props: [{ name, type, required, default, description }],
    events: [{ name, payload, description }],
    slots: [{ name, props, description }],
    stories: ["Primary", "Disabled", "WithIcon", ...],
    peerDependencies: { ... },
    lastPublished: "2026-04-01T..."
  }
  ```

### 5.2 Code Generation Tools

#### `get_component_usage`

Returns ready-to-paste Vue code showing how to use a component.

- **Input:** `{ component: string, variant?: string }`
- **Source:** Registry tarball (story source files or example files) + Storybook (story args for each variant)
- **Output:**
  ```
  {
    import: "import { RdsButton } from '@rds-vue-ui/button'",
    template: '<RdsButton variant="primary" size="md" @click="handleClick">Submit</RdsButton>',
    fullExample: "<!-- complete SFC example -->",
    install: "npm install @rds-vue-ui/button --registry https://npm.edpl.us"
  }
  ```

#### `get_installation_info`

Returns install commands and configuration for one or more components.

- **Input:** `{ components: string[] }`
- **Source:** Registry metadata (package names, versions, peer dependencies)
- **Output:** npm/yarn/pnpm install commands, `.npmrc` configuration for the private registry, required peer dependencies

### 5.3 Design Token Tools

#### `get_design_tokens`

Returns the full design token set or a filtered subset.

- **Input:** `{ category?: "color" | "typography" | "spacing" | "breakpoints" }`
- **Source:** Storybook Foundations pages via Playwright (e.g., `/story/foundations-base-theme--palette`) + registry tarball (if tokens are exported as JS/CSS variables)
- **Output:**
  ```
  {
    colors: { primary: "#...", secondary: "#...", ... },
    typography: { fontFamily: "...", sizes: { sm, md, lg, ... } },
    spacing: { xs: "4px", sm: "8px", ... },
    breakpoints: { mobile: "640px", tablet: "768px", ... }
  }
  ```

#### `get_color_palette`

Dedicated tool for the color system, since agents need this frequently.

- **Input:** `{ theme?: "base" | "dark" }` — if the library supports multiple themes
- **Source:** Storybook `/story/foundations-base-theme--palette` page
- **Output:** Structured color map with names, hex values, CSS variable names, and contrast ratios

### 5.4 Visual Tools

#### `screenshot_story`

Captures a rendered screenshot of a specific component story.

- **Input:** `{ component: string, story?: string, viewport?: "mobile" | "tablet" | "desktop" }`
- **Source:** Storybook iframe via Playwright
- **Output:** Base64-encoded PNG image
- **Caching:** Screenshots cached by `{component}-{story}-{viewport}-{version}` key; invalidated when the registry detects a new package version

#### `screenshot_all_variants`

Captures all stories for a component in a single call.

- **Input:** `{ component: string, viewport?: string }`
- **Source:** Storybook index (story list) → Playwright (render each)
- **Output:** Array of `{ story, image }` pairs

### 5.5 Freshness & Metadata Tools

#### `check_for_updates`

Reports what's changed since the server last indexed.

- **Input:** none
- **Source:** Registry search API compared against the version map
- **Output:**
  ```
  {
    lastFullIndex: "2026-04-05T10:00:00Z",
    updatedSince: [
      { package: "@rds-vue-ui/datepicker", from: "1.2.0", to: "1.3.0", publishedAt: "..." }
    ],
    newPackages: [ ... ],
    deprecatedPackages: [ ... ]
  }
  ```

#### `refresh_components`

Forces an immediate re-index of all components.

- **Input:** `{ packages?: string[] }` — optional filter to re-index specific packages only
- **Source:** Registry → tarball download → parse; Storybook → re-scrape
- **Output:** Summary of what was refreshed and how long it took

#### `whats_new`

Returns a changelog-style summary of recent library changes.

- **Input:** `{ since?: string }` — ISO date or version number
- **Source:** Registry version history + tarball diff between versions (file list comparison)
- **Output:** Human-readable summary of new components, updated props, breaking changes

---

## 6. Data Merging Strategy

Each component has data from both sources. The merger combines them into a single `ComponentInfo` object.

```
Registry provides:                   Storybook provides:
─────────────────                    ────────────────────
✓ Package name + version             ✓ Category hierarchy
✓ Props (from .d.ts)                 ✓ Story names + variant list
✓ Events (from .d.ts)                ✓ Story args (default values per variant)
✓ Slots (from .d.ts)                 ✓ Props table (fallback if no .d.ts)
✓ Peer dependencies                  ✓ Design tokens
✓ Source code (.vue files)            ✓ Visual screenshots
✓ Version history + timestamps        ✓ Documentation pages
✓ Deprecation status                  ✓ Navigation structure

                    ▼ Merged into ▼

              ComponentInfo {
                // Identity — from registry
                name, package, version, description,
                lastPublished, deprecated,

                // API — from registry (.d.ts), fallback to storybook
                props[], events[], slots[],

                // Organization — from storybook
                category, stories[], storyArgs,

                // Code — from registry (tarball)
                importStatement, usageExample, sourceCode,

                // Visual — from storybook (on demand)
                screenshotUrls[],

                // Meta
                sources: { registry: true, storybook: true },
                lastIndexed: "2026-04-05T..."
              }
```

**Conflict resolution rules:**

| Field | Registry | Storybook | Resolution |
|---|---|---|---|
| Props | `.d.ts` parser output | Scraped docs table | Registry wins (compiler-generated = more accurate) |
| Prop descriptions | JSDoc in `.d.ts` | Docs panel text | Registry first; storybook fills gaps |
| Default values | `.d.ts` or source `.vue` | Story args | Registry for declared defaults; storybook for story-specific defaults |
| Categories | Not available | Storybook sidebar hierarchy | Storybook only source |
| Story list | Not available | `index.json` | Storybook only source |
| Version | `dist-tags.latest` | Not available | Registry only source |
| Visual | Not available | Playwright screenshots | Storybook only source |

---

## 7. Cache & Freshness Strategy

### 7.1 Cache Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Cache Layers                       │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Layer 1: Version Map              TTL: 5 min  │  │
│  │  { "@rds-vue-ui/button": "2.1.0", ... }       │  │
│  │  Source: registry search API                    │  │
│  │  Cost: 1 HTTP GET, ~50ms                        │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Layer 2: Component Data       TTL: version-keyed│ │
│  │  Full props/events/slots per component          │  │
│  │  Source: registry tarball → .d.ts parse          │  │
│  │  Cost: 1 tarball download + parse, ~2-3s each    │  │
│  │  Invalidation: only when version changes         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Layer 3: Storybook Metadata   TTL: 30 min     │  │
│  │  Categories, story lists, navigation            │  │
│  │  Source: storybook /index.json                   │  │
│  │  Cost: 1 HTTP GET, ~100ms                        │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Layer 4: Design Tokens        TTL: 60 min     │  │
│  │  Colors, typography, spacing                     │  │
│  │  Source: storybook Foundations pages (Playwright) │  │
│  │  Cost: browser launch + page render, ~5-10s      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Layer 5: Screenshots         TTL: version-keyed│ │
│  │  PNG images per story per viewport               │  │
│  │  Source: storybook canvas (Playwright)            │  │
│  │  Cost: ~1-2s per screenshot                       │  │
│  │  Generated: on demand, then cached                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Persistence: all layers written to disk (cache/)    │
│  so server restarts don't require full re-index      │
└─────────────────────────────────────────────────────┘
```

### 7.2 Refresh Triggers

| Trigger | What it refreshes | Latency |
|---|---|---|
| **Periodic poll** (every 5 min) | Version map only; if changes detected → affected component data | ≤5 min stale window |
| **CI webhook** (`POST /webhook/invalidate`) | Marks version map stale → immediate re-poll | Seconds after deploy |
| **Agent tool call** (`refresh_components`) | Full re-index of specified or all packages | On demand |
| **Version mismatch** detected during poll | Only the changed packages' tarballs + Storybook data | Surgical, ~3s per component |

### 7.3 Diff-Based Re-indexing

When the poller detects changes, it does not re-index everything:

```
1. Fetch registry search → get current { package: version } map
2. Compare against cached version map
3. Categorize each package:
   - UNCHANGED  → skip entirely
   - UPDATED    → download new tarball, re-parse .d.ts, re-scrape storybook docs
   - NEW        → full index (tarball + storybook)
   - REMOVED    → evict from cache
4. Only updated/new packages trigger Playwright (expensive)
5. Update version map + persist to disk
```

---

## 8. Storybook-Specific Extraction

### 8.1 Foundations / Design Tokens

The Storybook URL `/?path=/story/foundations-base-theme--palette` indicates a structured Foundations section. The server should scrape these pages on startup:

| Storybook Path | What to Extract |
|---|---|
| `foundations-base-theme--palette` | Color palette: names, hex values, CSS variable names |
| `foundations-base-theme--typography` (likely) | Font families, size scale, weight scale, line heights |
| `foundations-base-theme--spacing` (likely) | Spacing tokens, grid system |
| `foundations-base-theme--breakpoints` (likely) | Responsive breakpoints |
| `foundations-base-theme--shadows` (likely) | Box shadow tokens |

**Extraction approach:** Navigate to each Foundations story's iframe URL via Playwright, execute JavaScript on the page to query rendered DOM elements (color swatches, type specimens, spacing demos) and return structured data.

Example custom extractor for the palette page:

```javascript
// Executed inside Playwright on the palette story
() => {
  const swatches = document.querySelectorAll('[class*="color"], [class*="swatch"], [class*="palette"]');
  return Array.from(swatches).map(el => ({
    name: el.getAttribute('data-color-name') || el.textContent?.trim(),
    value: getComputedStyle(el).backgroundColor,
    cssVar: el.getAttribute('data-css-var') || null
  }));
}
```

These extractors will need to be tuned to the actual DOM structure of the Storybook — the first implementation should include a discovery mode that dumps the DOM structure so the extractors can be written accurately.

### 8.2 Component Stories

For each component, the server extracts from Storybook:

- **Story list** from `index.json` — names like "Primary", "Secondary", "Disabled", "WithIcon"
- **Story args** from the docs iframe — the default prop values used in each story
- **Screenshots** from the canvas iframe — rendered visual of each story

---

## 9. Authentication & Security

### 9.1 Registry Auth

```env
NPM_REGISTRY_URL=https://npm.edpl.us
NPM_REGISTRY_TOKEN=<read-only-bearer-token>
```

- Create a dedicated service account on the registry with **read-only** access
- No publish, unpublish, or admin permissions
- Token stored as environment variable, never hardcoded

### 9.2 MCP Server Auth (Remote Deployment)

When deployed as a remote Streamable HTTP server:

- **Internal use:** API key or shared secret in request headers
- **Broader use:** OAuth 2.1 with PKCE (MCP spec requirement for remote servers)
- **Webhook endpoint:** Separate shared secret for CI webhook (`/webhook/invalidate`)

### 9.3 Storybook

- The Storybook at `rds-vue-ui.edpl.us` appears to be public — no auth needed
- If it becomes private, Playwright can handle cookie-based or header-based auth

---

## 10. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js 22+ | MCP SDK is TypeScript-first; npm ecosystem |
| MCP SDK | `@modelcontextprotocol/sdk` | Official SDK, handles protocol, transports |
| Language | TypeScript (strict mode) | Type safety for component metadata models |
| Schema validation | `zod` | Tool input validation (MCP SDK convention) |
| Browser automation | Playwright | Storybook scraping + screenshots; more reliable than Puppeteer |
| TypeScript parsing | `ts-morph` | Parse `.d.ts` files to extract interfaces, types, JSDoc |
| Vue SFC parsing | `@vue/compiler-sfc` | Parse `.vue` files for `defineProps`, `defineEmits`, templates |
| HTTP client | `undici` or native `fetch` | Registry API calls, tarball downloads |
| Tarball extraction | `tar` (npm package) | Extract `.tgz` files from registry |
| File cache | `fs` + JSON | Persist cache across restarts |
| Logging | `pino` | Structured logging with log levels |

---

## 11. Deployment Phases

### Phase 1 — Local stdio server (Week 1–2)

**Goal:** A working MCP server that a single developer connects to from Claude Code or Cursor.

**Scope:**
- Registry connector: poller + tarball download + `.d.ts` parser
- Storybook connector: `index.json` fetcher only (no Playwright yet)
- Tools: `list_components`, `search_components`, `get_component_details`, `get_component_usage`
- Cache: in-memory + JSON file persistence
- Transport: stdio only

**Config:**
```json
{
  "mcpServers": {
    "rds-vue-ui": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "NPM_REGISTRY_URL": "https://npm.edpl.us",
        "NPM_REGISTRY_TOKEN": "...",
        "STORYBOOK_URL": "https://rds-vue-ui.edpl.us"
      }
    }
  }
}
```

### Phase 2 — Add Storybook scraping + tokens (Week 3)

**Goal:** Design token extraction and visual screenshots.

**Scope:**
- Playwright integration for Foundations pages (palette, typography, spacing)
- Tools: `get_design_tokens`, `get_color_palette`, `screenshot_story`
- Custom DOM extractors tuned to the actual Storybook markup
- Screenshot caching keyed by component version

### Phase 3 — Freshness automation (Week 4)

**Goal:** The server stays current without manual intervention.

**Scope:**
- Background polling loop (every 5 min)
- Diff-based re-indexing (only changed packages)
- CI webhook endpoint for instant invalidation after deploys
- Tools: `check_for_updates`, `refresh_components`, `whats_new`
- Every tool response includes `lastIndexed` timestamp

### Phase 4 — Remote deployment (Week 5–6)

**Goal:** Any team member connects with a single URL.

**Scope:**
- Switch transport to Streamable HTTP
- Deploy to Cloudflare Workers, Fly.io, or internal infrastructure
- Add API key or OAuth authentication
- Health check endpoint at `/health`
- Endpoint: `https://mcp.rds-vue-ui.edpl.us/mcp`

### Phase 5 — Advanced features (Ongoing)

**Goal:** Richer context for agents.

**Scope:**
- `get_layout_patterns` — common component compositions
- `get_accessibility_info` — ARIA attributes, keyboard navigation per component
- `validate_usage` — agent sends a code snippet, server checks if props and slots are used correctly
- Prerelease channel — expose `beta` / `next` dist-tag components separately
- Multi-theme support — if the library ships dark mode or alternate themes

---

## 12. Tool Response Design Principles

Every tool response should follow these rules so agents produce accurate code:

1. **Always include the npm install command** with the private registry URL — agents will otherwise default to `npmjs.org` and fail.

2. **Always include the import statement** — agents need to know whether to import from `@rds-vue-ui/button` or `@rds-vue-ui/components`.

3. **Always include the `lastIndexed` timestamp** — makes staleness visible in the conversation.

4. **Props should include CSS variable names** alongside token names — so agents write `var(--rds-color-primary)` not `#3B82F6`.

5. **Keep responses concise** — an agent asking about a button doesn't need the entire design system. Return focused data; let the agent call `get_design_tokens` separately if needed.

6. **Return structured JSON, not prose** — agents parse JSON reliably; they hallucinate when interpreting narrative text.

---

## 13. Example Tool Interaction

A developer asks their AI agent: *"Create a form with an email input, password input, and submit button using our RDS components."*

The agent would make these MCP calls:

```
1. search_components({ query: "input" })
   → finds @rds-vue-ui/input, @rds-vue-ui/text-field

2. search_components({ query: "button" })
   → finds @rds-vue-ui/button

3. get_component_details({ component: "@rds-vue-ui/text-field" })
   → returns props: type, label, placeholder, rules, modelValue, ...

4. get_component_details({ component: "@rds-vue-ui/button" })
   → returns props: variant, size, disabled, loading, ...

5. get_component_usage({ component: "@rds-vue-ui/text-field", variant: "Primary" })
   → returns working <RdsTextField> snippet

6. get_design_tokens({ category: "spacing" })
   → returns spacing scale for form layout

7. get_installation_info({ components: ["@rds-vue-ui/text-field", "@rds-vue-ui/button"] })
   → returns: npm install @rds-vue-ui/text-field @rds-vue-ui/button --registry https://npm.edpl.us
```

The agent then assembles a complete Vue SFC using the real component APIs, correct imports, proper design tokens, and the right install command.

---

## 14. Success Metrics

| Metric | Target |
|---|---|
| Component data staleness | ≤ 5 minutes after a registry publish |
| Tool response time (cached) | < 100ms |
| Tool response time (screenshot, uncached) | < 5 seconds |
| Agent code accuracy (uses correct props) | > 95% with MCP vs ~60% without |
| Full re-index time (50 components) | < 2 minutes |
| Server cold start (from persisted cache) | < 3 seconds |

import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fetchStorybookIndex } from "../connectors/storybook/index-fetcher.js";
import type { AppConfig } from "../config.js";
import type { Logger } from "../logger.js";
import type {
  DesignToken,
  DesignTokenResponse,
  FoundationGuidelineSection,
  FoundationGuidelinesResponse,
  MappingConfidence,
  ScreenshotStoryResponse,
  ThemeSummary,
} from "../types/foundation.js";
import type { StorybookIndex, StorybookIndexEntry } from "../types/storybook.js";

const execFileAsync = promisify(execFile);

type ThemeCacheItem = {
  fingerprint: string;
  summary: ThemeSummary;
  tokens: DesignToken[];
  guidelines: FoundationGuidelinesResponse["sections"];
};

type VisualCache = {
  fingerprint: string;
  updatedAt: string;
  themes: Record<string, ThemeCacheItem>;
};

const CACHE_FILE = "phase2-visuals.json";

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 1024 },
} as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toThemeId(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function confidenceFromStoryCount(count: number): MappingConfidence {
  if (count >= 4) {
    return "high";
  }
  if (count >= 2) {
    return "medium";
  }
  return "low";
}

function classifyToken(name: string): DesignToken["category"] {
  const n = name.toLowerCase();
  if (n.includes("color") || n.includes("gray") || n.includes("grey") || n.includes("bg") || n.includes("surface")) {
    return "color";
  }
  if (n.includes("font") || n.includes("type") || n.includes("line-height") || n.includes("letter")) {
    return "typography";
  }
  if (n.includes("space") || n.includes("padding") || n.includes("margin") || n.includes("gap")) {
    return "spacing";
  }
  if (n.includes("breakpoint") || n.includes("container") || n.includes("grid") || n.includes("layout")) {
    return "layout";
  }
  return "other";
}

function topicFromStoryName(name: string): FoundationGuidelineSection["name"] | null {
  const n = name.toLowerCase();
  if (n.includes("palette") || n.includes("color")) {
    return "color";
  }
  if (n.includes("heading") || n.includes("body") || n.includes("typography") || n.includes("text")) {
    return "typography";
  }
  if (n.includes("spacing")) {
    return "spacing";
  }
  if (n.includes("breakpoint") || n.includes("container") || n.includes("grid") || n.includes("layout")) {
    return "layout";
  }
  return null;
}

function buildFingerprint(entries: StorybookIndexEntry[]): string {
  return entries
    .map((entry) => `${entry.id}|${entry.title}|${entry.name}|${entry.type}`)
    .sort()
    .join("||");
}

function extractFoundationEntries(index: StorybookIndex): StorybookIndexEntry[] {
  return Object.values(index.entries).filter((entry) => entry.title.toLowerCase().startsWith("foundations/"));
}

function groupFoundationEntriesByTheme(entries: StorybookIndexEntry[]) {
  const byTheme = new Map<string, StorybookIndexEntry[]>();
  for (const entry of entries) {
    const parts = entry.title.split("/");
    if (parts.length < 2) {
      continue;
    }
    const themeName = parts[1].trim();
    if (!themeName) {
      continue;
    }
    const key = toThemeId(themeName);
    if (!byTheme.has(key)) {
      byTheme.set(key, []);
    }
    byTheme.get(key)!.push(entry);
  }
  return byTheme;
}

async function readJsonFile<T>(path: string): Promise<T | undefined> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

async function runPlaywrightExtract(url: string, timeoutMs: number) {
  const script = `
    const { chromium } = await import("playwright");
    const targetUrl = process.argv[1];
    const timeout = Number(process.argv[2]);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout });
      const payload = await page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        const tokens = [];
        for (let i = 0; i < styles.length; i += 1) {
          const name = styles[i];
          if (!name.startsWith("--")) continue;
          const value = styles.getPropertyValue(name).trim();
          if (!value) continue;
          tokens.push({ name, value });
        }
        const bodyText = (document.body?.innerText || "").slice(0, 1600);
        return { tokens, bodyText };
      });
      console.log(JSON.stringify(payload));
      await page.close();
    } finally {
      await browser.close();
    }
  `;
  const { stdout } = await execFileAsync("node", ["--input-type=module", "-e", script, url, String(timeoutMs)], {
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout.trim()) as { tokens: Array<{ name: string; value: string }>; bodyText: string };
}

async function runPlaywrightScreenshot(url: string, timeoutMs: number, viewport: { width: number; height: number }, outputPath: string) {
  const script = `
    const { chromium } = await import("playwright");
    const targetUrl = process.argv[1];
    const timeout = Number(process.argv[2]);
    const width = Number(process.argv[3]);
    const height = Number(process.argv[4]);
    const out = process.argv[5];
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout });
      await page.screenshot({ path: out, fullPage: true });
      await page.close();
    } finally {
      await browser.close();
    }
  `;
  await execFileAsync("node", ["--input-type=module", "-e", script, url, String(timeoutMs), String(viewport.width), String(viewport.height), outputPath], {
    maxBuffer: 10 * 1024 * 1024,
  });
}

export class StorybookVisualsService {
  private readonly cachePath: string;
  private readonly screenshotsDir: string;
  private cache: VisualCache = {
    fingerprint: "",
    updatedAt: "",
    themes: {},
  };

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {
    this.cachePath = join(config.CACHE_DIR, CACHE_FILE);
    this.screenshotsDir = join(config.CACHE_DIR, "screenshots");
  }

  async initialize(): Promise<void> {
    const existing = await readJsonFile<VisualCache>(this.cachePath);
    if (existing) {
      this.cache = existing;
    }
    await mkdir(this.config.CACHE_DIR, { recursive: true });
    await mkdir(this.screenshotsDir, { recursive: true });
  }

  async refresh(): Promise<{ refreshedThemes: number; skippedThemes: number; failedStories: number }> {
    const index = await fetchStorybookIndex(this.config.STORYBOOK_URL);
    const foundationEntries = extractFoundationEntries(index);
    const fingerprint = buildFingerprint(foundationEntries);

    if (fingerprint === this.cache.fingerprint) {
      return { refreshedThemes: 0, skippedThemes: Object.keys(this.cache.themes).length, failedStories: 0 };
    }

    const grouped = groupFoundationEntriesByTheme(foundationEntries);
    const nextThemes = { ...this.cache.themes };
    let refreshedThemes = 0;
    let skippedThemes = 0;
    let failedStories = 0;

    for (const [themeId, entries] of grouped) {
      const prior = this.cache.themes[themeId];
      const themeFingerprint = buildFingerprint(entries);
      if (prior && prior.fingerprint === themeFingerprint) {
        skippedThemes += 1;
        continue;
      }

      const themeName = entries[0].title.split("/")[1].trim();
      const sourcePath = `Foundations/${themeName}`;
      const tokensByName = new Map<string, DesignToken>();
      const sectionsMap: Record<FoundationGuidelineSection["name"], FoundationGuidelineSection> = {
        color: { name: "color", guidance: [], sourceStories: [] },
        typography: { name: "typography", guidance: [], sourceStories: [] },
        spacing: { name: "spacing", guidance: [], sourceStories: [] },
        layout: { name: "layout", guidance: [], sourceStories: [] },
      };

      let successCount = 0;

      for (const entry of entries) {
        const topic = topicFromStoryName(entry.name);
        if (!topic) {
          continue;
        }
        try {
          await sleep(this.config.STORYBOOK_CALL_DELAY_MS);
          const target = new URL(`/iframe.html?id=${entry.id}&viewMode=story`, this.config.STORYBOOK_URL).toString();
          const extracted = await runPlaywrightExtract(target, this.config.STORYBOOK_NAV_TIMEOUT_MS);

          for (const token of extracted.tokens) {
            const category = classifyToken(token.name);
            const key = `${token.name}:${token.value}`;
            if (!tokensByName.has(key)) {
              tokensByName.set(key, {
                name: token.name,
                value: token.value,
                category,
                sourceStoryId: entry.id,
                sourceTitle: entry.title,
                confidence: "medium",
              });
            }
          }

          const textLines = extracted.bodyText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 8);
          if (textLines.length > 0) {
            sectionsMap[topic].guidance.push(...textLines);
            sectionsMap[topic].sourceStories.push({ id: entry.id, title: entry.title });
          }

          successCount += 1;
        } catch (error) {
          failedStories += 1;
          this.logger.warn({ error, storyId: entry.id, title: entry.title }, "phase2 extraction failed for story; continuing");
        }
      }

      if (successCount === 0) {
        if (prior) {
          nextThemes[themeId] = prior;
          skippedThemes += 1;
        }
        continue;
      }

      const tokens = [...tokensByName.values()];
      const coverage = {
        color: tokens.filter((t) => t.category === "color").length,
        typography: tokens.filter((t) => t.category === "typography").length,
        spacing: tokens.filter((t) => t.category === "spacing").length,
        layout: tokens.filter((t) => t.category === "layout").length,
        other: tokens.filter((t) => t.category === "other").length,
      };

      const sectionNames: FoundationGuidelineSection["name"][] = ["color", "typography", "spacing", "layout"];
      const sections = sectionNames.map((name) => ({
        name,
        guidance: [...new Set(sectionsMap[name].guidance)].slice(0, 10),
        sourceStories: sectionsMap[name].sourceStories,
      }));

      const summary: ThemeSummary = {
        themeId,
        themeName,
        sourcePath,
        mappingConfidence: confidenceFromStoryCount(successCount),
        tokenCoverage: coverage,
        lastIndexed: new Date().toISOString(),
      };

      nextThemes[themeId] = { fingerprint: themeFingerprint, summary, tokens, guidelines: sections };
      refreshedThemes += 1;
    }

    this.cache = {
      fingerprint,
      updatedAt: new Date().toISOString(),
      themes: nextThemes,
    };
    await writeJsonFile(this.cachePath, this.cache);
    this.logger.info({ refreshedThemes, skippedThemes, failedStories }, "phase2 foundation refresh completed");

    return { refreshedThemes, skippedThemes, failedStories };
  }

  listThemes(): { themes: ThemeSummary[]; updatedAt: string } {
    return {
      themes: Object.values(this.cache.themes)
        .map((item) => item.summary)
        .sort((a, b) => a.themeName.localeCompare(b.themeName)),
      updatedAt: this.cache.updatedAt,
    };
  }

  getDesignTokens(themeId: string): DesignTokenResponse {
    const found = this.cache.themes[themeId];
    if (!found) {
      return {
        themeId,
        tokens: [],
        sourceMeta: {
          storybook: true,
          extractionMode: "playwright-css-vars",
          mappingConfidence: "low",
        },
        metadataCompleteness: {
          level: "empty",
          missingFields: ["tokens", "theme"],
        },
        warnings: [`Theme not found: ${themeId}`],
      };
    }

    const missingFields: string[] = [];
    if (found.tokens.length === 0) {
      missingFields.push("tokens");
    }

    return {
      themeId,
      tokens: found.tokens,
      sourceMeta: {
        storybook: true,
        extractionMode: "playwright-css-vars",
        mappingConfidence: found.summary.mappingConfidence,
      },
      metadataCompleteness: {
        level: found.tokens.length === 0 ? "empty" : missingFields.length > 0 ? "partial" : "full",
        missingFields,
      },
      warnings: found.tokens.length === 0 ? ["No design tokens extracted for this theme."] : [],
      lastIndexed: found.summary.lastIndexed,
    };
  }

  getFoundationGuidelines(themeId: string): FoundationGuidelinesResponse {
    const found = this.cache.themes[themeId];
    if (!found) {
      return {
        themeId,
        sections: [],
        sourceMeta: {
          storybook: true,
          extractionMode: "playwright-text",
          mappingConfidence: "low",
        },
        metadataCompleteness: {
          level: "empty",
          missingFields: ["sections", "theme"],
        },
        warnings: [`Theme not found: ${themeId}`],
      };
    }

    const missingFields: string[] = [];
    if (found.guidelines.length === 0) {
      missingFields.push("sections");
    } else {
      const emptySections = found.guidelines.filter((section) => section.guidance.length === 0).map((section) => section.name);
      if (emptySections.length > 0) {
        missingFields.push(`emptySections:${emptySections.join(",")}`);
      }
    }

    return {
      themeId,
      sections: found.guidelines,
      sourceMeta: {
        storybook: true,
        extractionMode: "playwright-text",
        mappingConfidence: found.summary.mappingConfidence,
      },
      metadataCompleteness: {
        level: found.guidelines.length === 0 ? "empty" : missingFields.length > 0 ? "partial" : "full",
        missingFields,
      },
      warnings: found.guidelines.length === 0 ? ["No guidelines extracted for this theme."] : [],
      lastIndexed: found.summary.lastIndexed,
    };
  }

  async screenshotStory(storyId: string, viewport: "mobile" | "tablet" | "desktop", forceRefresh = false): Promise<ScreenshotStoryResponse> {
    const cacheFile = join(this.screenshotsDir, `${storyId.replace(/[^a-zA-Z0-9-_]/g, "_")}-${viewport}.png`);

    if (!forceRefresh) {
      const cached = await readFile(cacheFile).catch(() => undefined);
      if (cached) {
        return {
          storyId,
          viewport,
          imageBase64: cached.toString("base64"),
          fromCache: true,
          capturedAt: new Date().toISOString(),
          warnings: [],
        };
      }
    }

    await sleep(this.config.STORYBOOK_CALL_DELAY_MS);
    const target = new URL(`/iframe.html?id=${storyId}&viewMode=story`, this.config.STORYBOOK_URL).toString();
    await runPlaywrightScreenshot(target, this.config.STORYBOOK_NAV_TIMEOUT_MS, VIEWPORTS[viewport], cacheFile);
    const bytes = await readFile(cacheFile);

    return {
      storyId,
      viewport,
      imageBase64: bytes.toString("base64"),
      fromCache: false,
      capturedAt: new Date().toISOString(),
      warnings: [],
    };
  }
}

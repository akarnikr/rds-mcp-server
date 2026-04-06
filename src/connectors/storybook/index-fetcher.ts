import type { StorybookComponentMeta, StorybookIndex } from "../../types/storybook.js";

function toComponentName(packageName: string): string {
  const short = packageName.replace("@rds-vue-ui/", "");
  return `Rds${short
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
}

function toKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function confidenceRank(confidence: "high" | "medium" | "low"): number {
  if (confidence === "high") {
    return 3;
  }
  if (confidence === "medium") {
    return 2;
  }
  return 1;
}

function inferPackageName(entry: StorybookIndex["entries"][string]): { packageName: string; category?: string; mappingConfidence: "high" | "medium" | "low" } | null {
  const titleParts = entry.title.split("/").map((part) => part.trim()).filter(Boolean);
  if (titleParts.length === 0) {
    return null;
  }

  const topLevel = titleParts[0].toLowerCase();
  // Ignore non-component sections to avoid polluting component discovery.
  if (topLevel === "introduction" || topLevel === "foundations") {
    return null;
  }

  let shortName = "";
  let mappingConfidence: "high" | "medium" | "low" = "low";

  if (topLevel === "components" && titleParts.length >= 3) {
    const parent = toKebab(titleParts[1]);
    const leaf = toKebab(titleParts[titleParts.length - 1]);
    if (leaf === parent || leaf === `${parent}s`) {
      shortName = parent;
      mappingConfidence = "high";
    } else {
      shortName = leaf;
      mappingConfidence = leaf.startsWith(`${parent}-`) ? "high" : "medium";
    }
  } else if (topLevel === "components" && titleParts.length >= 2) {
    shortName = toKebab(titleParts[1]);
    mappingConfidence = "medium";
  } else if (entry.id.startsWith("components-")) {
    const idStem = entry.id.split("--")[0].replace(/^components-/, "");
    const tokens = idStem.split("-").filter(Boolean);
    shortName = tokens.length > 1 ? tokens.slice(1).join("-") : tokens[0] ?? "";
    mappingConfidence = "low";
  } else if (titleParts.length >= 2) {
    shortName = toKebab(titleParts[titleParts.length - 1]);
    mappingConfidence = "low";
  }

  if (!shortName) {
    return null;
  }

  return {
    packageName: `@rds-vue-ui/${shortName}`,
    category: titleParts.length > 1 ? titleParts[0] : undefined,
    mappingConfidence,
  };
}

export async function fetchStorybookIndex(storybookUrl: string): Promise<StorybookIndex> {
  const url = new URL("/index.json", storybookUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Storybook index fetch failed: ${response.status}`);
  }

  return response.json() as Promise<StorybookIndex>;
}

export function mapStorybookComponents(index: StorybookIndex): Record<string, StorybookComponentMeta> {
  const byPackage: Record<string, StorybookComponentMeta> = {};

  for (const entry of Object.values(index.entries)) {
    const inferred = inferPackageName(entry);
    if (!inferred) {
      continue;
    }
    const { packageName, category, mappingConfidence } = inferred;

    if (!byPackage[packageName]) {
      byPackage[packageName] = {
        packageName,
        componentName: toComponentName(packageName),
        category,
        stories: [],
        mappingConfidence,
      };
    } else if (confidenceRank(mappingConfidence) > confidenceRank(byPackage[packageName].mappingConfidence)) {
      byPackage[packageName].mappingConfidence = mappingConfidence;
    }

    if (entry.type === "story") {
      const hasStory = byPackage[packageName].stories.some((story) => story.id === entry.id);
      if (!hasStory) {
        byPackage[packageName].stories.push({ id: entry.id, name: entry.name });
      }
    }
  }

  return byPackage;
}

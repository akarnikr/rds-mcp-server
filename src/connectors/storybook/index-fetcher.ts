import type { StorybookComponentMeta, StorybookIndex } from "../../types/storybook.js";

function toComponentName(packageName: string): string {
  const short = packageName.replace("@rds-vue-ui/", "");
  return `Rds${short
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
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
    const lower = entry.title.toLowerCase();
    const shortName = lower.split("/").at(-1)?.replace(/\s+/g, "-") ?? "unknown";
    const packageName = `@rds-vue-ui/${shortName}`;

    if (!byPackage[packageName]) {
      byPackage[packageName] = {
        packageName,
        componentName: toComponentName(packageName),
        category: entry.title.includes("/") ? entry.title.split("/")[0] : undefined,
        stories: [],
      };
    }

    if (entry.type === "story") {
      byPackage[packageName].stories.push({ id: entry.id, name: entry.name });
    }
  }

  return byPackage;
}

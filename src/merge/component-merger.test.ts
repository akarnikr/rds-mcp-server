import { describe, expect, it } from "vitest";
import { mergeComponentData } from "./component-merger.js";

describe("mergeComponentData", () => {
  it("merges registry and storybook fields into a component record", () => {
    const merged = mergeComponentData({
      packageName: "@rds-vue-ui/button",
      nowIso: "2026-04-06T00:00:00.000Z",
      registryMeta: {
        name: "@rds-vue-ui/button",
        description: "Button component",
        versions: {
          "1.2.3": { name: "@rds-vue-ui/button", version: "1.2.3", peerDependencies: { vue: "^3" } },
        },
        "dist-tags": { latest: "1.2.3" },
        time: { "1.2.3": "2026-04-01T00:00:00.000Z" },
      },
      latestVersion: "1.2.3",
      latestVersionMeta: { name: "@rds-vue-ui/button", version: "1.2.3", peerDependencies: { vue: "^3" } },
      parsedRegistry: {
        componentName: "RdsButton",
        props: [{ name: "variant", type: "string", required: false, source: "registry" }],
        events: [],
        slots: [],
      },
      storybookMeta: {
        packageName: "@rds-vue-ui/button",
        componentName: "RdsButton",
        category: "Forms",
        stories: [{ id: "button--primary", name: "Primary" }],
      },
      registryUrl: "https://npm.edpl.us",
    });

    expect(merged.package).toBe("@rds-vue-ui/button");
    expect(merged.category).toBe("Forms");
    expect(merged.stories).toHaveLength(1);
    expect(merged.importStatement).toContain("RdsButton");
    expect(merged.installCommand).toContain("--registry https://npm.edpl.us");
  });
});

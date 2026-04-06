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
        mappingConfidence: "high",
      },
      registryUrl: "https://npm.edpl.us",
    });

    expect(merged.package).toBe("@rds-vue-ui/button");
    expect(merged.category).toBe("Forms");
    expect(merged.stories).toHaveLength(1);
    expect(merged.importStatement).toContain("RdsButton");
    expect(merged.installCommand).toContain("--registry https://npm.edpl.us");
    expect(merged.sourceMeta.registry).toBe(true);
    expect(merged.sourceMeta.mappingConfidence).toBe("high");
  });

  it("builds a valid component record from storybook-only metadata", () => {
    const merged = mergeComponentData({
      packageName: "@rds-vue-ui/form-checkbox",
      nowIso: "2026-04-06T00:00:00.000Z",
      latestVersion: "storybook-only",
      storybookMeta: {
        packageName: "@rds-vue-ui/form-checkbox",
        componentName: "RdsFormCheckbox",
        category: "Forms",
        stories: [{ id: "components-form-checkbox--default", name: "Default" }],
        mappingConfidence: "medium",
      },
      registryUrl: "https://npm.edpl.us",
    });

    expect(merged.package).toBe("@rds-vue-ui/form-checkbox");
    expect(merged.version).toBe("storybook-only");
    expect(merged.category).toBe("Forms");
    expect(merged.stories).toHaveLength(1);
    expect(merged.props).toHaveLength(0);
    expect(merged.events).toHaveLength(0);
    expect(merged.slots).toHaveLength(0);
    expect(merged.sourceMeta.storybook).toBe(true);
    expect(merged.sourceMeta.registry).toBe(false);
    expect(merged.sourceMeta.mappingConfidence).toBe("medium");
  });
});

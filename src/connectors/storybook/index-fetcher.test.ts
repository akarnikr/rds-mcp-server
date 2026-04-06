import { describe, expect, it } from "vitest";
import { mapStorybookComponents } from "./index-fetcher.js";

describe("mapStorybookComponents", () => {
  it("groups story entries by inferred package and category", () => {
    const mapped = mapStorybookComponents({
      entries: {
        "button--primary": {
          id: "button--primary",
          title: "Forms/Button",
          name: "Primary",
          type: "story",
        },
        "button--secondary": {
          id: "button--secondary",
          title: "Forms/Button",
          name: "Secondary",
          type: "story",
        },
      },
    });

    expect(mapped["@rds-vue-ui/button"]).toBeDefined();
    expect(mapped["@rds-vue-ui/button"].category).toBe("Forms");
    expect(mapped["@rds-vue-ui/button"].stories).toHaveLength(2);
    expect(mapped["@rds-vue-ui/button"].mappingConfidence).toBe("low");
  });

  it("filters non-component sections and maps component leaf names with high confidence", () => {
    const mapped = mapStorybookComponents({
      entries: {
        "foundations-base-theme--palette": {
          id: "foundations-base-theme--palette",
          title: "Foundations/Base Theme",
          name: "Palette",
          type: "story",
        },
        "components-card-cardinfohorizontal--docs": {
          id: "components-card-cardinfohorizontal--docs",
          title: "Components/Card/CardInfoHorizontal",
          name: "Docs",
          type: "docs",
        },
        "components-card-cardinfohorizontal--default": {
          id: "components-card-cardinfohorizontal--default",
          title: "Components/Card/CardInfoHorizontal",
          name: "Default",
          type: "story",
        },
      },
    });

    expect(mapped["@rds-vue-ui/base-theme"]).toBeUndefined();
    expect(mapped["@rds-vue-ui/card-info-horizontal"]).toBeDefined();
    expect(mapped["@rds-vue-ui/card-info-horizontal"].mappingConfidence).toBe("high");
    expect(mapped["@rds-vue-ui/card-info-horizontal"].stories).toHaveLength(1);
  });
});

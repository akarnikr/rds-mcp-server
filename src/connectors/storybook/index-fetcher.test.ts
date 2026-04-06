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
  });
});

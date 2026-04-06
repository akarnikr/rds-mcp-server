import { z } from "zod";
import type { ComponentIndexer } from "../services/indexer.js";

export const ListComponentsInput = z.object({
  category: z.string().optional(),
});

export const SearchComponentsInput = z.object({
  query: z.string().min(1),
});

export const GetComponentDetailsInput = z.object({
  component: z.string().min(1),
});

export function createDiscoveryTools(indexer: ComponentIndexer) {
  return {
    listComponents: async (input: z.infer<typeof ListComponentsInput>) => {
      const components = indexer.list(input.category).map((component) => ({
        name: component.name,
        package: component.package,
        version: component.version,
        category: component.category,
        description: component.description,
        storyCount: component.stories.length,
        lastIndexed: component.lastIndexed,
      }));
      return { components };
    },

    searchComponents: async (input: z.infer<typeof SearchComponentsInput>) => ({
      query: input.query,
      results: indexer.search(input.query),
    }),

    getComponentDetails: async (input: z.infer<typeof GetComponentDetailsInput>) => {
      const component = indexer.getComponent(input.component);
      if (!component) {
        return {
          error: `Component not found: ${input.component}`,
        };
      }

      return component;
    },
  };
}

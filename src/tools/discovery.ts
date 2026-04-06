import { z } from "zod";
import type { ComponentIndexer } from "../services/indexer.js";
import type { ComponentInfo } from "../types/component.js";

export const ListComponentsInput = z.object({
  category: z.string().optional(),
});

export const SearchComponentsInput = z.object({
  query: z.string().min(1),
});

export const GetComponentDetailsInput = z.object({
  component: z.string().min(1),
});

function getMetadataCompleteness(component: ComponentInfo) {
  const missingFields: string[] = [];
  if (!component.description) {
    missingFields.push("description");
  }
  if (component.props.length === 0) {
    missingFields.push("props");
  }
  if (component.events.length === 0) {
    missingFields.push("events");
  }
  if (component.slots.length === 0) {
    missingFields.push("slots");
  }
  if (!component.lastPublished) {
    missingFields.push("lastPublished");
  }
  if (Object.keys(component.peerDependencies).length === 0) {
    missingFields.push("peerDependencies");
  }

  const level = component.sourceMeta.registry
    ? (missingFields.length === 0 ? "full" : "partial")
    : "storybook-only";

  return { level, missingFields };
}

function getComponentWarnings(component: ComponentInfo): string[] {
  const warnings: string[] = [];
  if (component.sourceMeta.mappingConfidence === "low") {
    warnings.push("Package mapping confidence is low; verify package name before install.");
  }
  if (component.stories.length === 0) {
    warnings.push("No Storybook stories found for this component.");
  }
  return warnings;
}

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
        sourceMeta: component.sourceMeta,
        metadataCompleteness: getMetadataCompleteness(component),
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

      return {
        component,
        sourceMeta: component.sourceMeta,
        metadataCompleteness: getMetadataCompleteness(component),
        warnings: getComponentWarnings(component),
      };
    },
  };
}

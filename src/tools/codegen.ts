import { z } from "zod";
import type { ComponentIndexer } from "../services/indexer.js";
import type { ComponentInfo } from "../types/component.js";

export const GetComponentUsageInput = z.object({
  component: z.string().min(1),
  variant: z.string().optional(),
});

export const GetInstallationInfoInput = z.object({
  components: z.array(z.string().min(1)).min(1),
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

export function createCodegenTools(indexer: ComponentIndexer) {
  return {
    getComponentUsage: async (input: z.infer<typeof GetComponentUsageInput>) => {
      const usage = indexer.getUsage(input.component, input.variant);
      const component = indexer.getComponent(input.component);
      if (!usage) {
        return { error: `Component not found: ${input.component}` };
      }

      const warnings: string[] = [];
      if (component?.sourceMeta.mappingConfidence === "low") {
        warnings.push("Package mapping confidence is low; verify package name before install.");
      }
      if (!usage.variant && input.variant) {
        warnings.push(`Requested variant '${input.variant}' not found; returned default template.`);
      }

      return {
        ...usage,
        sourceMeta: component?.sourceMeta,
        metadataCompleteness: component ? getMetadataCompleteness(component) : undefined,
        warnings,
      };
    },

    getInstallationInfo: async (input: z.infer<typeof GetInstallationInfoInput>) => {
      const info = indexer.getInstallationInfo(input.components);
      const unresolved = input.components.filter((ref) => !indexer.getComponent(ref));
      const lowConfidenceMappings = input.components
        .map((ref) => ({ ref, component: indexer.getComponent(ref) }))
        .filter((x) => Boolean(x.component) && x.component!.sourceMeta.mappingConfidence === "low")
        .map((x) => x.ref);

      const warnings: string[] = [];
      if (unresolved.length > 0) {
        warnings.push(`Some component references could not be resolved: ${unresolved.join(", ")}`);
      }
      if (lowConfidenceMappings.length > 0) {
        warnings.push(`Some install mappings have low confidence: ${lowConfidenceMappings.join(", ")}`);
      }

      return {
        ...info,
        unresolved,
        lowConfidenceMappings,
        warnings,
      };
    },
  };
}

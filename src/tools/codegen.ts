import { z } from "zod";
import type { ComponentIndexer } from "../services/indexer.js";

export const GetComponentUsageInput = z.object({
  component: z.string().min(1),
  variant: z.string().optional(),
});

export const GetInstallationInfoInput = z.object({
  components: z.array(z.string().min(1)).min(1),
});

export function createCodegenTools(indexer: ComponentIndexer) {
  return {
    getComponentUsage: async (input: z.infer<typeof GetComponentUsageInput>) => {
      const usage = indexer.getUsage(input.component, input.variant);
      if (!usage) {
        return { error: `Component not found: ${input.component}` };
      }
      return usage;
    },

    getInstallationInfo: async (input: z.infer<typeof GetInstallationInfoInput>) => indexer.getInstallationInfo(input.components),
  };
}

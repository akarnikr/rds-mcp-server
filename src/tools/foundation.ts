import { z } from "zod";
import type { StorybookVisualsService } from "../services/storybook-visuals.js";

export const ListThemesInput = z.object({});

export const GetDesignTokensInput = z.object({
  themeId: z.string().min(1),
});

export const GetFoundationGuidelinesInput = z.object({
  themeId: z.string().min(1),
});

export const ScreenshotStoryInput = z.object({
  storyId: z.string().min(1),
  viewport: z.enum(["mobile", "tablet", "desktop"]).default("desktop"),
  forceRefresh: z.boolean().optional(),
});

export type ListThemesInputShape = z.input<typeof ListThemesInput>;
export type GetDesignTokensInputShape = z.input<typeof GetDesignTokensInput>;
export type GetFoundationGuidelinesInputShape = z.input<typeof GetFoundationGuidelinesInput>;
export type ScreenshotStoryInputShape = z.input<typeof ScreenshotStoryInput>;

export function createFoundationTools(visuals: StorybookVisualsService) {
  return {
    listThemes: async (_input: ListThemesInputShape) => visuals.listThemes(),
    getDesignTokens: async (input: GetDesignTokensInputShape) => visuals.getDesignTokens(input.themeId),
    getFoundationGuidelines: async (input: GetFoundationGuidelinesInputShape) => visuals.getFoundationGuidelines(input.themeId),
    screenshotStory: async (input: ScreenshotStoryInputShape) =>
      visuals.screenshotStory(input.storyId, input.viewport, input.forceRefresh ?? false),
  };
}

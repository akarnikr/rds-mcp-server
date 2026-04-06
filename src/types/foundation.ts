export type MappingConfidence = "high" | "medium" | "low";

export interface ThemeSummary {
  themeId: string;
  themeName: string;
  sourcePath: string;
  mappingConfidence: MappingConfidence;
  tokenCoverage: {
    color: number;
    typography: number;
    spacing: number;
    layout: number;
    other: number;
  };
  lastIndexed: string;
}

export interface DesignToken {
  name: string;
  value: string;
  category: "color" | "typography" | "spacing" | "layout" | "other";
  sourceStoryId: string;
  sourceTitle: string;
  confidence: MappingConfidence;
}

export interface DesignTokenResponse {
  themeId: string;
  tokens: DesignToken[];
  sourceMeta: {
    storybook: true;
    extractionMode: "playwright-css-vars";
    mappingConfidence: MappingConfidence;
  };
  metadataCompleteness: {
    level: "full" | "partial" | "empty";
    missingFields: string[];
  };
  warnings: string[];
  lastIndexed?: string;
}

export interface FoundationGuidelineSection {
  name: "color" | "typography" | "spacing" | "layout";
  guidance: string[];
  sourceStories: Array<{ id: string; title: string }>;
}

export interface FoundationGuidelinesResponse {
  themeId: string;
  sections: FoundationGuidelineSection[];
  sourceMeta: {
    storybook: true;
    extractionMode: "playwright-text";
    mappingConfidence: MappingConfidence;
  };
  metadataCompleteness: {
    level: "full" | "partial" | "empty";
    missingFields: string[];
  };
  warnings: string[];
  lastIndexed?: string;
}

export interface ScreenshotStoryResponse {
  storyId: string;
  viewport: "mobile" | "tablet" | "desktop";
  imageBase64: string;
  fromCache: boolean;
  capturedAt: string;
  warnings: string[];
}

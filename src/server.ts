import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ComponentIndexer } from "./services/indexer.js";
import type { StorybookVisualsService } from "./services/storybook-visuals.js";
import {
  GetComponentDetailsInput,
  ListComponentsInput,
  SearchComponentsInput,
  createDiscoveryTools,
} from "./tools/discovery.js";
import {
  GetComponentUsageInput,
  GetInstallationInfoInput,
  createCodegenTools,
} from "./tools/codegen.js";
import {
  GetDesignTokensInput,
  GetFoundationGuidelinesInput,
  ListThemesInput,
  ScreenshotStoryInput,
  createFoundationTools,
} from "./tools/foundation.js";

function asMcpText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function createValidatedHandler<T>(schema: z.ZodType<T>, handler: (input: T) => Promise<unknown>) {
  return async (input: unknown) => {
    const parsed = schema.parse(input);
    return asMcpText(await handler(parsed));
  };
}

export function createMcpServer(indexer: ComponentIndexer, visuals: StorybookVisualsService) {
  const server = new McpServer({
    name: "rds-vue-ui",
    version: "0.1.0",
  });

  const discovery = createDiscoveryTools(indexer);
  const codegen = createCodegenTools(indexer);
  const foundation = createFoundationTools(visuals);

  server.registerTool(
    "list_components",
    {
      description: "Returns RDS component inventory grouped by category",
      inputSchema: ListComponentsInput,
    },
    createValidatedHandler(ListComponentsInput, (input) => discovery.listComponents(input)),
  );

  server.registerTool(
    "search_components",
    {
      description: "Fuzzy search across components and prop names",
      inputSchema: SearchComponentsInput,
    },
    createValidatedHandler(SearchComponentsInput, (input) => discovery.searchComponents(input)),
  );

  server.registerTool(
    "get_component_details",
    {
      description: "Returns detailed API information for one component",
      inputSchema: GetComponentDetailsInput,
    },
    createValidatedHandler(GetComponentDetailsInput, (input) => discovery.getComponentDetails(input)),
  );

  server.registerTool(
    "get_component_usage",
    {
      description: "Returns ready-to-paste Vue usage examples",
      inputSchema: GetComponentUsageInput,
    },
    createValidatedHandler(GetComponentUsageInput, (input) => codegen.getComponentUsage(input)),
  );

  server.registerTool(
    "get_installation_info",
    {
      description: "Returns install commands and peer dependency information",
      inputSchema: GetInstallationInfoInput,
    },
    createValidatedHandler(GetInstallationInfoInput, (input) => codegen.getInstallationInfo(input)),
  );

  server.registerTool(
    "list_themes",
    {
      description: "Returns discovered Storybook foundation themes",
      inputSchema: ListThemesInput,
    },
    createValidatedHandler(ListThemesInput, (input) => foundation.listThemes(input)),
  );

  server.registerTool(
    "get_design_tokens",
    {
      description: "Returns extracted design tokens for a theme",
      inputSchema: GetDesignTokensInput,
    },
    createValidatedHandler(GetDesignTokensInput, (input) => foundation.getDesignTokens(input)),
  );

  server.registerTool(
    "get_foundation_guidelines",
    {
      description: "Returns extracted foundation guidance for a theme",
      inputSchema: GetFoundationGuidelinesInput,
    },
    createValidatedHandler(GetFoundationGuidelinesInput, (input) => foundation.getFoundationGuidelines(input)),
  );

  server.registerTool(
    "screenshot_story",
    {
      description: "Captures a Storybook story screenshot using Playwright",
      inputSchema: ScreenshotStoryInput,
    },
    createValidatedHandler(ScreenshotStoryInput, (input) => foundation.screenshotStory(input)),
  );

  return server;
}

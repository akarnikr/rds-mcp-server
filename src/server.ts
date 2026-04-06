import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ComponentIndexer } from "./services/indexer.js";
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

function asMcpText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function createMcpServer(indexer: ComponentIndexer) {
  const server = new McpServer({
    name: "rds-vue-ui",
    version: "0.1.0",
  });

  const discovery = createDiscoveryTools(indexer);
  const codegen = createCodegenTools(indexer);

  server.registerTool(
    "list_components",
    {
      description: "Returns RDS component inventory grouped by category",
      inputSchema: ListComponentsInput,
    },
    async (input) => asMcpText(await discovery.listComponents(input)),
  );

  server.registerTool(
    "search_components",
    {
      description: "Fuzzy search across components and prop names",
      inputSchema: SearchComponentsInput,
    },
    async (input) => asMcpText(await discovery.searchComponents(input)),
  );

  server.registerTool(
    "get_component_details",
    {
      description: "Returns detailed API information for one component",
      inputSchema: GetComponentDetailsInput,
    },
    async (input) => asMcpText(await discovery.getComponentDetails(input)),
  );

  server.registerTool(
    "get_component_usage",
    {
      description: "Returns ready-to-paste Vue usage examples",
      inputSchema: GetComponentUsageInput,
    },
    async (input) => asMcpText(await codegen.getComponentUsage(input)),
  );

  server.registerTool(
    "get_installation_info",
    {
      description: "Returns install commands and peer dependency information",
      inputSchema: GetInstallationInfoInput,
    },
    async (input) => asMcpText(await codegen.getInstallationInfo(input)),
  );

  return server;
}

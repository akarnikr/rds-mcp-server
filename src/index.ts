import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { Poller } from "./connectors/registry/poller.js";
import { ComponentIndexer } from "./services/indexer.js";
import { StorybookVisualsService } from "./services/storybook-visuals.js";
import { createMcpServer } from "./server.js";

async function main() {
  const config = loadConfig();
  const logger = createLogger(config);

  const indexer = new ComponentIndexer(config, logger);
  const visuals = new StorybookVisualsService(config, logger);
  await indexer.initialize();
  await visuals.initialize();

  try {
    await indexer.refresh();
  } catch (error) {
    logger.warn({ error }, "initial refresh failed; serving from cached data if available");
  }
  try {
    await visuals.refresh();
  } catch (error) {
    logger.warn({ error }, "initial phase2 refresh failed; serving from cached visual data if available");
  }

  const poller = new Poller(6 * 60 * 60 * 1000, async () => {
    await indexer.refresh();
    await visuals.refresh();
  }, logger);
  poller.start();

  const server = createMcpServer(indexer, visuals);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("RDS Vue UI MCP server started on stdio transport");

  process.on("SIGINT", () => {
    poller.stop();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    poller.stop();
    process.exit(0);
  });
}

void main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

import pino from "pino";
import type { AppConfig } from "./config.js";

export function createLogger(config: AppConfig) {
  return pino(
    {
      name: "rds-vue-ui-mcp",
      level: config.LOG_LEVEL,
    },
    // MCP stdio protocol uses stdout; write logs to stderr to avoid corrupting client handshakes.
    pino.destination(2),
  );
}

export type Logger = ReturnType<typeof createLogger>;

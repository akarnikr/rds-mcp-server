import pino from "pino";
import type { AppConfig } from "./config.js";

export function createLogger(config: AppConfig) {
  return pino({
    name: "rds-vue-ui-mcp",
    level: config.LOG_LEVEL,
  });
}

export type Logger = ReturnType<typeof createLogger>;

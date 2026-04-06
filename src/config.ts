import { z } from "zod";

const ConfigSchema = z.object({
  NPM_REGISTRY_URL: z.string().url(),
  NPM_REGISTRY_TOKEN: z.string().optional(),
  STORYBOOK_URL: z.string().url(),
  CACHE_DIR: z.string().default("cache"),
  STORYBOOK_CALL_DELAY_MS: z.coerce.number().int().nonnegative().default(350),
  STORYBOOK_NAV_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid config: ${parsed.error.message}`);
  }
  return parsed.data;
}

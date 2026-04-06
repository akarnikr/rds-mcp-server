import { z } from "zod";

const ConfigSchema = z.object({
  NPM_REGISTRY_URL: z.string().url(),
  NPM_REGISTRY_TOKEN: z.string().optional(),
  STORYBOOK_URL: z.string().url(),
  CACHE_DIR: z.string().default("cache"),
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

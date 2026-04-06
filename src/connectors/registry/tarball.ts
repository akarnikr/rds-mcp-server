import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as tar from "tar";

export interface TarballExtract {
  dtsFiles: Array<{ path: string; content: string }>;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

export async function extractTarball(archiveBuffer: ArrayBuffer): Promise<TarballExtract> {
  const workdir = await mkdtemp(join(tmpdir(), "rds-mcp-"));
  const archivePath = join(workdir, "package.tgz");
  await writeFile(archivePath, Buffer.from(archiveBuffer));

  try {
    await tar.extract({ file: archivePath, cwd: workdir });
    const files = await walk(workdir);
    const dtsPaths = files.filter((f) => f.endsWith(".d.ts"));
    const dtsFiles = await Promise.all(
      dtsPaths.map(async (path) => ({
        path,
        content: await readFile(path, "utf8"),
      })),
    );

    return { dtsFiles };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

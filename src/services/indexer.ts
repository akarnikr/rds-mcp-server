import type { AppConfig } from "../config.js";
import type { Logger } from "../logger.js";
import { ComponentStore, type ComponentMap } from "../cache/component-store.js";
import { VersionMapStore, type VersionMap } from "../cache/version-map.js";
import { RegistryClient } from "../connectors/registry/client.js";
import { parseDtsFiles } from "../connectors/registry/dts-parser.js";
import { extractTarball } from "../connectors/registry/tarball.js";
import { fetchStorybookIndex, mapStorybookComponents } from "../connectors/storybook/index-fetcher.js";
import { mergeComponentData } from "../merge/component-merger.js";
import type { ComponentInfo, SearchResult } from "../types/component.js";

const SCOPE_PREFIX = "@rds-vue-ui/";

export class ComponentIndexer {
  private readonly registryClient: RegistryClient;
  private readonly componentStore: ComponentStore;
  private readonly versionMapStore: VersionMapStore;
  private versionMap: VersionMap = {};
  private components: ComponentMap = {};

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {
    this.registryClient = new RegistryClient({
      baseUrl: config.NPM_REGISTRY_URL,
      token: config.NPM_REGISTRY_TOKEN,
    });
    this.componentStore = new ComponentStore(config.CACHE_DIR);
    this.versionMapStore = new VersionMapStore(config.CACHE_DIR);
  }

  async initialize(): Promise<void> {
    this.versionMap = await this.versionMapStore.load();
    this.components = await this.componentStore.load();
  }

  async refresh(packages?: string[]): Promise<{ refreshed: number; skipped: number }> {
    const search = await this.registryClient.searchPackages("@rds-vue-ui", 250);
    const latestVersionMap = Object.fromEntries(
      search.objects
        .map((o) => [o.package.name, o.package.version])
        .filter(([name]) => name.startsWith(SCOPE_PREFIX)),
    );

    const storybookMap = await this.safeGetStorybookMap();

    const requested = packages && packages.length > 0 ? new Set(packages.map((p) => this.normalizePackageName(p))) : null;
    const packageNames = requested ? Object.keys(latestVersionMap).filter((p) => requested.has(p)) : Object.keys(latestVersionMap);

    let refreshed = 0;
    let skipped = 0;

    for (const packageName of packageNames) {
      const nextVersion = latestVersionMap[packageName];
      const currentVersion = this.versionMap[packageName];

      if (!requested && currentVersion === nextVersion && this.components[packageName]) {
        skipped += 1;
        continue;
      }

      const registryMeta = await this.registryClient.getPackageMetadata(packageName);
      const latestVersion = registryMeta["dist-tags"].latest ?? nextVersion;
      const latestVersionMeta = registryMeta.versions[latestVersion];
      const tarballUrl = latestVersionMeta?.dist?.tarball;

      let parsed = { props: [], events: [], slots: [] } as ReturnType<typeof parseDtsFiles>;
      if (tarballUrl) {
        try {
          const buffer = await this.registryClient.downloadTarball(tarballUrl);
          const extracted = await extractTarball(buffer);
          parsed = parseDtsFiles(extracted.dtsFiles);
        } catch (error) {
          this.logger.warn({ error, packageName }, "d.ts parse failed; continuing with metadata only");
        }
      }

      const merged = mergeComponentData({
        packageName,
        nowIso: new Date().toISOString(),
        registryMeta,
        latestVersion,
        latestVersionMeta,
        parsedRegistry: parsed,
        storybookMeta: storybookMap[packageName],
        registryUrl: this.config.NPM_REGISTRY_URL,
      });

      this.components[packageName] = merged;
      this.versionMap[packageName] = latestVersion;
      refreshed += 1;
    }

    for (const existing of Object.keys(this.components)) {
      if (!latestVersionMap[existing]) {
        delete this.components[existing];
        delete this.versionMap[existing];
      }
    }

    await this.persist();
    return { refreshed, skipped };
  }

  list(category?: string): ComponentInfo[] {
    const normalizedCategory = category?.toLowerCase();
    return Object.values(this.components)
      .filter((c) => !normalizedCategory || c.category?.toLowerCase() === normalizedCategory)
      .sort((a, b) => a.package.localeCompare(b.package));
  }

  search(query: string): SearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q) {
      return [];
    }

    const results: SearchResult[] = [];
    for (const component of Object.values(this.components)) {
      const name = component.name.toLowerCase();
      const pkg = component.package.toLowerCase();
      const description = (component.description ?? "").toLowerCase();
      const propNames = component.props.map((p) => p.name.toLowerCase()).join(" ");

      if (name.includes(q)) {
        results.push({ name: component.name, package: component.package, relevance: 1, matchedField: "name" });
      } else if (pkg.includes(q)) {
        results.push({ name: component.name, package: component.package, relevance: 0.9, matchedField: "package" });
      } else if (description.includes(q)) {
        results.push({ name: component.name, package: component.package, relevance: 0.8, matchedField: "description" });
      } else if (propNames.includes(q)) {
        results.push({ name: component.name, package: component.package, relevance: 0.7, matchedField: "props" });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance || a.package.localeCompare(b.package));
  }

  getComponent(componentRef: string): ComponentInfo | undefined {
    const normalizedPackage = this.normalizePackageName(componentRef);
    if (this.components[normalizedPackage]) {
      return this.components[normalizedPackage];
    }

    const normalizedName = componentRef.toLowerCase().replace(/[-_\s]/g, "");
    return Object.values(this.components).find((c) => {
      const byName = c.name.toLowerCase().replace(/[-_\s]/g, "");
      const byPackage = c.package.toLowerCase().replace("@rds-vue-ui/", "");
      return byName === normalizedName || byPackage === normalizedName;
    });
  }

  getUsage(componentRef: string, variant?: string) {
    const component = this.getComponent(componentRef);
    if (!component) {
      return undefined;
    }

    const story = variant
      ? component.stories.find((s) => s.name.toLowerCase() === variant.toLowerCase())
      : component.stories[0];

    const template = `<${component.name}>Example</${component.name}>`;

    const fullExample = `<script setup lang=\"ts\">\n${component.importStatement}\n</script>\n\n<template>\n  ${template}\n</template>`;

    return {
      component: component.name,
      package: component.package,
      variant: story?.name,
      import: component.importStatement,
      template,
      fullExample,
      install: component.installCommand,
      lastIndexed: component.lastIndexed,
    };
  }

  getInstallationInfo(componentRefs: string[]) {
    const packages = new Set<string>();
    const peerDeps: Record<string, string> = {};

    for (const ref of componentRefs) {
      const component = this.getComponent(ref);
      if (!component) {
        continue;
      }
      packages.add(component.package);
      for (const [name, version] of Object.entries(component.peerDependencies)) {
        peerDeps[name] = version;
      }
    }

    const packageList = [...packages].sort();
    const install = packageList.length > 0
      ? `npm install ${packageList.join(" ")} --registry ${this.config.NPM_REGISTRY_URL}`
      : `npm install --registry ${this.config.NPM_REGISTRY_URL}`;

    return {
      components: packageList,
      install,
      npmrc: `@rds-vue-ui:registry=${this.config.NPM_REGISTRY_URL}`,
      peerDependencies: peerDeps,
      lastIndexed: new Date().toISOString(),
    };
  }

  private normalizePackageName(componentRef: string): string {
    if (componentRef.startsWith(SCOPE_PREFIX)) {
      return componentRef;
    }

    if (componentRef.startsWith("Rds")) {
      const short = componentRef
        .replace(/^Rds/, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();
      return `${SCOPE_PREFIX}${short}`;
    }

    return `${SCOPE_PREFIX}${componentRef.toLowerCase().replace(/\s+/g, "-")}`;
  }

  private async safeGetStorybookMap() {
    try {
      const index = await fetchStorybookIndex(this.config.STORYBOOK_URL);
      return mapStorybookComponents(index);
    } catch (error) {
      this.logger.warn({ error }, "storybook index unavailable; continuing with registry-only data");
      return {};
    }
  }

  private async persist() {
    await Promise.all([this.versionMapStore.save(this.versionMap), this.componentStore.save(this.components)]);
  }
}

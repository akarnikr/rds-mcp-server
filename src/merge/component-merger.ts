import type { ComponentInfo, EventDef, PropDef, SlotDef, StoryInfo } from "../types/component.js";
import type { RegistryPackageMeta, RegistryVersionMeta } from "../types/registry.js";
import type { StorybookComponentMeta } from "../types/storybook.js";

export interface MergeInput {
  packageName: string;
  nowIso: string;
  registryMeta: RegistryPackageMeta;
  latestVersion: string;
  latestVersionMeta?: RegistryVersionMeta;
  parsedRegistry: {
    componentName?: string;
    props: PropDef[];
    events: EventDef[];
    slots: SlotDef[];
  };
  storybookMeta?: StorybookComponentMeta;
  registryUrl: string;
}

function inferComponentName(packageName: string): string {
  const short = packageName.replace("@rds-vue-ui/", "");
  return `Rds${short
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
}

export function mergeComponentData(input: MergeInput): ComponentInfo {
  const componentName = input.storybookMeta?.componentName ?? input.parsedRegistry.componentName ?? inferComponentName(input.packageName);
  const stories: StoryInfo[] = input.storybookMeta?.stories ?? [];

  return {
    name: componentName,
    package: input.packageName,
    version: input.latestVersion,
    description: input.registryMeta.description ?? input.latestVersionMeta?.description,
    category: input.storybookMeta?.category,
    stories,
    props: input.parsedRegistry.props,
    events: input.parsedRegistry.events,
    slots: input.parsedRegistry.slots,
    peerDependencies: input.latestVersionMeta?.peerDependencies ?? {},
    importStatement: `import { ${componentName} } from '${input.packageName}'`,
    installCommand: `npm install ${input.packageName} --registry ${input.registryUrl}`,
    lastPublished: input.registryMeta.time?.[input.latestVersion],
    lastIndexed: input.nowIso,
    sourceMeta: {
      storybook: Boolean(input.storybookMeta),
      registry: true,
    },
  };
}

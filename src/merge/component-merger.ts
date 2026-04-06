import type { ComponentInfo, EventDef, PropDef, SlotDef, StoryInfo } from "../types/component.js";
import type { RegistryPackageMeta, RegistryVersionMeta } from "../types/registry.js";
import type { StorybookComponentMeta } from "../types/storybook.js";

export interface MergeInput {
  packageName: string;
  nowIso: string;
  registryMeta?: RegistryPackageMeta;
  latestVersion?: string;
  latestVersionMeta?: RegistryVersionMeta;
  parsedRegistry?: {
    componentName?: string;
    props: PropDef[];
    events: EventDef[];
    slots: SlotDef[];
  };
  storybookMeta?: StorybookComponentMeta;
  registryUrl?: string;
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
  const parsedRegistry = input.parsedRegistry ?? {
    props: [] as PropDef[],
    events: [] as EventDef[],
    slots: [] as SlotDef[],
  };
  const latestVersion = input.latestVersion ?? "storybook-only";
  const componentName = input.storybookMeta?.componentName ?? parsedRegistry.componentName ?? inferComponentName(input.packageName);
  const stories: StoryInfo[] = input.storybookMeta?.stories ?? [];
  const hasRegistryData = Boolean(input.registryMeta || input.latestVersionMeta || parsedRegistry.componentName || parsedRegistry.props.length || parsedRegistry.events.length || parsedRegistry.slots.length);
  const installCommand = input.registryUrl
    ? `npm install ${input.packageName} --registry ${input.registryUrl}`
    : `npm install ${input.packageName}`;

  return {
    name: componentName,
    package: input.packageName,
    version: latestVersion,
    description: input.registryMeta?.description ?? input.latestVersionMeta?.description,
    category: input.storybookMeta?.category,
    stories,
    props: parsedRegistry.props,
    events: parsedRegistry.events,
    slots: parsedRegistry.slots,
    peerDependencies: input.latestVersionMeta?.peerDependencies ?? {},
    importStatement: `import { ${componentName} } from '${input.packageName}'`,
    installCommand,
    lastPublished: input.registryMeta?.time?.[latestVersion],
    lastIndexed: input.nowIso,
    sourceMeta: {
      storybook: Boolean(input.storybookMeta),
      registry: hasRegistryData,
      mappingConfidence: input.storybookMeta?.mappingConfidence ?? "low",
    },
  };
}

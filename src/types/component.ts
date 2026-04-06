export interface PropDef {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description?: string;
  source: "storybook" | "registry";
}

export interface EventDef {
  name: string;
  payload?: string;
  description?: string;
  source: "storybook" | "registry";
}

export interface SlotDef {
  name: string;
  props?: string;
  description?: string;
  source: "storybook" | "registry";
}

export interface StoryInfo {
  id: string;
  name: string;
}

export interface ComponentInfo {
  name: string;
  package: string;
  version: string;
  description?: string;
  category?: string;
  stories: StoryInfo[];
  props: PropDef[];
  events: EventDef[];
  slots: SlotDef[];
  peerDependencies: Record<string, string>;
  importStatement: string;
  installCommand: string;
  lastPublished?: string;
  lastIndexed: string;
  sourceMeta: {
    storybook: boolean;
    registry: boolean;
  };
}

export interface SearchResult {
  name: string;
  package: string;
  relevance: number;
  matchedField: "name" | "package" | "description" | "props";
}

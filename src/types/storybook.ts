export interface StorybookIndexEntry {
  id: string;
  title: string;
  name: string;
  type: "story" | "docs";
}

export interface StorybookIndex {
  entries: Record<string, StorybookIndexEntry>;
}

export interface StorybookComponentMeta {
  packageName: string;
  componentName: string;
  category?: string;
  stories: Array<{ id: string; name: string }>;
}

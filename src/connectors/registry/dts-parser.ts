import { Project, ScriptKind } from "ts-morph";
import type { EventDef, PropDef, SlotDef } from "../../types/component.js";

export interface ParsedDts {
  componentName?: string;
  props: PropDef[];
  events: EventDef[];
  slots: SlotDef[];
}

function parseProps(project: Project, content: string): PropDef[] {
  const source = project.createSourceFile(`props-${Math.random()}.d.ts`, content, { scriptKind: ScriptKind.TS, overwrite: true });
  const interfaces = source.getInterfaces();

  const props: PropDef[] = [];
  for (const iface of interfaces) {
    const looksLikeProps = /props$/i.test(iface.getName()) || iface.getName().toLowerCase().includes("prop");
    if (!looksLikeProps) {
      continue;
    }

    for (const prop of iface.getProperties()) {
      props.push({
        name: prop.getName(),
        type: prop.getTypeNode()?.getText() ?? "unknown",
        required: !prop.hasQuestionToken(),
        default: undefined,
        description: prop.getJsDocs().map((d) => d.getDescription().trim()).filter(Boolean).join(" ") || undefined,
        source: "registry",
      });
    }
  }

  return props;
}

function parseEventLike(content: string): EventDef[] {
  const matches = [...content.matchAll(/(?:emit|emits|on)([A-Z][A-Za-z0-9_]*)/g)];
  const dedup = new Set<string>();
  for (const m of matches) {
    const event = m[1].replace(/[A-Z]/, (c) => c.toLowerCase());
    dedup.add(event);
  }

  return [...dedup].map((name) => ({ name, source: "registry" }));
}

function parseSlotLike(content: string): SlotDef[] {
  const matches = [...content.matchAll(/slot[s]?["']?\s*:?\s*["']?([a-zA-Z0-9_-]+)/g)];
  const dedup = new Set<string>();
  for (const m of matches) {
    dedup.add(m[1]);
  }

  return [...dedup].map((name) => ({ name, source: "registry" }));
}

export function parseDtsFiles(files: Array<{ path: string; content: string }>): ParsedDts {
  const project = new Project({ useInMemoryFileSystem: true, skipAddingFilesFromTsConfig: true });

  const allContent = files.map((f) => f.content).join("\n");
  const props = parseProps(project, allContent);
  const events = parseEventLike(allContent);
  const slots = parseSlotLike(allContent);

  const componentNameMatch = allContent.match(/export\s+declare\s+const\s+(Rds[A-Za-z0-9_]+)/);

  return {
    componentName: componentNameMatch?.[1],
    props,
    events,
    slots,
  };
}

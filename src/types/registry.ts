export interface RegistryConfig {
  baseUrl: string;
  token?: string;
}

export interface RegistryDistTags {
  latest?: string;
  beta?: string;
  next?: string;
}

export interface RegistryVersionMeta {
  name: string;
  version: string;
  description?: string;
  peerDependencies?: Record<string, string>;
  dist?: { tarball?: string };
}

export interface RegistryPackageMeta {
  name: string;
  description?: string;
  versions: Record<string, RegistryVersionMeta>;
  "dist-tags": RegistryDistTags;
  time?: Record<string, string>;
}

export interface RegistrySearchObject {
  package: {
    name: string;
    version: string;
    description?: string;
  };
}

export interface RegistrySearchResponse {
  objects: RegistrySearchObject[];
}

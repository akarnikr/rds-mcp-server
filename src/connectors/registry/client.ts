import type { RegistryConfig, RegistryPackageMeta, RegistrySearchResponse } from "../../types/registry.js";

export class RegistryClient {
  constructor(private readonly config: RegistryConfig) {}

  private headers(): HeadersInit {
    if (!this.config.token) {
      return { Accept: "application/json" };
    }

    return {
      Accept: "application/json",
      Authorization: `Bearer ${this.config.token}`,
    };
  }

  async searchPackages(scope = "@rds-vue-ui", size = 250): Promise<RegistrySearchResponse> {
    const url = new URL("/-/v1/search", this.config.baseUrl);
    url.searchParams.set("text", scope);
    url.searchParams.set("size", String(size));

    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) {
      throw new Error(`Registry search failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<RegistrySearchResponse>;
  }

  async getPackageMetadata(packageName: string): Promise<RegistryPackageMeta> {
    const encoded = packageName.replace("/", "%2f");
    const url = new URL(`/${encoded}`, this.config.baseUrl);
    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) {
      throw new Error(`Registry metadata failed for ${packageName}: ${response.status}`);
    }
    return response.json() as Promise<RegistryPackageMeta>;
  }

  async downloadTarball(tarballUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(tarballUrl, { headers: this.headers() });
    if (!response.ok) {
      throw new Error(`Tarball download failed: ${response.status}`);
    }
    return response.arrayBuffer();
  }
}

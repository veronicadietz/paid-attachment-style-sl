declare namespace Cloudflare {
  interface Env {
    FILES: R2Bucket;
  }
}

interface Document {
  modelContext?: {
    registerTool(tool: {
      name: string;
      title?: string;
      description: string;
      inputSchema: object;
      annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
      execute(input: unknown): unknown;
    }, options?: { signal?: AbortSignal }): void | Promise<void>;
  };
}

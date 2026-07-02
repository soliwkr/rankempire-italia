export interface CloudflareWorkersConfig {
  apiToken: string;
  accountId: string;
}

export class CloudflareWorkersService {
  private subdomain: string | null = null;

  constructor(private config: CloudflareWorkersConfig) {}

  private async fetchSubdomain(): Promise<string> {
    if (this.subdomain) return this.subdomain;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json() as any;
      this.subdomain = data?.result?.subdomain ?? null;
    }

    return this.subdomain ?? this.config.accountId;
  }

  async getWorkerUrl(workerName: string): Promise<string> {
    const subdomain = await this.fetchSubdomain();
    return `https://${workerName}.${subdomain}.workers.dev`;
  }
}

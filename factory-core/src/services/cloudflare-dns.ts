export interface CloudflareDNSConfig {
  apiToken: string;
  accountId: string;
}

export interface CloudflareDNSResult {
  id: string;
  [key: string]: any;
}

export class CloudflareDNSService {
  constructor(private config: CloudflareDNSConfig) {}

  /**
   * Cerca l'ID della zona Cloudflare dato il nome del dominio (apex).
   */
  async getZoneId(domain: string): Promise<string> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare DNS API error (getZoneId): ${response.status} ${error}`);
    }

    const result = await response.json() as { result: Array<{ id: string }>; success: boolean };
    
    if (!result.success || result.result.length === 0) {
      throw new Error(`Zone not found for domain: ${domain}`);
    }

    return result.result[0].id;
  }

  /**
   * Crea un record CNAME proxato su Cloudflare.
   */
  async createCnameRecord(
    zoneId: string,
    name: string,
    content: string
  ): Promise<CloudflareDNSResult> {
    const body = {
      type: 'CNAME',
      name: name,
      content: content,
      proxied: true,
      ttl: 1, // Automatico
    };

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare DNS API error: ${response.status} ${error}`);
    }

    const result = await response.json() as { result: CloudflareDNSResult; success: boolean };
    return result.result;
  }
}

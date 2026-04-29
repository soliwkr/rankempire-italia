import { JWT } from 'google-auth-library';

export interface GoogleTrackingConfig {
  clientEmail: string;
  privateKey: string;
}

export class GoogleTrackingService {
  private auth: JWT;

  constructor(config: GoogleTrackingConfig) {
    this.auth = new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: [
        'https://www.googleapis.com/auth/webmasters', // GSC
        'https://www.googleapis.com/auth/analytics.provision', // GA4 Provisioning
        'https://www.googleapis.com/auth/analytics.edit', // GA4 Edit
      ],
    });
  }

  /**
   * Adds a site to Google Search Console.
   * @param siteUrl The URL of the site to add (e.g., https://example.com)
   */
  async addSiteToGSC(siteUrl: string): Promise<void> {
    console.log(`[GSC] Adding site: ${siteUrl}`);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`;
    
    const response = await this.auth.request({
      url,
      method: 'PUT',
    });

    if (response.status !== 204) {
      throw new Error(`GSC API error: ${response.status} ${JSON.stringify(response.data)}`);
    }
    console.log(`[GSC] Site added successfully: ${siteUrl}`);
  }

  /**
   * Creates a GA4 Property and Web Data Stream.
   * Note: This assumes the Service Account has access to an Account.
   * @param accountId The GA Account ID (e.g., accounts/123)
   * @param displayName The name for the new property
   * @param siteUrl The URL of the site
   * @returns The Measurement ID (G-XXXXXXX)
   */
  async setupGA4(accountId: string, displayName: string, siteUrl: string): Promise<string> {
    console.log(`[GA4] Setting up property for: ${displayName}`);
    
    // 1. Create Property
    const propertyResponse = await this.auth.request({
      url: 'https://analyticsadmin.googleapis.com/v1beta/properties',
      method: 'POST',
      data: {
        parent: accountId,
        displayName: displayName,
        timeZone: 'Europe/Rome',
        currencyCode: 'EUR',
      },
    });

    const property = propertyResponse.data as any;
    const propertyId = property.name; // e.g., properties/123

    console.log(`[GA4] Property created: ${propertyId}`);

    // 2. Create Web Data Stream
    const streamResponse = await this.auth.request({
      url: `https://analyticsadmin.googleapis.com/v1beta/${propertyId}/webDataStreams`,
      method: 'POST',
      data: {
        displayName: 'Web Stream',
        defaultUri: siteUrl,
      },
    });

    const stream = streamResponse.data as any;
    const measurementId = stream.webStreamData.measurementId;

    console.log(`[GA4] Web Data Stream created. Measurement ID: ${measurementId}`);

    return measurementId;
  }
}

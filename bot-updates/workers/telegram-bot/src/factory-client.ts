// Client per factory-core API.
// Copiare in workers/telegram-bot/src/factory-client.ts nel repo telegram-ranketogram.

export interface ProjectData {
  slug: string;
  name: string;
  niche: string;
  location: string;
  createdVia?: string;
  buildMode?: string;
  sourcePhotoR2Key?: string;
}

export interface SeedData {
  services: string[];
  zones: string[];
  avatar: 'in-pain' | 'skeptic' | 'bundler';
}

export class FactoryClient {
  constructor(
    private apiUrl: string,
    private apiSecret: string
  ) {}

  private async post(path: string, body: unknown): Promise<any> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiSecret}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Factory API ${response.status}: ${err}`);
    }

    return response.json();
  }

  async createProject(data: ProjectData): Promise<{ id: string }> {
    return this.post('/api/projects', data);
  }

  async seedProject(projectId: string, type: string, data: SeedData): Promise<{ pagesWritten: number }> {
    return this.post(`/api/generate/seed-project/${projectId}?type=${type}`, data);
  }

  async deployProject(projectId: string, data: SeedData): Promise<{ workerUrl?: string; pagesUrl?: string }> {
    return this.post(`/api/projects/${projectId}/deploy`, data);
  }
}

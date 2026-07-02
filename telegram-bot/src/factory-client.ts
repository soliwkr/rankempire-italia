export interface ProjectData {
  slug: string;
  name: string;
  niche: string;
  location: string;
  domain?: string;
  createdVia?: string;
  buildMode?: string;
  sourcePhotoR2Key?: string;
}

export interface SeedData {
  services: string[];
  zones: string[];
  avatar: string;
}

export class FactoryClient {
  constructor(
    private apiUrl: string,
    private apiSecret: string
  ) {}

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiSecret}`,
    };
  }

  async createProject(data: ProjectData): Promise<string> {
    const res = await fetch(`${this.apiUrl}/api/projects`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`createProject failed: ${res.status} ${await res.text()}`);
    }

    const json = await res.json() as { id: string };
    return json.id;
  }

  async seedProject(projectId: string, type: string, data: SeedData): Promise<number> {
    const url = `${this.apiUrl}/api/generate/seed-project/${projectId}?type=${type}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`seedProject(${type}) failed: ${res.status} ${await res.text()}`);
    }

    const json = await res.json() as { pagesWritten: number };
    return json.pagesWritten ?? 0;
  }

  async deployProject(projectId: string, data: SeedData): Promise<string> {
    const res = await fetch(`${this.apiUrl}/api/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`deployProject failed: ${res.status} ${await res.text()}`);
    }

    const json = await res.json() as { pagesUrl?: string; workerUrl?: string };
    return json.pagesUrl ?? json.workerUrl ?? '';
  }
}

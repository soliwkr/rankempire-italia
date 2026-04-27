export interface CloudflarePagesConfig {
  apiToken: string;
  accountId: string;
}

export interface CloudflarePagesProject {
  name: string;
  subdomain: string;
  // URL pubblico: subdomain + '.pages.dev'
}

export class CloudflarePagesService {
  constructor(private config: CloudflarePagesConfig) {}

  /**
   * Crea un CF Pages project collegato al repository GitHub specificato.
   * Il nome del progetto è sempre rr-{slug} (D-02).
   * Restituisce result.result (unwrap del wrapper CF API { result, success, errors }).
   * NOTA: l'apiToken NON viene mai incluso in log o messaggi di errore (T-04-03-01).
   */
  async createProject(
    slug: string,
    githubOwner: string,
    githubRepo: string,
    factoryApiUrl: string
  ): Promise<CloudflarePagesProject> {
    const body = {
      name: `rr-${slug}`,
      production_branch: 'main',
      source: {
        type: 'github',
        config: {
          owner: githubOwner,
          repo_name: githubRepo,
          production_branch: 'main',
        },
      },
      build_config: {
        build_command: 'npm run build',
        destination_dir: 'dist',
        root_dir: '',
      },
      deployment_configs: {
        production: {
          env_vars: {
            FACTORY_API_URL: { value: factoryApiUrl },
          },
        },
      },
    };

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/pages/projects`,
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
      throw new Error(`Cloudflare Pages API error: ${response.status} ${error}`);
    }

    const result = await response.json() as { result: CloudflarePagesProject; success: boolean; errors: any[] };
    return result.result;
  }
}

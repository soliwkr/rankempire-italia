export interface WorkersConfig {
  apiToken: string;
  accountId: string;
  workerSubdomain: string; // e.g. "soliwkr"
}

export function workerUrl(slug: string, subdomain: string): string {
  return `https://rr-${slug}.${subdomain}.workers.dev`;
}

export function workerName(slug: string): string {
  return `rr-${slug}`;
}

export function buildWranglerToml(slug: string, factoryApiUrl: string): string {
  return `name = "${workerName(slug)}"
main = "dist/_worker.js/index.js"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[vars]
FACTORY_API_URL = "${factoryApiUrl}"
`;
}

/**
 * Checks if a Worker with the given name exists.
 * Used for idempotency — skip creation if already deployed.
 */
export async function workerExists(
  config: WorkersConfig,
  slug: string
): Promise<boolean> {
  const name = workerName(slug);
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/workers/scripts/${name}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.apiToken}` },
    }
  );
  return res.status === 200;
}

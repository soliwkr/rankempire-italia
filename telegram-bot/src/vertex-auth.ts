interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

// Module-level cache — lives for the duration of the Worker isolate
let cachedToken: TokenCache | null = null;

export async function getVertexAccessToken(serviceAccountJson: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const sa: ServiceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: sa.token_uri,
    iat: now,
    exp: now + expiresIn,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  };

  const enc = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${enc(header)}.${enc(payload)}`;

  const pemContents = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${signatureB64}`;

  const tokenRes = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Vertex AI auth failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json() as { access_token: string; expires_in: number };

  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export async function callVertexGemini(
  prompt: string,
  config: { project: string; location: string; model: string; serviceAccountJson: string }
): Promise<string> {
  const token = await getVertexAccessToken(config.serviceAccountJson);
  const url = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.project}/locations/${config.location}/publishers/google/models/${config.model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Vertex AI error: ${res.status} ${await res.text()}`);
  }

  const result = await res.json() as any;
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Vertex AI returned empty response');
  return text;
}

export async function callVertexGeminiVision(
  imageBase64: string,
  mimeType: string,
  textPrompt: string,
  config: { project: string; location: string; model: string; serviceAccountJson: string }
): Promise<string> {
  const token = await getVertexAccessToken(config.serviceAccountJson);
  const url = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.project}/locations/${config.location}/publishers/google/models/${config.model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: textPrompt },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Vertex AI Vision error: ${res.status} ${await res.text()}`);
  }

  const result = await res.json() as any;
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Vertex AI Vision returned empty response');
  return text;
}

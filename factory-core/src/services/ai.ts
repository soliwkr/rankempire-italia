export interface AiConfig {
  apiKey: string;
  accountId: string;
  gatewayName: string;
  gatewayToken?: string;
}

export class AiService {
  private baseUrl: string;

  constructor(private config: AiConfig) {
    // Utilizziamo v1beta e il modello gemini-flash-latest rilevato dai log
    this.baseUrl = `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayName}/google-ai-studio/v1beta/models/gemini-flash-latest:generateContent`;
  }

  async generateContent(prompt: string, schema?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.config.apiKey,
    };

    if (this.config.gatewayToken) {
      headers['Authorization'] = `Bearer ${this.config.gatewayToken}`;
    }

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        // Google API usa camelCase
        responseMimeType: schema ? 'application/json' : 'text/plain',
      }
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Gateway error: ${response.status} ${error}`);
    }

    const result = await response.json() as any;
    
    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (schema && textContent) {
      try {
        return JSON.parse(textContent);
      } catch (e) {
        console.error('Failed to parse AI JSON response:', textContent);
        throw new Error('Invalid JSON from AI');
      }
    }
    
    return textContent;
  }
}

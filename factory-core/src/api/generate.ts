import { Hono } from 'hono';
import { AiService } from '../services/ai';
import { PromptService, type AvatarType } from '../services/prompts';
import { BatchGenerator } from '../services/batch-generator';

type Bindings = {
  DB: D1Database;
  GOOGLE_AI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_AI_GATEWAY_NAME: string;
  CF_AI_GATEWAY_TOKEN: string;
};

const api = new Hono<{ Bindings: Bindings }>();

api.post('/batch/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const body = await c.req.json();
  const { services, zones, avatar, includeBlog } = body;

  if (!services || !zones) {
    return c.json({ error: 'Missing required fields: services, zones' }, 400);
  }

  const generator = new BatchGenerator(c.env.DB, {
    GOOGLE_AI_API_KEY: c.env.GOOGLE_AI_API_KEY,
    CF_ACCOUNT_ID: c.env.CF_ACCOUNT_ID,
    CF_AI_GATEWAY_NAME: c.env.CF_AI_GATEWAY_NAME,
    CF_AI_GATEWAY_TOKEN: c.env.CF_AI_GATEWAY_TOKEN,
  });

  try {
    const results = await generator.generateAll(projectId, {
      services,
      zones,
      avatar,
      includeBlog
    });

    return c.json({
      success: true,
      data: results
    });
  } catch (err: any) {
    console.error('Batch Generation Error:', err);
    return c.json({ 
      error: 'Failed to generate batch content', 
      details: err.message 
    }, 500);
  }
});

api.post('/content', async (c) => {
  const body = await c.req.json();
  const { niche, city, avatar, neighborhoods } = body;

  if (!niche || !city || !avatar) {
    return c.json({ error: 'Missing required fields: niche, city, avatar' }, 400);
  }

  const aiService = new AiService({
    apiKey: c.env.GOOGLE_AI_API_KEY,
    accountId: c.env.CF_ACCOUNT_ID,
    gatewayName: c.env.CF_AI_GATEWAY_NAME,
    gatewayToken: c.env.CF_AI_GATEWAY_TOKEN,
  });

  const promptService = new PromptService();
  const prompt = promptService.generatePrompt({ niche, city, neighborhoods }, avatar as AvatarType);

  try {
    // Richiediamo esplicitamente il formato JSON a Gemini
    const content = await aiService.generateContent(prompt, true);
    
    return c.json({
      success: true,
      data: content,
      metadata: {
        niche,
        city,
        avatar,
        generated_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('Generation Error:', err);
    return c.json({ error: 'Failed to generate content', details: err.message }, 500);
  }
});

export default api;

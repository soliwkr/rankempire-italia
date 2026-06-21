// RANK & RENT TELEGRAM BOT — Command Center (Vertex AI edition)
// Copiare in workers/telegram-bot/src/index.ts nel repo telegram-ranketogram.
// Rimuovere OPENROUTER_API_KEY da wrangler.toml e impostare i secret Vertex AI.

import { getVertexAccessToken } from './vertex-auth';
import { FactoryClient } from './factory-client';

type Env = {
  KV: KVNamespace;
  R2_SCOUT: R2Bucket;
  BOT_TOKEN: string;
  GOOGLE_SERVICE_ACCOUNT: string;
  GCP_PROJECT: string;
  GCP_LOCATION: string;
  GEMINI_MODEL: string;
  FACTORY_API_URL: string;
  FACTORY_API_SECRET: string;
};

interface ExtractedBusiness {
  businessName: string;
  niche: string;
  niche_slug: string;
  city: string;
  services: string[];
  phone: string | null;
  rank_rent_potential: 'alta' | 'media' | 'bassa';
}

interface BotSession {
  data: ExtractedBusiness;
  zones: string[];
  avatar: 'in-pain' | 'skeptic' | 'bundler';
  chatId: number;
}

const VISION_PROMPT = `Sei un analista SEO italiano specializzato in rank-and-rent.
Analizza questa foto di un'attività commerciale locale italiana.
Rispondi SOLO con JSON valido, zero testo aggiuntivo:

{
  "businessName": "nome attività",
  "niche": "nicchia in italiano (es. Idraulico, Elettricista, Ristrutturazioni)",
  "niche_slug": "nicchia-kebab-case",
  "city": "città",
  "services": ["servizio1", "servizio2", "servizio3"],
  "phone": "telefono o null",
  "rank_rent_potential": "alta|media|bassa"
}`;

async function callVertexVision(imageBase64: string, mimeType: string, env: Env): Promise<ExtractedBusiness> {
  const token = await getVertexAccessToken(env.GOOGLE_SERVICE_ACCOUNT);
  const url = `https://${env.GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GCP_PROJECT}/locations/${env.GCP_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: VISION_PROMPT },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vertex AI vision error: ${response.status} ${err}`);
  }

  const result = await response.json() as any;
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Vertex AI: risposta vuota');

  try {
    return JSON.parse(text) as ExtractedBusiness;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ExtractedBusiness;
    throw new Error('JSON non parsabile dalla risposta Vertex AI');
  }
}

async function inferZones(city: string, env: Env): Promise<string[]> {
  const token = await getVertexAccessToken(env.GOOGLE_SERVICE_ACCOUNT);
  const url = `https://${env.GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GCP_PROJECT}/locations/${env.GCP_LOCATION}/publishers/google/models/${env.GEMINI_MODEL}:generateContent`;

  const prompt = `Elenca 7 comuni italiani entro 30km da ${city} con popolazione 10.000-200.000 ab.\nRispondi SOLO con array JSON di stringhe. Esempio: ["Roma","Milano"]`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) return [city];

  const result = await response.json() as any;
  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  try {
    const zones = JSON.parse(text) as string[];
    return Array.isArray(zones) && zones.length > 0 ? zones : [city];
  } catch {
    return [city];
  }
}

async function tg(botToken: string, method: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function buildCard(data: ExtractedBusiness): string {
  const lines = [
    `\u{1F3E2} <b>${data.businessName}</b>`,
    `\u{1F4CD} ${data.city} • ${data.niche}`,
    `\u{1F527} Servizi: ${data.services.join(', ')}`,
    data.phone ? `\u{1F4DE} ${data.phone}` : null,
    `\u{1F4CA} Potenziale: <b>${data.rank_rent_potential.toUpperCase()}</b>`,
    '',
    'Vuoi creare il sito rank-and-rent?',
  ];
  return lines.filter(Boolean).join('\n');
}

async function runPipeline(session: BotSession, env: Env): Promise<void> {
  const { chatId, data, zones, avatar } = session;

  const statusRes = await tg(env.BOT_TOKEN, 'sendMessage', {
    chat_id: chatId,
    text: '⚙️ <b>Pipeline avviata...</b>\n⏳ Creazione progetto...',
    parse_mode: 'HTML',
  });
  const statusMsgId: number | undefined = statusRes.result?.message_id;

  const client = new FactoryClient(env.FACTORY_API_URL, env.FACTORY_API_SECRET);

  const editStatus = async (text: string) => {
    if (!statusMsgId) return;
    await tg(env.BOT_TOKEN, 'editMessageText', {
      chat_id: chatId,
      message_id: statusMsgId,
      text,
      parse_mode: 'HTML',
    });
  };

  try {
    const slug = `${data.niche_slug}-${data.city.toLowerCase().replace(/\s+/g, '-')}`;
    const project = await client.createProject({
      slug,
      name: `${data.niche} ${data.city}`,
      niche: data.niche,
      location: data.city,
      createdVia: 'bot',
      buildMode: 'speculative',
    });

    await editStatus('⚙️ <b>Pipeline in corso...</b>\n✅ Progetto creato\n⏳ Generazione pagine...');

    const seedData = { services: data.services, zones, avatar };
    const types = ['homepage', 'services', 'zones', 'service_zones', 'blog'];
    for (const type of types) {
      await client.seedProject(project.id, type, seedData);
    }

    await editStatus('⚙️ <b>Pipeline in corso...</b>\n✅ Progetto creato\n✅ Pagine generate\n⏳ Deploy Workers...');

    const deployResult = await client.deployProject(project.id, seedData);
    const workerUrl = deployResult.workerUrl ?? deployResult.pagesUrl ?? '(in progress)';

    await tg(env.BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text: `\u{1F389} <b>Sito in deploy!</b>\n\n\u{1F3E2} <b>${data.businessName}</b>\n\u{1F310} <a href="${workerUrl}">${workerUrl}</a>\n\nGitHub Actions sta compilando e deployando. Live entro 2-3 minuti.`,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });

  } catch (err: any) {
    console.error('[pipeline] error:', err.message);
    await tg(env.BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text: `❌ <b>Pipeline fallita</b>\n<code>${err.message}</code>`,
      parse_mode: 'HTML',
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') return new Response('OK');

    let update: any;
    try {
      update = await request.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    // Callback query (inline keyboard)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId: number = cb.message?.chat?.id;
      const data: string = cb.data ?? '';

      await tg(env.BOT_TOKEN, 'answerCallbackQuery', {
        callback_query_id: cb.id,
        text: data.startsWith('publish:') ? '⏳ Avvio pipeline...' : '✏️ Non ancora supportato',
      });

      if (data.startsWith('publish:')) {
        const sessionStr = await env.KV.get(`session:${chatId}`);
        if (!sessionStr) {
          await tg(env.BOT_TOKEN, 'sendMessage', {
            chat_id: chatId,
            text: '❌ Sessione scaduta. Invia di nuovo la foto.',
          });
          return new Response('OK');
        }
        const session: BotSession = JSON.parse(sessionStr);
        ctx.waitUntil(runPipeline(session, env));
      }

      return new Response('OK');
    }

    const message = update.message;
    if (!message) return new Response('OK');

    const chatId: number = message.chat.id;
    const text: string = message.text ?? '';

    if (text === '/start') {
      await tg(env.BOT_TOKEN, 'sendMessage', {
        chat_id: chatId,
        text: '\u{1F44B} <b>Rank & Rent Bot</b>\n\nInviami la foto di un\'attività commerciale italiana.\nAnalizzerò la nicchia, la città e i servizi, poi basta un tap per creare il sito.',
        parse_mode: 'HTML',
      });
      return new Response('OK');
    }

    const photo = message.photo;
    if (!photo || photo.length === 0) return new Response('OK');

    const fileId: string = photo[photo.length - 1].file_id;

    ctx.waitUntil((async () => {
      try {
        await tg(env.BOT_TOKEN, 'sendMessage', {
          chat_id: chatId,
          text: '\u{1F50D} Analisi foto in corso (Vertex AI)...',
        });

        const fileInfoRes = await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const fileInfo = await fileInfoRes.json() as any;
        const filePath: string = fileInfo.result?.file_path;
        if (!filePath) throw new Error('Telegram getFile: file_path non disponibile');

        const photoRes = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`);
        const photoBuffer = await photoRes.arrayBuffer();
        const photoBase64 = btoa(String.fromCharCode(...new Uint8Array(photoBuffer)));
        const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

        const extracted = await callVertexVision(photoBase64, mimeType, env);
        const zones = await inferZones(extracted.city, env);

        const session: BotSession = { data: extracted, zones, avatar: 'in-pain', chatId };
        await env.KV.put(`session:${chatId}`, JSON.stringify(session), { expirationTtl: 1800 });

        await tg(env.BOT_TOKEN, 'sendMessage', {
          chat_id: chatId,
          text: buildCard(extracted),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Pubblica', callback_data: `publish:${chatId}` },
              { text: '✏️ Modifica', callback_data: `edit:${chatId}` },
            ]],
          },
        });

      } catch (err: any) {
        console.error('[bot] Photo error:', err.message);
        await tg(env.BOT_TOKEN, 'sendMessage', {
          chat_id: chatId,
          text: `❌ Errore analisi: ${err.message}\n\nRiprova con un'altra foto.`,
        });
      }
    })());

    return new Response('OK');
  },
};

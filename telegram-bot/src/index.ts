import { callVertexGeminiVision, callVertexGemini } from './vertex-auth';
import { FactoryClient } from './factory-client';

interface Env {
  KV: KVNamespace;
  R2_PHOTOS: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  GOOGLE_SERVICE_ACCOUNT: string;
  GCP_PROJECT: string;
  GCP_LOCATION: string;
  GEMINI_MODEL: string;
  FACTORY_API_URL: string;
  FACTORY_API_SECRET: string;
  CF_WORKERS_SUBDOMAIN: string;
}

interface VisionResult {
  niche: string;
  niche_slug: string;
  city: string;
  city_slug: string;
  services: string[];
  zones: string[];
  phone: string;
  business_name: string;
  avatar: 'in-pain' | 'skeptic' | 'bundler';
  rank_rent_potential: number;
}

interface SessionData extends VisionResult {
  chatId: number;
  messageId: number;
  r2Key: string;
}

// ── Telegram API helpers ──────────────────────────────────────────────────────

async function tgCall(token: string, method: string, body: object): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(token: string, chatId: number, text: string, extra: object = {}): Promise<any> {
  return tgCall(token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });
}

async function editMessage(token: string, chatId: number, messageId: number, text: string): Promise<void> {
  await tgCall(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  });
}

// ── Vision analysis ───────────────────────────────────────────────────────────

const VISION_PROMPT = `Sei un esperto SEO italiano di rank-and-rent. Analizza questa foto di un'attività locale italiana.

Estrai le seguenti informazioni in JSON (SOLO JSON, nessun testo aggiuntivo):
{
  "niche": "categoria dell'attività in italiano (es: idraulico, elettricista, carrozzeria)",
  "niche_slug": "slug URL-friendly in italiano (es: idraulico, elettricista, carrozzeria)",
  "city": "città dove opera l'attività (in italiano, es: Roma, Milano)",
  "city_slug": "slug URL-friendly della città (es: roma, milano)",
  "services": ["lista di 4-6 servizi offerti, slug in italiano"],
  "zones": [],
  "phone": "numero di telefono se visibile, altrimenti stringa vuota",
  "business_name": "nome dell'attività se visibile, altrimenti stringa vuota",
  "avatar": "uno tra: in-pain (cliente con problema urgente), skeptic (cliente diffidente), bundler (cliente vuole pacchetto completo)",
  "rank_rent_potential": numero da 1 a 10 basato su competitività della nicchia e potenziale rank-rent
}

Se non riesci a identificare niche o city con certezza, fai del tuo meglio con i dati visibili.
Rispondi SOLO con il JSON.`;

async function analyzePhoto(
  imageBase64: string,
  mimeType: string,
  env: Env
): Promise<VisionResult> {
  const vertexConfig = {
    project: env.GCP_PROJECT,
    location: env.GCP_LOCATION,
    model: env.GEMINI_MODEL,
    serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT,
  };

  const raw = await callVertexGeminiVision(imageBase64, mimeType, VISION_PROMPT, vertexConfig);

  let parsed: VisionResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Vision response non è JSON valido');
    }
  }

  return parsed;
}

// ── Zone inference ────────────────────────────────────────────────────────────

async function inferZones(city: string, niche: string, env: Env): Promise<string[]> {
  const prompt = `Sei un esperto SEO italiano. Elenca 7 comuni nella provincia o area di "${city}", Italia, con popolazione tra 5.000 e 200.000 abitanti, rilevanti per una ricerca di "${niche}". Rispondi SOLO con un JSON array di stringhe slug-URL (es: ["comune-uno", "comune-due"]). Includi anche "${city.toLowerCase().replace(/\s+/g, '-')}" come primo elemento.`;

  const vertexConfig = {
    project: env.GCP_PROJECT,
    location: env.GCP_LOCATION,
    model: env.GEMINI_MODEL,
    serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT,
  };

  const raw = await callVertexGemini(prompt, vertexConfig);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, 8) as string[];
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]).slice(0, 8) as string[];
  }
  return [city.toLowerCase().replace(/\s+/g, '-')];
}

// ── Card formatting ───────────────────────────────────────────────────────────

function formatCard(v: VisionResult): string {
  const stars = '⭐'.repeat(Math.round(v.rank_rent_potential / 2));
  const avatar_emoji = v.avatar === 'in-pain' ? '🔥' : v.avatar === 'skeptic' ? '🤨' : '📦';

  return (
    `📸 <b>ANALISI COMPLETATA</b>\n\n` +
    `🏢 <b>Niche:</b> ${v.niche}\n` +
    `📍 <b>Città:</b> ${v.city}\n` +
    `🔧 <b>Servizi:</b> ${v.services.join(', ')}\n` +
    `🗺️ <b>Zone:</b> ${v.zones.length > 0 ? v.zones.join(', ') : 'in elaborazione...'}\n` +
    (v.phone ? `📞 <b>Tel:</b> ${v.phone}\n` : '') +
    (v.business_name ? `🏷️ <b>Nome:</b> ${v.business_name}\n` : '') +
    `${avatar_emoji} <b>Avatar:</b> ${v.avatar}\n` +
    `${stars} <b>Potenziale R&R:</b> ${v.rank_rent_potential}/10\n\n` +
    `<b>Slug:</b> <code>${v.niche_slug}-${v.city_slug}</code>\n\n` +
    `Vuoi pubblicare questo sito rank-rent?`
  );
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

async function runPipeline(session: SessionData, env: Env): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = session.chatId;
  const factory = new FactoryClient(env.FACTORY_API_URL, env.FACTORY_API_SECRET);

  const slug = `${session.niche_slug}-${session.city_slug}`;
  const projectName = `${session.niche} ${session.city}`;

  let statusMsgId: number | undefined;

  async function status(text: string): Promise<void> {
    if (statusMsgId) {
      await editMessage(token, chatId, statusMsgId, text);
    } else {
      const res = await sendMessage(token, chatId, text);
      statusMsgId = res?.result?.message_id;
    }
  }

  try {
    await status(`⏳ <b>Pipeline avviata</b>\n\n🏗️ Creazione progetto <code>${slug}</code>...`);

    const projectId = await factory.createProject({
      slug,
      name: projectName,
      niche: session.niche,
      location: session.city,
      createdVia: 'bot',
      buildMode: 'speculative',
      sourcePhotoR2Key: session.r2Key,
    });

    await status(
      `✅ <b>Progetto creato</b>\n\n` +
      `🤖 Generazione contenuti AI...\n` +
      `(~105 pagine: homepage, servizi, zone, blog)`
    );

    const seedData = {
      services: session.services,
      zones: session.zones,
      avatar: session.avatar,
    };

    const types = ['homepage', 'services', 'zones', 'service_zones', 'blog'] as const;
    let totalPages = 0;
    for (const type of types) {
      const n = await factory.seedProject(projectId, type, seedData);
      totalPages += n;
      await status(
        `✅ <b>Progetto creato</b>\n\n` +
        `🤖 Generando <b>${type}</b>... (${totalPages} pagine finora)`
      );
    }

    await status(
      `✅ <b>Contenuti generati</b> (${totalPages} pagine)\n\n` +
      `🚀 Deploy su Cloudflare Workers...`
    );

    const deployedUrl = await factory.deployProject(projectId, seedData);

    const workerUrl = deployedUrl || `https://rr-${slug}.${env.CF_WORKERS_SUBDOMAIN}.workers.dev`;

    await sendMessage(
      token,
      chatId,
      `🎉 <b>SITO ONLINE!</b>\n\n` +
      `🔗 <a href="${workerUrl}">${workerUrl}</a>\n\n` +
      `📊 ${totalPages} pagine generate\n` +
      `🏢 ${projectName} — ${session.city}\n\n` +
      `Il deploy GitHub Action è in corso. Il sito sarà live tra ~2 minuti.`
    );

  } catch (err: any) {
    console.error('[pipeline] error:', err.message);
    await sendMessage(
      token,
      chatId,
      `❌ <b>Errore pipeline</b>\n\n<code>${err.message}</code>\n\nRiprova o contatta il supporto.`
    );
  }
}

// ── Photo handler ─────────────────────────────────────────────────────────────

async function handlePhoto(
  chatId: number,
  messageId: number,
  fileId: string,
  env: Env
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;

  const statusMsg = await sendMessage(token, chatId, '🔍 Analisi foto in corso con Vertex AI...');
  const statusMsgId: number = statusMsg?.result?.message_id;

  // 1. Get file info from Telegram
  const fileRes = await tgCall(token, 'getFile', { file_id: fileId });
  const filePath: string = fileRes?.result?.file_path;
  if (!filePath) throw new Error('Impossibile ottenere file_path da Telegram');

  // 2. Download photo
  const downloadRes = await fetch(
    `https://api.telegram.org/file/bot${token}/${filePath}`
  );
  if (!downloadRes.ok) throw new Error(`Download foto fallito: ${downloadRes.status}`);

  const imageBuffer = await downloadRes.arrayBuffer();
  const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // 3. Store in R2 for audit trail
  const r2Key = `photos/${chatId}/${messageId}-${Date.now()}.jpg`;
  await env.R2_PHOTOS.put(r2Key, imageBuffer, {
    httpMetadata: { contentType: mimeType },
  });

  // 4. Vision analysis
  await editMessage(token, chatId, statusMsgId, '🧠 Analisi AI in corso...');
  const vision = await analyzePhoto(imageBase64, mimeType, env);

  // 5. Zone inference (if not extracted from photo)
  if (!vision.zones || vision.zones.length === 0) {
    await editMessage(token, chatId, statusMsgId, '🗺️ Calcolo zone target...');
    vision.zones = await inferZones(vision.city, vision.niche, env);
  }

  // 6. Store session in KV (30 min TTL)
  const sessionKey = `session:${chatId}:${messageId}`;
  const session: SessionData = {
    ...vision,
    chatId,
    messageId,
    r2Key,
  };
  await env.KV.put(sessionKey, JSON.stringify(session), { expirationTtl: 1800 });

  // 7. Send confirmation card with inline keyboard
  await tgCall(token, 'deleteMessage', { chat_id: chatId, message_id: statusMsgId });
  await tgCall(token, 'sendMessage', {
    chat_id: chatId,
    text: formatCard(vision),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Pubblica subito', callback_data: `confirm:${sessionKey}` },
        { text: '✏️ Rianalizza', callback_data: `retry:${sessionKey}` },
      ]],
    },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 });
    }

    let update: any;
    try {
      update = await request.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    // ── Callback query (button tap) ──
    if (update.callback_query) {
      const query = update.callback_query;
      const data: string = query.data ?? '';
      const chatId: number = query.message?.chat?.id;
      const token = env.TELEGRAM_BOT_TOKEN;

      // Always answer callback to remove loading spinner
      await tgCall(token, 'answerCallbackQuery', { callback_query_id: query.id });

      if (data.startsWith('confirm:')) {
        const sessionKey = data.replace('confirm:', '');
        const raw = await env.KV.get(sessionKey);

        if (!raw) {
          await sendMessage(token, chatId, '⏰ Sessione scaduta. Invia di nuovo la foto.');
          return new Response('OK');
        }

        const session: SessionData = JSON.parse(raw);

        // Edit the card to show "avviato"
        await tgCall(token, 'editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: { inline_keyboard: [] },
        });

        await sendMessage(token, chatId, '🚀 Pipeline avviata! Ti aggiorno passo per passo...');

        // Run pipeline in background — respond to Telegram immediately
        ctx.waitUntil(runPipeline(session, env));

      } else if (data.startsWith('retry:')) {
        await sendMessage(
          token,
          chatId,
          '📸 Invia di nuovo la foto per una nuova analisi.'
        );
      }

      return new Response('OK');
    }

    // ── Message ──
    const message = update.message;
    if (!message) return new Response('OK');

    const chatId: number = message.chat?.id;
    const text: string = message.text ?? '';
    const token = env.TELEGRAM_BOT_TOKEN;

    // Commands
    if (text === '/start') {
      await sendMessage(
        token,
        chatId,
        '👋 <b>Rank & Rent Bot</b>\n\nInviami la foto di un\'attività locale italiana e creerò automaticamente un sito rank-rent ottimizzato SEO.\n\n📸 Scatta o invia la foto di:\n• Insegne di negozi\n• Furgoni con logo\n• Volantini\n• Qualsiasi attività locale\n\n🚀 In pochi minuti il sito sarà online!'
      );
      return new Response('OK');
    }

    if (text === '/help') {
      await sendMessage(
        token,
        chatId,
        '🆘 <b>Comandi disponibili:</b>\n\n/start — Messaggio di benvenuto\n/help — Questo messaggio\n\n📸 Invia una foto di un\'attività locale per avviare la pipeline rank-rent.'
      );
      return new Response('OK');
    }

    // Photo message
    if (message.photo) {
      const photos: Array<{ file_id: string; file_size: number }> = message.photo;
      // Use the largest photo (last in array)
      const largest = photos[photos.length - 1];
      if (!largest) return new Response('OK');

      ctx.waitUntil(
        handlePhoto(chatId, message.message_id, largest.file_id, env).catch(async (err: Error) => {
          console.error('[handlePhoto] error:', err.message);
          await sendMessage(
            token,
            chatId,
            `❌ Errore analisi foto: <code>${err.message}</code>\n\nRiprova tra qualche istante.`
          );
        })
      );

      return new Response('OK');
    }

    // Document (high-res photo sent as file)
    if (message.document && message.document.mime_type?.startsWith('image/')) {
      ctx.waitUntil(
        handlePhoto(chatId, message.message_id, message.document.file_id, env).catch(async (err: Error) => {
          console.error('[handlePhoto] error:', err.message);
          await sendMessage(
            token,
            chatId,
            `❌ Errore analisi immagine: <code>${err.message}</code>`
          );
        })
      );
      return new Response('OK');
    }

    return new Response('OK');
  },
};

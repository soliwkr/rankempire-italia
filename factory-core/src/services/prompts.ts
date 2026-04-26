export type AvatarType = 'in-pain' | 'skeptic' | 'bundler';

export interface ProjectContext {
  niche: string;
  city: string;
  neighborhoods?: string[];
}

/**
 * Rimuove tag script, iframe e event handler inline da HTML.
 * Utilizzata prima di scrivere body su D1 per prevenire XSS.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '');
}

export class PromptService {
  // Istruzioni di base Gary Halbert — riusate in tutti i metodi
  private getBaseInstructions(context: ProjectContext): string {
    const { niche, city, neighborhoods } = context;
    const neighborhoodsText = neighborhoods?.join(', ') || '';
    return `
Sei un esperto di Direct Response Copywriting, formato alla scuola di Gary Halbert.
Il tuo obiettivo è scrivere il contenuto per pagine di un servizio locale in Italia.
Lingua: Italiano naturale, colloquiale ma professionale, SENZA "aziendalese".
Localizzazione: Devi citare ${city}${neighborhoodsText ? ' e le zone di ' + neighborhoodsText : ''} in modo organico, almeno 2-3 volte per pagina.

REGOLE D'ORO DI GARY HALBERT:
- Usa frasi brevi e incisive.
- Vai dritto al punto: qual è il beneficio principale?
- Crea un'offerta "mafia": un'offerta che non si può rifiutare.
- Parla al lettore come se fosse un amico a cui stai dando un consiglio urgente.
    `;
  }

  // Avatar specifici — riusati in tutti i metodi
  private getAvatarSpecifics(avatar: AvatarType): string {
    const avatarText = {
      'in-pain': `
AVATAR: IN-PAIN (Emergenza/Urgenza)
PSICOLOGIA: Il cliente ha un problema ORA. Ha dolore, ha l'acqua in casa, o il tetto che perde. Non ha tempo per le chiacchiere.
TONO: Empatico ma estremamente risolutivo. "So cosa stai passando, siamo qui per risolverlo subito".
CTA: Focus sulla velocità di intervento.
      `,
      'skeptic': `
AVATAR: SKEPTIC (Il Diffidente)
PSICOLOGIA: Il cliente è stato scottato in passato. Pensa che tutti i professionisti siano dei "furbetti". Cerca prove e certezze.
TONO: Trasparente, onesto, autoritario. Usa termini come "Garanzia", "Certificato", "Prezzo bloccato".
CTA: Focus sul preventivo trasparente e senza impegno.
      `,
      'bundler': `
AVATAR: BUNDLER (L'Affarista)
PSICOLOGIA: Il cliente vuole il miglior rapporto qualità-prezzo. Ama i pacchetti "tutto incluso" dove non deve pensare a nulla.
TONO: Orientato al valore e alla comodità. "Facciamo tutto noi, risparmi tempo e stress".
CTA: Focus sulla consulenza gratuita per il pacchetto completo.
      `
    };
    return avatarText[avatar];
  }

  generatePrompt(context: ProjectContext, avatar: AvatarType): string {
    const { niche, city } = context;

    return `
${this.getBaseInstructions(context)}
${this.getAvatarSpecifics(avatar)}

DATI PROGETTO:
Nicchia: ${niche}
Città: ${city}

GENERA UN JSON CON QUESTA STRUTTURA:
{
  "hero": {
    "title": "Un titolo magnetico che cattura l'attenzione",
    "subtitle": "Un sottotitolo che spiega il beneficio e crea urgenza",
    "cta": "Testo della CTA"
  },
  "services": [
    { "title": "Servizio 1", "description": "Descrizione persuasiva" },
    { "title": "Servizio 2", "description": "Descrizione persuasiva" },
    { "title": "Servizio 3", "description": "Descrizione persuasiva" }
  ],
  "seo": {
    "meta_title": "Titolo SEO-friendly",
    "meta_description": "Description che spinge al click nei risultati di ricerca"
  }
}

RITORNA SOLO IL JSON.
    `;
  }

  /**
   * generateHomepagePrompt — Genera il prompt per la homepage
   * Output: 1 pagina di tipo 'homepage'
   */
  generateHomepagePrompt(context: ProjectContext, avatar: AvatarType): string {
    const { niche, city } = context;
    return `
${this.getBaseInstructions(context)}
${this.getAvatarSpecifics(avatar)}

DATI PROGETTO:
Nicchia: ${niche}
Città: ${city}

COMPITO:
Genera 1 pagina homepage per un'agenzia locale nella nicchia "${niche}" che opera a ${city}.
La homepage deve presentare il valore principale, i principali servizi, testimoniali impliciti e una CTA persuasiva.

FORMATO OUTPUT:
Ritorna SOLAMENTE un JSON array con 1 elemento:

[
  {
    "slug": "homepage",
    "type": "homepage",
    "title": "Titolo H1 accattivante per la nicchia (max 60 caratteri)",
    "body": "<p>Paragrafo 1...</p><h2>Sezione 2</h2><p>Paragrafo...</p><ul><li>Beneficio 1</li><li>Beneficio 2</li></ul>...",
    "faq": [
      {"question": "Domanda 1?", "answer": "Risposta 1."},
      {"question": "Domanda 2?", "answer": "Risposta 2."},
      {"question": "Domanda 3?", "answer": "Risposta 3."}
    ],
    "meta": {
      "description": "Descrizione SEO max 160 caratteri con keyword, città, e CTA.",
      "canonical": "/homepage/"
    }
  }
]

REGOLE CRITICHE:
- Ritorna SOLAMENTE il JSON array, nessun testo prima o dopo.
- body deve contenere 400-600 parole in HTML semantico: solo <p> <h2> <h3> <ul> <li> <strong>. VIETATO <script> <iframe> <style>.
- Cita ${city} almeno 2-3 volte in modo organico nel testo.
- Il tono deve riflettere l'avatar scelto.
    `;
  }

  /**
   * generateServicesPrompt — Genera il prompt per le pagine servizio
   * Output: N pagine, una per ogni servizio
   */
  generateServicesPrompt(context: ProjectContext, services: string[], avatar: AvatarType): string {
    const { niche, city } = context;
    const servicesText = services.join(', ');
    return `
${this.getBaseInstructions(context)}
${this.getAvatarSpecifics(avatar)}

DATI PROGETTO:
Nicchia: ${niche}
Città: ${city}

COMPITO:
Genera UNA pagina per CIASCUNO dei seguenti servizi: ${servicesText}

Ogni pagina deve descrivere il servizio specifico, i benefici, il processo, e una CTA specifica per quel servizio.

FORMATO OUTPUT:
Ritorna SOLAMENTE un JSON array con ${services.length} elementi (uno per servizio):

[
  {
    "slug": "servizio-1-slugified",
    "type": "service",
    "title": "Titolo che include il servizio e ${city} (max 60 caratteri)",
    "body": "<p>Paragrafo introduttivo...</p><h2>Come funziona</h2>...",
    "faq": [
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."}
    ],
    "meta": {
      "description": "SEO description con keyword servizio, ${city}, e CTA.",
      "canonical": "/servizio-slugified/"
    }
  }
]

REGOLE CRITICHE:
- Ritorna SOLAMENTE il JSON array, nessun testo prima o dopo.
- body deve contenere 400-600 parole per pagina.
- Cita ${city} almeno 2-3 volte per pagina in modo organico.
- Il tono deve riflettere l'avatar scelto (urgenza, certezza, valore a seconda dell'avatar).
    `;
  }

  /**
   * generateZonesPrompt — Genera il prompt per le pagine zona
   * Output: N pagine, una per ogni zona
   */
  generateZonesPrompt(context: ProjectContext, zones: string[], avatar: AvatarType): string {
    const { niche, city } = context;
    const zonesText = zones.join(', ');
    return `
${this.getBaseInstructions(context)}
${this.getAvatarSpecifics(avatar)}

DATI PROGETTO:
Nicchia: ${niche}
Città principale: ${city}

COMPITO:
Genera UNA pagina per CIASCUNA delle seguenti zone: ${zonesText}

Ogni pagina descrive la disponibilità dei servizi della nicchia "${niche}" in quella zona specifica. Cita vantaggi locali, prossimità, tempistiche di intervento.

FORMATO OUTPUT:
Ritorna SOLAMENTE un JSON array con ${zones.length} elementi (uno per zona):

[
  {
    "slug": "zona-1-slugified",
    "type": "zone",
    "title": "Titolo con zona e nicchia (max 60 caratteri)",
    "body": "<p>Disponibili nella zona di...</p>...",
    "faq": [
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."}
    ],
    "meta": {
      "description": "SEO con zona e nicchia.",
      "canonical": "/zona-slugified/"
    }
  }
]

REGOLE CRITICHE:
- Ritorna SOLAMENTE il JSON array, nessun testo prima o dopo.
- body deve contenere 400-600 parole per pagina.
- Cita la zona specifica e ${city} ripetutamente (localization).
- Enfatizza vantaggi geografici: vicinanza, tempi di intervento, competenza locale.
    `;
  }

  /**
   * generateServiceZonesPrompt — Genera il prompt per le pagine servizio × zona
   * Output: M pagine (una per zona) per UN servizio
   */
  generateServiceZonesPrompt(context: ProjectContext, service: string, zones: string[], avatar: AvatarType): string {
    const { niche, city } = context;
    const zonesText = zones.join(', ');
    return `
${this.getBaseInstructions(context)}
${this.getAvatarSpecifics(avatar)}

DATI PROGETTO:
Nicchia: ${niche}
Città principale: ${city}

COMPITO:
Per il servizio "${service}", genera UNA pagina per CIASCUNA zona: ${zonesText}

Ogni pagina è altamente localizzata: H1 obbligatorio nel format "${service} a {zona}" — keyword principale.
Descrivi il servizio specifico disponibile in quella zona, vantaggi geografici, prossimità, tempistiche.

FORMATO OUTPUT:
Ritorna SOLAMENTE un JSON array con ${zones.length} elementi (uno per zona):

[
  {
    "slug": "servizio-slugified-zona-1-slugified",
    "type": "service_zone",
    "title": "${service} a {zona} (max 60 caratteri)",
    "body": "<h1>${service} a {zona}</h1><p>Offriamo ${service} nella zona di...</p>...",
    "faq": [
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."}
    ],
    "meta": {
      "description": "SEO con ${service}, zona, ${city}.",
      "canonical": "/servizio-slugified-zona-slugified/"
    }
  }
]

REGOLE CRITICHE:
- Ritorna SOLAMENTE il JSON array, nessun testo prima o dopo.
- body deve contenere 400-600 parole per pagina.
- Cita il servizio, la zona, e ${city} ripetutamente per massima localization.
- H1 obbligatorio: "${service} a {zona}" — keyword principale per SEO locale.
- Enfatizza: tempi intervento, competenza zona, vantaggi geografici.
    `;
  }

  /**
   * generateBlogPrompt — Genera il prompt per articoli blog informativi
   * Output: K pagine (AI decide quante, tra 3 e 7)
   */
  generateBlogPrompt(context: ProjectContext, avatar: AvatarType): string {
    const { niche, city } = context;
    return `
${this.getBaseInstructions(context)}
${this.getAvatarSpecifics(avatar)}

DATI PROGETTO:
Nicchia: ${niche}
Città: ${city}

COMPITO:
Genera tra 3 e 7 articoli blog informativi sulla nicchia "${niche}" a ${city}.
Scegli argomenti pratici, guide, FAQ settoriali, confronti di servizi, tendenze locali.
Tono: informativo/educativo, ma con voce ${avatar} (meno urgenza, più contenuto).

FORMATO OUTPUT:
Ritorna SOLAMENTE un JSON array con tra 3 e 7 elementi:

[
  {
    "slug": "blog-argomento-1-slugified",
    "type": "blog",
    "title": "Titolo articolo attraente (max 60 caratteri)",
    "body": "<h2>Titolo articolo</h2><p>Introduzione...</p><h3>Sottosezione</h3><p>Contenuto...</p>...",
    "faq": [
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."},
      {"question": "Domanda?", "answer": "Risposta."}
    ],
    "meta": {
      "description": "SEO description informativa con keyword.",
      "canonical": "/blog-argomento-slugified/"
    }
  }
]

REGOLE CRITICHE:
- Ritorna SOLAMENTE il JSON array, nessun testo prima o dopo.
- body deve contenere 400-600 parole per articolo.
- Cita ${city} e la nicchia "${niche}" almeno 2-3 volte per articolo.
- Argomenti suggerirti: guide pratiche, domande frequenti del cliente, confronti servizi, trend locali, consigli manutenzione.
- Tono: consulenziale, educativo, fiducioso (ma non pressante come homepage).
    `;
  }
}

// Italian rank-rent content quality gate — adapted from thesprint-generator

const FORBIDDEN_PHRASES = [
  // Reddito passivo / income claims
  'reddito passivo',
  'guadagna online',
  'guadagna da casa',
  'sistema garantito',
  'sistema automatico',
  'reddito garantito',
  'guadagno garantito',
  'ricco in poco tempo',
  'lavora da casa',
  'libertà finanziaria',
  // Generic spammy CTAs
  'clicca qui per',
  'scopri il segreto',
  'metodo rivoluzionario',
  'risultati garantiti al 100%',
  // Fake urgency
  'offerta limitata a',
  'solo per oggi',
  'ultimi posti disponibili',
  // Legal red flags
  'senza partita iva',
  'in nero',
  'senza contratto',
];

// Income patterns (numbers + euro claims)
const INCOME_CLAIM_PATTERNS = [
  /guadagn[a-z]+ \d+[\.,]?\d*\s*€/i,
  /\d+[\.,]?\d*\s*€\s*(al mese|mensili|all'anno|annui)/i,
  /fattur[a-z]+ \d+[\.,]?\d*\s*€/i,
  /risparmi[a-z]+ \d+[\.,]?\d*\s*€/i,
];

// Must be in Italian — flag if too much English in body
const ENGLISH_DOMINANCE_PATTERN = /\b(the|and|for|you|are|with|that|this|have|from|they|will|your|been|more|were|said|each|which|their|time|would|there|could|other|than|then|some|what|also|into|only|just|know|take|year|over|think|when|much|before|never|about|right|through|might)\b/gi;

export interface QualityResult {
  ok: boolean;
  reasons: string[];
}

export function qualityCheck(content: { title: string; body: string }): QualityResult {
  const reasons: string[] = [];
  const combined = `${content.title} ${content.body}`.toLowerCase();

  // 1. Forbidden phrase check
  for (const phrase of FORBIDDEN_PHRASES) {
    if (combined.includes(phrase)) {
      reasons.push(`Frase vietata: "${phrase}"`);
    }
  }

  // 2. Income claim patterns
  for (const pattern of INCOME_CLAIM_PATTERNS) {
    if (pattern.test(combined)) {
      reasons.push('Income claim detected');
      break;
    }
  }

  // 3. Minimum content length
  const bodyTextLength = content.body.replace(/<[^>]+>/g, '').length;
  if (bodyTextLength < 300) {
    reasons.push(`Contenuto troppo breve: ${bodyTextLength} caratteri (minimo 300)`);
  }

  // 4. English dominance check — flag if more than 15% English stop words
  const englishMatches = (combined.match(ENGLISH_DOMINANCE_PATTERN) ?? []).length;
  const wordCount = combined.split(/\s+/).length;
  if (wordCount > 50 && englishMatches / wordCount > 0.15) {
    reasons.push(`Troppo inglese nel contenuto (${Math.round(englishMatches / wordCount * 100)}%)`);
  }

  // 5. Script injection check (safety — should be caught earlier but double-check)
  if (/<script/i.test(content.body)) {
    reasons.push('Script tag rilevato nel body — rifiutato per sicurezza');
  }

  return { ok: reasons.length === 0, reasons };
}

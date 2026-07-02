const FORBIDDEN_PHRASES = [
  'guadagna online',
  'reddito passivo',
  'sistema garantito',
  'risultati garantiti',
  'guadagni sicuri',
  'lavora da casa',
  'arricchirsi facilmente',
  'soldi facili',
  'investimento sicuro',
  'rendimento garantito',
  'click here',
  'learn more',
  'buy now',
  'get started',
  'sign up',
  'subscribe now',
];

const AMERICAN_SPELLING_PATTERNS: RegExp[] = [
  /\bcolor\b/i,
  /\bfavor\b/i,
  /\bhonor\b/i,
  /\bbehavior\b/i,
  /\borganize\b/i,
  /\brealize\b/i,
  /\banalyze\b/i,
  /\bcenter\b/i,
];

const MIN_CONTENT_LENGTH = 200;

export interface QualityResult {
  ok: boolean;
  reasons: string[];
}

export function qualityCheck(content: string): QualityResult {
  const reasons: string[] = [];
  const lower = content.toLowerCase();

  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      reasons.push(`Frase vietata: "${phrase}"`);
    }
  }

  for (const pattern of AMERICAN_SPELLING_PATTERNS) {
    if (pattern.test(content)) {
      reasons.push(`Spelling non italiano: ${pattern.source}`);
    }
  }

  if (content.trim().length < MIN_CONTENT_LENGTH) {
    reasons.push(`Contenuto troppo breve (${content.trim().length} < ${MIN_CONTENT_LENGTH} caratteri)`);
  }

  return { ok: reasons.length === 0, reasons };
}

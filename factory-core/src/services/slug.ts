/**
 * slug.ts — Slug normalization utilities
 *
 * Converts Italian text (service names, zone names, etc.) into
 * URL-safe, deterministic slugs. Used to ensure D1-stored slugs
 * match the format expected by the Astro template's buildPaths logic.
 */

const ACCENT_MAP: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ñ: 'n', ç: 'c',
};

/**
 * Converts a string to a URL-safe slug.
 * e.g. "Spurgo Fognature" → "spurgo-fognature"
 *      "Formia (LT)"      → "formia-lt"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäèéêëìíîïòóôõöùúûüñç]/g, (ch) => ACCENT_MAP[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds the canonical slug for a service-zone page.
 * This matches the format expected by buildServiceZonePaths:
 *   `${service}/${zone}`
 *
 * e.g. slugifyServiceZone("Spurgo Fognature", "Formia") → "spurgo-fognature/formia"
 */
export function slugifyServiceZone(service: string, zone: string): string {
  return `${slugify(service)}/${slugify(zone)}`;
}

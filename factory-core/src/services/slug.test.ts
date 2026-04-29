import { describe, it, expect } from 'vitest';
import { slugify, slugifyServiceZone } from './slug';

describe('slugify', () => {
  it('converte in minuscolo', () => {
    expect(slugify('Formia')).toBe('formia');
  });

  it('sostituisce spazi con trattini', () => {
    expect(slugify('spurgo fognature')).toBe('spurgo-fognature');
  });

  it('normalizza accenti italiani', () => {
    expect(slugify('Città di Napoli')).toBe('citta-di-napoli');
    expect(slugify('servizio è disponibile')).toBe('servizio-e-disponibile');
    expect(slugify('pulizia grondaie')).toBe('pulizia-grondaie');
  });

  it('rimuove caratteri speciali', () => {
    expect(slugify('Formia (LT)')).toBe('formia-lt');
    expect(slugify('autospurghi & pulizia')).toBe('autospurghi-pulizia');
  });

  it('collassa trattini multipli', () => {
    expect(slugify('a  b')).toBe('a-b');
    expect(slugify('a -- b')).toBe('a-b');
  });

  it('rimuove trattini iniziali e finali', () => {
    expect(slugify(' formia ')).toBe('formia');
    expect(slugify('-formia-')).toBe('formia');
  });

  it('gestisce stringhe vuote', () => {
    expect(slugify('')).toBe('');
  });

  it('gestisce slug gia normalizzati senza modificarli', () => {
    expect(slugify('spurgo-fognature')).toBe('spurgo-fognature');
  });
});

describe('slugifyServiceZone', () => {
  it('produce il formato service/zone atteso dal template Astro', () => {
    expect(slugifyServiceZone('Spurgo Fognature', 'Formia')).toBe('spurgo-fognature/formia');
  });

  it('normalizza entrambe le parti indipendentemente', () => {
    expect(slugifyServiceZone('Autospurghi', 'Città di Gaeta')).toBe('autospurghi/citta-di-gaeta');
  });

  it('non lascia trattini nell separatore slash', () => {
    const result = slugifyServiceZone('Pulizia Vasca', 'Latina (LT)');
    const [service, zone] = result.split('/');
    expect(service).toBe('pulizia-vasca');
    expect(zone).toBe('latina-lt');
  });
});

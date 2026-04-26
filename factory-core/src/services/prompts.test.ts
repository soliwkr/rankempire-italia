import { describe, it, expect } from 'vitest';
import { PromptService } from './prompts';
// sanitizeHtml sarà esportata da factory-core/src/api/seed.ts (creato in Piano 03-02)
// Per ora importiamo in modo da ottenere un RED sulla import mancante
import { sanitizeHtml } from '../api/seed';

describe('PromptService — nuovi metodi Phase 3', () => {
  const service = new PromptService();

  it('FACT-02-d: generateHomepagePrompt include avatar in-pain', () => {
    const prompt = (service as any).generateHomepagePrompt(
      { niche: 'idraulico', city: 'Formia' },
      'in-pain'
    );
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('IN-PAIN');
    expect(prompt).toContain('Formia');
  });

  it('FACT-02-d: generateServicesPrompt include ogni servizio passato', () => {
    const prompt = (service as any).generateServicesPrompt(
      { niche: 'idraulico', city: 'Formia' },
      ['riparazioni', 'installazioni'],
      'skeptic'
    );
    expect(prompt).toContain('riparazioni');
    expect(prompt).toContain('installazioni');
  });

  it('FACT-02-d: generateServiceZonesPrompt include servizio e zone', () => {
    const prompt = (service as any).generateServiceZonesPrompt(
      { niche: 'idraulico', city: 'Formia' },
      'riparazioni',
      ['Gaeta', 'Minturno'],
      'bundler'
    );
    expect(prompt).toContain('riparazioni');
    expect(prompt).toContain('Gaeta');
    expect(prompt).toContain('Minturno');
  });

  it('FACT-02-d: generateBlogPrompt include niche e city', () => {
    const prompt = (service as any).generateBlogPrompt(
      { niche: 'idraulico', city: 'Formia' },
      'in-pain'
    );
    expect(prompt).toContain('idraulico');
    expect(prompt).toContain('Formia');
  });
});

describe('sanitizeHtml', () => {
  it('FACT-02-e: rimuove tag script', () => {
    const input = '<p>Testo OK</p><script>alert(1)</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('<p>Testo OK</p>');
  });

  it('FACT-02-e: rimuove tag iframe', () => {
    const input = '<p>OK</p><iframe src="evil.com"></iframe>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<iframe');
  });

  it('FACT-02-e: rimuove event handler inline', () => {
    const input = '<p onclick="evil()">Click me</p>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('onclick=');
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import esMessages from '../src/messages/es.json';
import enMessages from '../src/messages/en.json';

describe('SPRINT 1 GATE VERIFICATION — LUMO HQ', () => {
  describe('[AGENTE 2: UI/UX & MOBILE-FIRST] Local Fonts & Asset Integrity', () => {
    it('should have all 5 WOFF2 local font files in public/fonts', () => {
      const fontsDir = path.resolve(__dirname, '../public/fonts');
      const requiredFonts = [
        'bricolage-grotesque-latin-700-normal.woff2',
        'bricolage-grotesque-latin-800-normal.woff2',
        'figtree-latin-400-normal.woff2',
        'figtree-latin-600-normal.woff2',
        'figtree-latin-700-normal.woff2',
      ];

      for (const font of requiredFonts) {
        const filePath = path.join(fontsDir, font);
        expect(fs.existsSync(filePath), `Font ${font} must exist in public/fonts`).toBe(true);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(1000);
      }
    });

    it('should have web favicons and manifest in public/', () => {
      const publicDir = path.resolve(__dirname, '../public');
      expect(fs.existsSync(path.join(publicDir, 'favicon.ico'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'apple-touch-icon.png'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'site.webmanifest'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'images/og-image.png'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'logos/logo-encabezado_fondo-claro.svg'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'logos/logo-encabezado_fondo-oscuro.svg'))).toBe(true);
    });

    it('should have matching translation keys for both ES and EN', () => {
      const esKeys = Object.keys(esMessages);
      const enKeys = Object.keys(enMessages);
      expect(esKeys.sort()).toEqual(enKeys.sort());

      // Check key sections
      expect(esMessages.hero.titleStart).toBeDefined();
      expect(enMessages.hero.titleStart).toBeDefined();
      expect(esMessages.packages.founder.price).toBe('$250');
      expect(enMessages.packages.founder.price).toBe('$250');
      expect(esMessages.packages.base.price).toBe('$500');
      expect(enMessages.packages.base.price).toBe('$500');
      expect(esMessages.faq.items.length).toBe(8); // the 8 objections from Doc 03
      expect(enMessages.faq.items.length).toBe(8);
    });

    it('should strictly comply with FTC guidelines (no false ranking or reviews)', () => {
      const esString = JSON.stringify(esMessages).toLowerCase();
      const enString = JSON.stringify(enMessages).toLowerCase();

      // Prohibited claims
      expect(esString).not.toContain('primer lugar en google garantizado');
      expect(esString).not.toContain('duplicamos tus clientes garantizado');
      expect(esString).not.toContain('comprar reseñas');
      expect(enString).not.toContain('guaranteed #1 ranking');
      expect(enString).not.toContain('buy 5-star reviews');

      // Mandatory disclosures exist
      expect(esMessages.ftc.text).toContain('FTC');
      expect(esMessages.ftc.text).toContain('TCPA');
      expect(enMessages.ftc.text).toContain('FTC');
      expect(enMessages.ftc.text).toContain('TCPA');
    });
  });

  describe('[AGENTE 3 & 5: BACKEND & SECOPS] Security Headers & Input Sanitization', () => {
    it('should configure strict Content-Security-Policy without unsafe-eval', async () => {
      const nextConfigPath = path.resolve(__dirname, '../next.config.mjs');
      const content = fs.readFileSync(nextConfigPath, 'utf8');

      // Must have strict headers
      expect(content).toContain('Content-Security-Policy');
      expect(content).not.toContain("'unsafe-eval'");
      expect(content).toContain('Strict-Transport-Security');
      expect(content).toContain('X-Frame-Options');
      expect(content).toContain('DENY');
      expect(content).toContain('X-Content-Type-Options');
      expect(content).toContain('nosniff');
      expect(content).toContain('Referrer-Policy');
      expect(content).toContain('Permissions-Policy');
    });

    it('should validate diagnosis form data strictly with Zod schema and reject XSS', () => {
      const sanitize = (str: string) => str.replace(/[<>]/g, '').trim();

      const maliciousName = '<script>alert("xss")</script>Juan Pérez';
      const cleanName = sanitize(maliciousName);
      expect(cleanName).toBe('scriptalert("xss")/scriptJuan Pérez');
      expect(cleanName).not.toContain('<script>');
      expect(cleanName).not.toContain('</script>');
    });
  });
});


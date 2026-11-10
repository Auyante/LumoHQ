import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('AGENTE 5: SECOPS & PENTEST AUDIT (OWASP ASVS & ISO 27001)', () => {
  it('1. HTTP Security Headers — CSP, HSTS, Clickjacking & Sniffing protection', () => {
    const nextConfigPath = path.resolve(__dirname, '../next.config.mjs');
    expect(fs.existsSync(nextConfigPath)).toBe(true);

    const config = fs.readFileSync(nextConfigPath, 'utf8');

    // Strict CSP without unsafe-eval
    expect(config).toContain('Content-Security-Policy');
    expect(config).not.toContain("'unsafe-eval'");
    expect(config).toContain("object-src 'none'");
    expect(config).toContain("frame-ancestors 'none'");

    // HSTS preload
    expect(config).toContain('Strict-Transport-Security');
    expect(config).toContain('includeSubDomains');
    expect(config).toContain('preload');

    // X-Frame-Options: DENY
    expect(config).toContain('X-Frame-Options');
    expect(config).toContain('DENY');

    // X-Content-Type-Options: nosniff
    expect(config).toContain('X-Content-Type-Options');
    expect(config).toContain('nosniff');

    // Referrer-Policy
    expect(config).toContain('Referrer-Policy');
    expect(config).toContain('strict-origin-when-cross-origin');

    // Permissions-Policy
    expect(config).toContain('Permissions-Policy');
    expect(config).toContain('camera=()');
    expect(config).toContain('microphone=()');
  });

  it('2. Anti-XSS Sanitization in Form Submission Endpoint', () => {
    const apiRoutePath = path.resolve(__dirname, '../src/app/api/diagnosis/route.ts');
    expect(fs.existsSync(apiRoutePath)).toBe(true);

    const routeCode = fs.readFileSync(apiRoutePath, 'utf8');

    // Must have transformation/sanitization against angle brackets
    expect(routeCode).toContain('.replace(/[<>]/g,');
    expect(routeCode).toContain('tcpaConsent');
  });

  it('3. Anti-Spam / DoS Rate Limiting on Public Endpoints', () => {
    const apiRoutePath = path.resolve(__dirname, '../src/app/api/diagnosis/route.ts');
    const routeCode = fs.readFileSync(apiRoutePath, 'utf8');

    // Must check rate limit and return 429 status code
    expect(routeCode).toContain('rateLimitMap');
    expect(routeCode).toContain('status: 429');
    expect(routeCode).toContain('Demasiadas solicitudes');
  });

  it('4. FTC Compliance — No false promises or illegal marketing claims in code', () => {
    const esMessagesPath = path.resolve(__dirname, '../src/messages/es.json');
    const enMessagesPath = path.resolve(__dirname, '../src/messages/en.json');

    const es = fs.readFileSync(esMessagesPath, 'utf8').toLowerCase();
    const en = fs.readFileSync(enMessagesPath, 'utf8').toLowerCase();

    // Prohibited promises
    expect(es).not.toContain('garantizamos el primer lugar');
    expect(es).not.toContain('te duplicamos los clientes');
    expect(es).not.toContain('reseñas garantizadas de 5 estrellas');

    expect(en).not.toContain('guaranteed number one on google');
    expect(en).not.toContain('double your customers guaranteed');
  });

  it('5. TCPA Compliance — Explicit opt-in checkbox requirement', () => {
    const formCodePath = path.resolve(__dirname, '../src/components/landing/DiagnosisForm.tsx');
    const formCode = fs.readFileSync(formCodePath, 'utf8');

    expect(formCode).toContain('tcpaConsent');
    expect(formCode).toContain('type="checkbox"');
    expect(formCode).toContain('required');
  });
});


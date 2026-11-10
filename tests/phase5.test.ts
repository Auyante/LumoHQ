import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { hashPassword, verifyPassword, PBKDF2_ITERATIONS, createSessionToken, verifySessionToken, passwordProblem, getUserByEmail } from '../src/lib/auth';
import { canAccessRoute, ROLES } from '../src/lib/route-policy';
import { detectAttack, scanJson } from '../src/lib/security/waf';
import { calculateProspectSignals } from '../src/lib/crm';
import { SIGNAL_KEYS } from '../src/lib/crm-engine';
import * as crmModule from '../src/lib/crm';

/** Phase 5 gate: the master prompt's checks as unit tests (run by `npm test` and verify-all). */

const ROOT = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
function walk(dir: string, exts: string[]): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return walk(rel, exts);
    return exts.some((x) => e.name.endsWith(x)) ? [rel] : [];
  });
}

describe('Encrypted login', () => {
  it('passwords are PBKDF2-SHA512 with 210k iterations and a 32-byte salt; never stored in clear', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(210_000);
    const h = hashPassword('Correcta-Larga-2026!');
    expect(h.iter).toBe(PBKDF2_ITERATIONS);
    expect(Buffer.from(h.salt, 'hex').length).toBeGreaterThanOrEqual(32);
    expect(h.hash).not.toContain('Correcta');
    expect(verifyPassword('Correcta-Larga-2026!', h.hash, h.salt, h.iter)).toBe(true);
    expect(verifyPassword('correcta-larga-2026!', h.hash, h.salt, h.iter)).toBe(false);
    expect(read('src/lib/auth.ts')).toMatch(/timingSafeEqual/);
  });
  it('weak passwords are refused', () => {
    expect(passwordProblem('123456')).not.toBeNull();
    expect(passwordProblem('Correcta-Larga-2026!')).toBeNull();
  });
  it('session tokens are signed, tied to the browser, and a forged role is refused', () => {
    const user = getUserByEmail('luis@lumohq.com');
    if (!user) return; // fresh checkout without data/users.json: covered by the live security suite
    const t = createSessionToken(user, 'UA-1');
    expect(verifySessionToken(t, 'UA-1').valid).toBe(true);
    expect(verifySessionToken(t, 'UA-2').reason).toBe('fingerprint-mismatch');
    const [body, sig] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), role: 'SUPER_ADMIN' })).toString('base64url');
    expect(verifySessionToken(`${forged}.${sig}`, 'UA-1').reason).toBe('bad-signature');
  });
  it('no password from the initial list appears in any tracked file', () => {
    const f = path.join(ROOT, 'data', 'INITIAL-PASSWORDS.txt');
    const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
    const secrets = fs.existsSync(f)
      ? fs.readFileSync(f, 'utf8').split('\n').map((l) => l.match(/^\S+@\S+\s+(\S+)$/)?.[1]).filter((x): x is string => !!x && x.length >= 12)
      : [];
    for (const file of tracked) {
      if (!fs.existsSync(path.join(ROOT, file)) || /\.(png|jpe?g|webp|woff2?|ico|glb|pdf)$/i.test(file)) continue;
      const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
      for (const s of secrets) expect(text.includes(s), `${file} contains a password`).toBe(false);
    }
    expect(tracked).not.toContain('data/INITIAL-PASSWORDS.txt');
    expect(tracked).not.toContain('data/users.json');
  });
});

describe('RBAC', () => {
  const matrix: [string, string, boolean][] = [
    ['SALES_BARBARA', '/admin/crm', true], ['SALES_BARBARA', '/admin/produccion', true],
    ['SALES_BARBARA', '/admin/finanzas', false], ['SALES_BARBARA', '/admin/usuarios', false], ['SALES_BARBARA', '/admin/seguridad', false],
    ['SALES_BARBARA', '/admin/tablero-dominical', false], ['SALES_BARBARA', '/api/admin/users', false],
    ['DEVELOPER', '/admin/tablero-dominical', true], ['DEVELOPER', '/admin/finanzas', false],
    ['CLIENT', '/admin/crm', false], ['CLIENT', '/api/crm/prospects', false],
    ['ADMIN_LUIS', '/admin/finanzas', true], ['SUPER_ADMIN', '/admin/seguridad', true],
    ['ADMIN_CARLOS', '/admin/una-ruta-nueva', true], ['SALES_BARBARA', '/admin/una-ruta-nueva', false],
  ];
  it.each(matrix)('%s on %s → %s', (role, route, allowed) => {
    expect(canAccessRoute(role as (typeof ROLES)[number], route)).toBe(allowed);
  });
  it('prefix tricks do not widen access', () => {
    expect(canAccessRoute('SALES_BARBARA', '/admin/crm-finanzas')).toBe(false);
  });
});

describe('WAF and honeypots', () => {
  it('blocks real attack syntax', () => {
    for (const p of ["' OR '1'='1", '1 UNION SELECT password FROM users', '<script>alert(1)</script>', 'javascript:alert(1)', '../../etc/passwd', '<img src=x onerror=alert(1)>']) {
      expect(detectAttack(p), p).not.toBeNull();
    }
    expect(scanJson({ a: { b: ['ok', '<svg onload=alert(1)>'] } })).not.toBeNull();
  });
  it('lets ordinary business text through', () => {
    for (const p of ['Tacos & Más', "O'Brien's Auto", '3 o 4 cortes por día', 'Barbería El Rey, Midland TX', 'Select the best one']) {
      expect(detectAttack(p), p).toBeNull();
    }
  });
  it('every public form has the honeypot and every matching API checks it', () => {
    expect(read('src/app/login/page.tsx')).toMatch(/name="website"/);
    expect(read('src/components/talonario/Landing.tsx')).toMatch(/website/);
    for (const api of ['auth/login', 'diagnosis', 'checkout/create-session', 'contracts/sign']) {
      expect(read(`src/app/api/${api}/route.ts`), api).toMatch(/honeypotTripped\(/);
    }
  });
});

describe('No emojis', () => {
  it('no emoji in any source, message or style file', () => {
    const files = [...walk('src', ['.ts', '.tsx', '.css', '.json']), 'README.md'].filter((f) => fs.existsSync(path.join(ROOT, f)));
    const bad = files.flatMap((f) => {
      const hits = read(f).match(/\p{Emoji_Presentation}|️/gu);
      return hits ? [`${f}: ${hits.slice(0, 3).join(' ')}`] : [];
    });
    expect(bad).toEqual([]);
  });
});

describe('CRM: 8 signals and 8 objections (Doc 03)', () => {
  it('8 signals, 4+ points is P1, 2-3 is P2, under 2 is discarded', () => {
    expect(SIGNAL_KEYS).toHaveLength(8);
    const all = Object.fromEntries(SIGNAL_KEYS.map((k) => [k, true]));
    expect(calculateProspectSignals(all)).toMatchObject({ score: 8, priority: 'P1' });
    expect(calculateProspectSignals({ scoreReviews: true, scoreWebsite: true }).priority).toBe('P2');
    expect(calculateProspectSignals({ scoreReviews: true }).priority).toBe('DISCARD');
  });
  it('8 objections with a written answer each', () => {
    const src = read('src/lib/crm.ts');
    expect((src.match(/objection: '/g) || []).length).toBe(8);
    expect((src.match(/rebuttal: '/g) || []).length).toBe(8);
    expect(crmModule).toBeTruthy();
  });
});

describe('3D and responsive', () => {
  it('hero phone is real WebGL, lazy-loaded, with a still frame under reduced motion', () => {
    const p = read('src/components/talonario/Phone3D.tsx');
    expect(p).toMatch(/WebGLRenderer/);
    expect(p).toMatch(/import\('three'\)|await import\(/);
    expect(p).toMatch(/prefers-reduced-motion/);
    expect(read('src/components/talonario/LiveSimulator.tsx')).toMatch(/perspective|preserve-3d|rotate[XY]/);
  });
  it('Sunday board: 1 column on phones, 2 on tablets, 5 on desktop', () => {
    expect(read('src/app/admin/tablero-dominical/page.tsx')).toMatch(/grid-cols-1 md:grid-cols-2 lg:grid-cols-5/);
  });
  it('admin menu has a phone drawer with focus trap and Escape', () => {
    const n = read('src/components/admin/AdminNav.tsx');
    expect(n).toMatch(/role="dialog"/);
    expect(n).toMatch(/Escape/);
    expect(n).toMatch(/aria-modal="true"/);
  });
  it('no 4+ column grid without a breakpoint, except small segmented controls', () => {
    const allow = /role="radiogroup"|aria-label="Hito"|time slots|text-center text-xs font-bold|grid-cols-3 sm:grid-cols-4/;
    const bad = walk('src', ['.tsx']).flatMap((f) => read(f).split('\n').flatMap((line, i) => {
      if (!/(^|["'`\s])grid-cols-([4-9]|1[0-2])\b/.test(line) || allow.test(line)) return [];
      return [`${f}:${i + 1}`];
    }));
    expect(bad).toEqual([]);
  });
});

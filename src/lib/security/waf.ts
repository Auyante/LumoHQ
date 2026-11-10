/**
 * Local WAF: payload signatures for SQL injection, XSS, path traversal and command injection.
 *
 * This is a tripwire, not the primary defense. The primary defenses stay in place: Zod schemas,
 * no string-built queries, React output escaping and the CSP. Patterns are written to need real
 * attack syntax so that ordinary business text ("Tacos & Más", "O'Brien's", "3 o 4 cortes") passes.
 */

export type AttackKind = 'SQLI' | 'XSS' | 'PATH_TRAVERSAL' | 'CMD_INJECTION';

const SIGNATURES: { kind: AttackKind; re: RegExp }[] = [
  // SQL injection
  { kind: 'SQLI', re: /\bunion\b[\s\S]{0,40}?\bselect\b/i },
  { kind: 'SQLI', re: /['"`]\s*\)?\s*(or|and)\s+['"`]?\w+['"`]?\s*(=|like)\s*['"`]?\w+/i },
  { kind: 'SQLI', re: /\b(or|and)\s+1\s*=\s*1\b/i },
  { kind: 'SQLI', re: /;\s*(drop|truncate|alter|delete\s+from|insert\s+into|update\s+\w+\s+set)\b/i },
  { kind: 'SQLI', re: /\b(sleep|pg_sleep|benchmark)\s*\(\s*\d+/i },
  { kind: 'SQLI', re: /\bwaitfor\s+delay\b/i },
  { kind: 'SQLI', re: /\binformation_schema\b|\bxp_cmdshell\b/i },
  // XSS
  { kind: 'XSS', re: /<\s*\/?\s*script\b/i },
  { kind: 'XSS', re: /javascript\s*:/i },
  { kind: 'XSS', re: /\bon(error|load|mouseover|focus|click|toggle|animationstart)\s*=/i },
  { kind: 'XSS', re: /<\s*(iframe|object|embed|svg|math|base)\b/i },
  { kind: 'XSS', re: /data\s*:\s*text\/html/i },
  // Path traversal
  { kind: 'PATH_TRAVERSAL', re: /\.\.[\/\\]/ },
  { kind: 'PATH_TRAVERSAL', re: /\/etc\/(passwd|shadow|hosts)\b/i },
  { kind: 'PATH_TRAVERSAL', re: /\b(win\.ini|boot\.ini)\b/i },
  // Command injection: a shell separator followed by a command and an argument
  { kind: 'CMD_INJECTION', re: /(^|[;&|`]|\$\()\s*(cat|ls|rm|wget|curl|bash|sh|nc|ncat|python3?|perl|chmod|whoami|id)\s+[-\/.~$'"]/i },
  { kind: 'CMD_INJECTION', re: /\$\(\s*(cat|ls|rm|wget|curl|bash|sh|whoami|id)\b/i },
];

export function detectAttack(input: string): AttackKind | null {
  if (!input) return null;
  for (const { kind, re } of SIGNATURES) if (re.test(input)) return kind;
  return null;
}

/** Decode up to twice so %252e%252e%252f and friends are seen in clear. */
export function safeDecode(input: string): string {
  let out = input;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(out.replace(/\+/g, ' '));
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

/** Fields never scanned: passwords never reach a query, and signatures are base64 images. */
const SKIP_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'signatureDataUrl']);

/** Walk a parsed JSON body and test every string leaf. */
export function scanJson(value: unknown, depth = 0): AttackKind | null {
  if (depth > 8 || value == null) return null;
  if (typeof value === 'string') return detectAttack(value);
  if (Array.isArray(value)) {
    for (const v of value) { const hit = scanJson(v, depth + 1); if (hit) return hit; }
    return null;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SKIP_KEYS.has(k)) continue;
      const hit = detectAttack(k) || scanJson(v, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

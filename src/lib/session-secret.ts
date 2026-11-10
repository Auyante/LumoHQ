/**
 * Session signing secret. Edge-safe (no Node imports) so middleware and auth share it.
 * Production requires SESSION_SECRET; there is no public fallback.
 */
const DEV_ONLY_SECRET = 'dev-only-insecure-secret-do-not-deploy';

export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== 'production') return DEV_ONLY_SECRET;
  return null;
}

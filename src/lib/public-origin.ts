import type { NextRequest } from 'next/server';

/**
 * Origin to put in links we hand to clients (diagnosis, portal). `req.nextUrl.origin` is the
 * address the server bound to (e.g. http://0.0.0.0:3000 in dev), which a phone cannot open.
 * Use the Host the browser actually called. Only used on staff-only routes.
 */
export function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return req.nextUrl.origin;
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}

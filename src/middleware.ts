import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, canAccessRoute } from '@/lib/auth';
import { getClientIp } from '@/lib/security/client-ip';
import { detectAttack, safeDecode, scanJson } from '@/lib/security/waf';
import { audit, blockIp, isBlocked, recordFailure } from '@/lib/security/store';

/**
 * Perimeter, runs before every request (Node.js runtime so it can read the user store and the blocklist):
 *  1. Blocked IPs get 403.
 *  2. Local WAF: the URL, and JSON bodies sent to /api, are checked for SQLi, XSS, traversal and
 *     command-injection payloads. A hit blocks the IP and answers 403 with no detail.
 *  3. Burst limiter on /api: 120 requests a minute per IP, then a block.
 *  4. /admin/* and staff APIs need a valid session (signature, expiry, user-agent fingerprint,
 *     active account, current session version) and a role allowed for that path.
 *  5. Security headers on every response.
 * Route handlers check the session again on their own: the middleware is not the only wall.
 */

const VIOLATION = 'Forbidden - Security Violation Logged';
const forbidden = () => new NextResponse(VIOLATION, { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });

/** APIs anyone may call (each one validates and rate-limits on its own). */
const PUBLIC_API = ['/api/auth/login', '/api/auth/logout', '/api/diagnosis', '/api/checkout/create-session', '/api/contracts/sign', '/api/webhooks/stripe', '/api/reviews/generate', '/api/client'];
const isPublicApi = (p: string) => PUBLIC_API.some((x) => p === x || p.startsWith(x + '/'));
/** The Stripe signature covers the exact raw body; it is never parsed or rewritten here. */
const SKIP_BODY_SCAN = ['/api/webhooks/stripe'];
const MAX_SCAN_BYTES = 256 * 1024;

function deny(request: NextRequest, status: 401 | 403, isApi: boolean, why: 'login' | 'role') {
  if (isApi) return NextResponse.json({ error: status === 401 ? 'No autenticado.' : 'No tienes permiso para esta sección.' }, { status });
  if (why === 'login') {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return new NextResponse(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>403</title>' +
    '<body style="font:16px/1.5 system-ui;background:#1B2130;color:#FFF7EC;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">' +
    '<main style="max-width:420px"><h1 style="margin:0 0 8px">403 · Sin acceso</h1><p>Tu usuario no tiene permiso para esta sección.</p>' +
    '<p><a style="color:#FFD27A" href="/admin/crm">Volver al CRM</a></p></main></body>',
    { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request.headers);
  const isApi = pathname.startsWith('/api/');

  // 1. blocked IPs
  if (isBlocked(ip)) return forbidden();

  // 2a. WAF on path and query string
  const urlHit = detectAttack(safeDecode(pathname + request.nextUrl.search));
  if (urlHit) {
    audit('WAF_BLOCK', 'CRITICAL', ip, `${urlHit} in URL ${request.method} ${pathname}`);
    blockIp(ip, `WAF ${urlHit}`);
    return forbidden();
  }

  // 2b. WAF on JSON bodies
  if (isApi && ['POST', 'PUT', 'PATCH'].includes(request.method) && !SKIP_BODY_SCAN.includes(pathname)) {
    const type = request.headers.get('content-type') || '';
    const len = Number(request.headers.get('content-length') || 0);
    if (type.includes('application/json') && len <= MAX_SCAN_BYTES) {
      try {
        const text = await request.clone().text();
        if (text.length <= MAX_SCAN_BYTES) {
          const hit = scanJson(JSON.parse(text));
          if (hit) {
            audit('WAF_BLOCK', 'CRITICAL', ip, `${hit} in body ${request.method} ${pathname}`);
            blockIp(ip, `WAF ${hit}`);
            return forbidden();
          }
        }
      } catch { /* invalid JSON: the route answers 400 */ }
    }
  }

  // 3. burst limiter on APIs
  if (isApi && recordFailure(`burst:${ip}`, 60_000) > 120) {
    audit('IP_BLOCKED', 'WARN', ip, `API burst over 120/min on ${pathname}`);
    blockIp(ip, 'API burst');
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

  // 4. authentication and role check for the admin area and staff APIs
  const needsSession = pathname.startsWith('/admin') || (isApi && !isPublicApi(pathname));
  if (needsSession) {
    const token = request.cookies.get('lumo_session')?.value;
    if (!token) return deny(request, 401, isApi, 'login');
    const v = verifySessionToken(token, request.headers.get('user-agent'));
    if (!v.valid || !v.payload) {
      audit('SESSION_INVALID', 'WARN', ip, `${pathname} · ${v.reason}`);
      const res = deny(request, 401, isApi, 'login');
      res.cookies.delete('lumo_session');
      return res;
    }
    if (!canAccessRoute(v.payload.role, pathname)) {
      audit('ACCESS_DENIED', 'WARN', ip, `${request.method} ${pathname} as ${v.payload.role}`, v.payload.email);
      return deny(request, 403, isApi, 'role');
    }
  }

  const response = NextResponse.next();
  const host = request.headers.get('host') || '';

  // Detect local environment (localhost, 127.0.0.1, or local LAN IP like 192.168.*)
  const isLocalHost =
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.');

  const isProduction = process.env.NODE_ENV === 'production' && !isLocalHost;

  // 1. Perimetral Security Headers (OWASP ASVS Level 2)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com")'
  );

  if (isProduction) {
    // Strict-Transport-Security ONLY on real production domains with SSL (prevents ERR_SSL_PROTOCOL_ERROR on local HTTP)
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // Strict Production Content-Security-Policy (without unsafe-eval)
    const prodCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    response.headers.set('Content-Security-Policy', prodCsp);
  } else {
    // Development Content-Security-Policy: allows 'unsafe-eval' and 'unsafe-inline' for Next.js Webpack/Turbopack HMR & styles,
    // and omits upgrade-insecure-requests and HSTS to prevent ERR_SSL_PROTOCOL_ERROR on local HTTP connections
    const devCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com ws: wss:",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://maps.google.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', devCsp);
  }

  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'lumo-hq-texas-super-secret-key-2026-production-hmac-secure';

async function verifyEdgeSession(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const match = signature.match(/.{1,2}/g);
    if (!match) return null;
    const sigBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payloadB64));
    if (!ok) return null;

    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /admin routes with authentication and RBAC
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('lumo_session')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifyEdgeSession(token);
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'session_expired');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('lumo_session');
      return response;
    }

    // Role-based access control (RBAC):
    // Bárbara (SALES_BARBARA) cannot access financial management
    if (session.role === 'SALES_BARBARA' && pathname.startsWith('/admin/finanzas')) {
      const crmUrl = new URL('/admin/crm', request.url);
      crmUrl.searchParams.set('error', 'sin_acceso_finanzas');
      return NextResponse.redirect(crmUrl);
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
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
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
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
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

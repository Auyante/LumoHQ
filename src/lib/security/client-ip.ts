/**
 * Client IP for rate limits, lockouts and the audit log.
 *
 * X-Forwarded-For is client-controlled unless a proxy overwrites it. On Vercel, `x-real-ip` and the
 * first XFF entry are set by the platform. Behind another proxy set TRUSTED_PROXY_HOPS to the number of
 * proxies you control, and the IP is taken that many entries from the right, where a client cannot forge it.
 */
export function getClientIp(headers: Headers): string {
  const hops = Number(process.env.TRUSTED_PROXY_HOPS || 0);
  const xff = (headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (hops > 0 && xff.length >= hops) return sanitize(xff[xff.length - hops]);
  const real = headers.get('x-real-ip');
  if (real) return sanitize(real);
  if (xff.length) return sanitize(xff[0]);
  return '127.0.0.1';
}

function sanitize(ip: string): string {
  // keep IPv4/IPv6 characters only, so the value is safe to store and display
  return ip.replace(/[^0-9a-fA-F:.]/g, '').slice(0, 45) || 'unknown';
}

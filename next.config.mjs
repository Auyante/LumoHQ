/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

// Production Security Headers (OWASP ASVS Level 2, HSTS with preload, Strict CSP)
const productionHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
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
      "upgrade-insecure-requests"
    ].join('; ')
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com")'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  }
];

// Development Headers: Excludes Strict-Transport-Security and upgrade-insecure-requests
// to prevent ERR_SSL_PROTOCOL_ERROR over local HTTP connections (localhost / 192.168.*)
const developmentHeaders = productionHeaders
  .filter((h) => h.key !== 'Strict-Transport-Security')
  .map((h) => {
    if (h.key === 'Content-Security-Policy') {
      return {
        key: 'Content-Security-Policy',
        value: h.value.replace('; upgrade-insecure-requests', '')
      };
    }
    return h;
  });

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ['192.168.1.108', 'localhost', '127.0.0.1'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: isProduction ? productionHeaders : developmentHeaders
      }
    ];
  }
};

export default nextConfig;

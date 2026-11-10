import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { StickyMobileCta } from '@/components/layout/StickyMobileCta';
import { TopProgressBar } from '@/components/layout/TopProgressBar';

export const metadata: Metadata = {
  title: 'Lumo HQ — Negocios Locales, Visibles | Midland-Odessa, Texas',
  description:
    'Que te encuentren en Google y te puedan llamar, escribir o reservar en un clic. Perfil de Google optimizado, web bilingüe ultra-rápida y contacto directo para negocios latinos en Midland-Odessa, TX.',
  metadataBase: new URL('https://lumohq.com'),
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon_16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon_32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon_48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Lumo HQ — Negocios Locales, Visibles',
    description:
      'Que te encuentren en Google y te puedan llamar, escribir o reservar en un clic. Plataforma web y Google Maps para negocios locales en Midland-Odessa, TX.',
    url: 'https://lumohq.com',
    siteName: 'Lumo HQ',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lumo HQ — Negocios Locales, Visibles',
      },
    ],
    locale: 'es_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumo HQ — Negocios Locales, Visibles',
    description:
      'Que te encuentren en Google y te puedan llamar, escribir o reservar en un clic.',
    images: ['/images/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#1B2130',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen bg-white text-lumo-noche antialiased selection:bg-lumo-ambar/30 selection:text-lumo-noche">
        <I18nProvider>
          <TopProgressBar />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="grow pb-24 md:pb-0">{children}</main>
            <Footer />
            <StickyMobileCta />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}


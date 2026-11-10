'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { MapPin, Mail, Phone, Shield, Scissors, Utensils, QrCode } from 'lucide-react';

export function Footer() {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();

  // The landing draws its own footer.
  if (pathname === '/') return null;

  return (
    <footer className="bg-lumo-noche text-white pt-16 pb-28 md:pb-16 border-t border-lumo-pizarra/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-lumo-pizarra/30">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/logos/logo-encabezado_fondo-oscuro.svg"
                alt="Lumo HQ"
                width={160}
                height={44}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-300 max-w-sm leading-relaxed">
              Plataforma digital integral para negocios locales latinos en Midland-Odessa, Texas. Presencia en Google Maps, páginas bilingües ultra-rápidas, contacto directo y reputación verificada.
            </p>
            <div className="pt-2 text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-lumo-ambar" />
                <span>Midland-Odessa, Texas · Condado de Midland</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-lumo-ambar" />
                <span>DBA registrado ante el Midland County Clerk</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-lumo-brillo">
              Demos & Herramientas
            </h5>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/demo/barberia" className="hover:text-lumo-ambar transition-colors flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                  <span>Barbería con Citas</span>
                </Link>
              </li>
              <li>
                <Link href="/demo/taqueria" className="hover:text-lumo-ambar transition-colors flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                  <span>Taquería con Menú</span>
                </Link>
              </li>
              <li>
                <Link href="/herramientas/resenas" className="hover:text-lumo-ambar transition-colors flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Kit QR de Reseñas</span>
                </Link>
              </li>
              <li>
                <Link href="#paquetes" className="hover:text-lumo-ambar transition-colors">
                  {t.nav.packages}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Language & Legal */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-lumo-brillo">
              Idioma / Language
            </h5>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocale('es')}
                className={`min-h-touch px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  locale === 'es'
                    ? 'bg-lumo-ambar text-lumo-noche shadow-sm'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`min-h-touch px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  locale === 'en'
                    ? 'bg-lumo-ambar text-lumo-noche shadow-sm'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Legal Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {t.footer.rights}</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-300 cursor-pointer">
              {t.footer.links.terms}
            </span>
            <span className="hover:text-gray-300 cursor-pointer">
              {t.footer.links.privacy}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Menu, X, Globe, PhoneCall, Scissors, Utensils, QrCode } from 'lucide-react';

export function Navbar() {
  const { locale, setLocale, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleLanguage = () => {
    setLocale(locale === 'es' ? 'en' : 'es');
  };

  // The landing draws its own desk header.
  // Admin and demo pages draw their own bars; the demos are a client's site, not Lumo's.
  if (pathname === '/' || ['/diagnostico', '/admin', '/demo'].some((p) => pathname.startsWith(p))) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-lumo-niebla shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar rounded-lg p-1">
            <Image
              src="/logos/logo-encabezado_fondo-claro.svg"
              alt="Lumo HQ — Negocios Locales, Visibles"
              width={160}
              height={44}
              priority
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-lumo-pizarra">
            <div className="relative group py-2">
              <Link
                href="#demos"
                className="hover:text-lumo-noche transition-colors flex items-center gap-1 focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar rounded-md"
              >
                <span>{t.nav.demos}</span>
              </Link>
              <div className="absolute top-full left-0 hidden group-hover:block w-48 p-2 bg-white rounded-2xl shadow-xl border border-lumo-niebla space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <Link
                  href="/demo/barberia"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-lumo-noche hover:bg-lumo-arena transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                  <span>Barbería El Rey</span>
                </Link>
                <Link
                  href="/demo/taqueria"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-lumo-noche hover:bg-lumo-arena transition-colors"
                >
                  <Utensils className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                  <span>Taquería Los Compadres</span>
                </Link>
                <Link
                  href="/herramientas/resenas"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors border-t border-lumo-niebla/60 mt-1 pt-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Kit QR de Reseñas</span>
                </Link>
              </div>
            </div>
            <Link
              href="#paquetes"
              className="hover:text-lumo-noche transition-colors py-2 focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar rounded-md"
            >
              {t.nav.packages}
            </Link>
            <Link
              href="#diagnostico"
              className="hover:text-lumo-noche transition-colors py-2 focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar rounded-md"
            >
              {t.nav.diagnosis}
            </Link>
            <Link
              href="#faq"
              className="hover:text-lumo-noche transition-colors py-2 focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar rounded-md"
            >
              {t.nav.faq}
            </Link>
          </nav>

          {/* Right actions: Lang Switcher & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="min-h-touch min-w-touch flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-lumo-niebla bg-lumo-arena/60 hover:bg-lumo-arena text-lumo-noche text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar"
            >
              <Globe className="w-4 h-4 text-lumo-ambar" />
              <span>{locale === 'es' ? 'EN' : 'ES'}</span>
            </button>

            <Link
              href="#diagnostico"
              className="min-h-touch flex items-center justify-center px-5 py-2.5 rounded-full bg-lumo-ambar hover:bg-[#e09129] active:bg-[#c97e1e] text-lumo-noche font-bold text-sm shadow-sm hover:shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-lumo-ambar"
            >
              {t.nav.requestDiagnosis}
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="min-h-touch min-w-touch flex items-center justify-center px-2.5 py-1.5 rounded-full border border-lumo-niebla bg-lumo-arena/80 text-lumo-noche text-xs font-bold"
            >
              <Globe className="w-3.5 h-3.5 text-lumo-ambar mr-1" />
              {locale.toUpperCase()}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
              className="min-h-touch min-w-touch p-2 rounded-lg text-lumo-noche hover:bg-lumo-niebla/50 focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-lumo-niebla bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="border-b border-lumo-niebla/50 pb-2">
            <span className="text-[10px] font-bold text-lumo-pizarra uppercase block mb-1">Demos en Vivo:</span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/demo/barberia"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-lumo-arena/60 text-xs font-bold text-lumo-noche"
              >
                <Scissors className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                <span>Barbería El Rey</span>
              </Link>
              <Link
                href="/demo/taqueria"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-lumo-arena/60 text-xs font-bold text-lumo-noche"
              >
                <Utensils className="w-3.5 h-3.5 text-lumo-ambar shrink-0" />
                <span>Taquería Compadres</span>
              </Link>
            </div>
            <Link
              href="/herramientas/resenas"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-800 text-center"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Generador Kit QR Reseñas</span>
            </Link>
          </div>
          <Link
            href="#paquetes"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-touch flex items-center text-base font-semibold text-lumo-noche border-b border-lumo-niebla/50 py-2"
          >
            {t.nav.packages}
          </Link>
          <Link
            href="#diagnostico"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-touch flex items-center text-base font-semibold text-lumo-noche border-b border-lumo-niebla/50 py-2"
          >
            {t.nav.diagnosis}
          </Link>
          <Link
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-touch flex items-center text-base font-semibold text-lumo-noche border-b border-lumo-niebla/50 py-2"
          >
            {t.nav.faq}
          </Link>
          <div className="pt-2">
            <Link
              href="#diagnostico"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-touch w-full flex items-center justify-center py-3 px-4 rounded-xl bg-lumo-ambar active:bg-[#c97e1e] text-lumo-noche font-bold text-center shadow-md"
            >
              {t.nav.requestDiagnosis}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}


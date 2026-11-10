'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Phone, FileText } from 'lucide-react';

export function StickyMobileCta() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past hero
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Strict isolation: ONLY render on the root landing page ('/')
  if (pathname !== '/' || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-lumo-niebla p-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <a
          href="tel:4325550199"
          className="min-h-touch flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lumo-noche active:bg-black text-white font-bold text-xs tracking-wide shadow-md transition-transform active:scale-95"
        >
          <Phone className="w-4 h-4 text-lumo-brillo" />
          <span>{t.stickyCta.call}</span>
        </a>

        <Link
          href="#diagnostico"
          className="min-h-touch flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lumo-ambar active:bg-[#c97e1e] text-lumo-noche font-bold text-xs tracking-wide shadow-md transition-transform active:scale-95"
        >
          <FileText className="w-4 h-4 text-lumo-noche" />
          <span>{t.stickyCta.diagnosis}</span>
        </Link>
      </div>
    </div>
  );
}


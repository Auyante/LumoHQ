'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { ShieldCheck, Scale } from 'lucide-react';

export function FtcDisclaimer() {
  const { t } = useI18n();

  return (
    <div className="py-10 bg-slate-50 border-b border-lumo-niebla">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-lumo-noche text-white flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-lumo-brillo" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-lumo-noche uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
              {t.ftc.title}
            </h4>
            <p className="text-xs text-lumo-pizarra leading-relaxed">
              {t.ftc.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


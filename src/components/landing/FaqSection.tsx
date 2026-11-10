'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FaqSection() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-white border-b border-lumo-niebla">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-arena border border-lumo-niebla text-lumo-noche text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-4 h-4 text-lumo-ambar" />
            {t.faq.badge}
          </div>
          <h2 className="text-fluid-h2 text-lumo-noche mb-4">
            {t.faq.title}
          </h2>
          <p className="text-base sm:text-lg text-lumo-pizarra">
            {t.faq.subtitle}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {t.faq.items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-lumo-ambar bg-lumo-arena/30 shadow-sm'
                    : 'border-lumo-niebla bg-white hover:border-lumo-pizarra/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="min-h-touch w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-lumo-ambar rounded-2xl"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-base sm:text-lg text-lumo-noche pr-4">
                    {item.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-lumo-ambar text-lumo-noche rotate-180'
                        : 'bg-lumo-niebla/80 text-lumo-pizarra'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm sm:text-base text-lumo-pizarra leading-relaxed border-t border-lumo-niebla/60 pt-4 animate-in fade-in duration-200">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


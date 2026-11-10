'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { DiagnosisFormData } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle, Clock, ShieldCheck, Sparkles, MessageCircle, MessageSquare, Phone } from 'lucide-react';

export function DiagnosisForm() {
  const { t } = useI18n();

  const [formData, setFormData] = useState<DiagnosisFormData>({
    ownerName: '',
    businessName: '',
    phone: '',
    preferredChannel: 'whatsapp',
    sourceOfCustomers: '',
    currentContactMethod: '',
    tcpaConsent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.tcpaConsent) {
      setErrorMessage(t.diagnosis.fields.tcpaConsent);
      return;
    }

    if (!formData.sourceOfCustomers || !formData.currentContactMethod) {
      setErrorMessage('Por favor responde las dos preguntas sobre tu negocio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="diagnostico" className="py-16 md:py-24 bg-lumo-arena/50 border-b border-lumo-niebla">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lumo-ambar/20 text-lumo-noche text-xs font-bold uppercase tracking-wider mb-3">
            <Clock className="w-4 h-4 text-lumo-ambar" />
            {t.diagnosis.badge}
          </div>
          <h2 className="text-fluid-h2 text-lumo-noche mb-4">
            {t.diagnosis.title}
          </h2>
          <p className="text-base sm:text-lg text-lumo-pizarra max-w-2xl mx-auto">
            {t.diagnosis.subtitle}
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-3xl bg-white border border-lumo-niebla p-6 sm:p-8 md:p-10 shadow-xl">
          {success ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-lumo-noche font-heading">
                {t.diagnosis.fields.successTitle}
              </h3>
              <p className="text-base text-lumo-pizarra max-w-md mx-auto leading-relaxed">
                {t.diagnosis.fields.successDesc}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      ownerName: '',
                      businessName: '',
                      phone: '',
                      preferredChannel: 'whatsapp',
                      sourceOfCustomers: '',
                      currentContactMethod: '',
                      tcpaConsent: false,
                    });
                  }}
                  className="min-h-touch px-6 py-2.5 rounded-full bg-lumo-arena text-lumo-noche text-sm font-bold hover:bg-lumo-niebla transition-colors"
                >
                  Enviar otra consulta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Personal & Business Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ownerName" className="block text-xs sm:text-sm font-bold text-lumo-noche mb-1.5">
                    {t.diagnosis.fields.ownerName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="Ej. Carlos Mendoza"
                    className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-2 focus:ring-lumo-ambar/30 text-lumo-noche text-base sm:text-sm outline-hidden transition-all bg-lumo-arena/30"
                  />
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-xs sm:text-sm font-bold text-lumo-noche mb-1.5">
                    {t.diagnosis.fields.businessName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Ej. Barbería El Rey Midland"
                    className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-2 focus:ring-lumo-ambar/30 text-lumo-noche text-base sm:text-sm outline-hidden transition-all bg-lumo-arena/30"
                  />
                </div>
              </div>

              {/* Phone & Channel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-lumo-noche mb-1.5">
                    {t.diagnosis.fields.phone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(432) 555-0199"
                    className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-2 focus:ring-lumo-ambar/30 text-lumo-noche text-base sm:text-sm outline-hidden transition-all bg-lumo-arena/30"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-lumo-noche mb-1.5">
                    {t.diagnosis.fields.preferredChannel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredChannel: 'whatsapp' })}
                      className={`min-h-touch px-4 py-3 rounded-xl text-sm font-medium border transition-all text-center flex items-center justify-center gap-2 ${
                        formData.preferredChannel === 'whatsapp'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                          : 'bg-white border-lumo-niebla text-lumo-pizarra hover:bg-lumo-arena'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>{t.diagnosis.fields.channelWhatsapp}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredChannel: 'sms' })}
                      className={`min-h-touch px-4 py-3 rounded-xl text-sm font-medium border transition-all text-center flex items-center justify-center gap-2 ${
                        formData.preferredChannel === 'sms'
                          ? 'bg-lumo-noche text-white border-lumo-noche shadow-xs font-bold'
                          : 'bg-white border-lumo-niebla text-lumo-pizarra hover:bg-lumo-arena'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>{t.diagnosis.fields.channelSms}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredChannel: 'call' })}
                      className={`min-h-touch px-4 py-3 rounded-xl text-sm font-medium border transition-all text-center flex items-center justify-center gap-2 ${
                        formData.preferredChannel === 'call'
                          ? 'bg-lumo-ambar text-lumo-noche border-lumo-ambar shadow-xs font-bold'
                          : 'bg-white border-lumo-niebla text-lumo-pizarra hover:bg-lumo-arena'
                      }`}
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{t.diagnosis.fields.channelCall}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Two Mandatory Discovery Questions (From Document 03) */}
              <div className="pt-2 border-t border-lumo-niebla space-y-4">
                <div>
                  <label htmlFor="qSource" className="block text-xs sm:text-sm font-bold text-lumo-noche mb-1.5">
                    1. {t.diagnosis.fields.qSource} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="qSource"
                    required
                    value={formData.sourceOfCustomers}
                    onChange={(e) => setFormData({ ...formData, sourceOfCustomers: e.target.value })}
                    className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-2 focus:ring-lumo-ambar/30 text-lumo-noche text-base sm:text-sm outline-hidden transition-all bg-lumo-arena/30"
                  >
                    <option value="">-- Selecciona una opción --</option>
                    {t.diagnosis.fields.qSourceOptions.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="qContact" className="block text-xs sm:text-sm font-bold text-lumo-noche mb-1.5">
                    2. {t.diagnosis.fields.qContact} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="qContact"
                    required
                    value={formData.currentContactMethod}
                    onChange={(e) => setFormData({ ...formData, currentContactMethod: e.target.value })}
                    className="min-h-touch w-full px-4 py-3 rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-2 focus:ring-lumo-ambar/30 text-lumo-noche text-base sm:text-sm outline-hidden transition-all bg-lumo-arena/30"
                  >
                    <option value="">-- Selecciona una opción --</option>
                    {t.diagnosis.fields.qContactOptions.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TCPA Mandatory Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    required
                    checked={formData.tcpaConsent}
                    onChange={(e) => setFormData({ ...formData, tcpaConsent: e.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-lumo-pizarra text-lumo-ambar focus:ring-lumo-ambar"
                  />
                  <span className="text-xs text-lumo-pizarra leading-relaxed group-hover:text-lumo-noche transition-colors">
                    {t.diagnosis.fields.tcpaConsent}
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-touch w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-lumo-ambar hover:bg-[#e09129] active:bg-[#c97e1e] text-lumo-noche font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{t.diagnosis.fields.sending}</span>
                  ) : (
                    <>
                      <span>{t.diagnosis.fields.submit}</span>
                      <Send className="w-4 h-4 text-lumo-noche" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-lumo-pizarra">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tus datos son 100% privados y nunca se comparten con terceros.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}


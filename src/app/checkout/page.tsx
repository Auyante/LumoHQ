'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileText,
  CreditCard,
  Building2,
  Sparkles,
  AlertTriangle,
  Calendar,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { SignaturePad } from '@/components/checkout/SignaturePad';
import { PRICING_CONSTANTS, getPackageAmounts } from '@/lib/stripe';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Wizard state: 1 = Paquete, 2 = Datos, 3 = Contrato y Firma, 4 = Pago Anticipo
  const [step, setStep] = useState<number>(1);

  // Form State
  const [packageType, setPackageType] = useState<'FOUNDER' | 'BASE' | 'PREMIUM'>('FOUNDER');
  const [extraChannel, setExtraChannel] = useState<'BOOKING' | 'IG_FB' | 'WHATSAPP'>('BOOKING');

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Midland');
  const [state, setState] = useState('TX');
  const [zipCode, setZipCode] = useState('79701');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Legal consents
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agree5050, setAgree5050] = useState(false);
  const [agreeDay1Pause, setAgreeDay1Pause] = useState(false);
  const [agreeZeroPasswords, setAgreeZeroPasswords] = useState(false);
  const [agreeCopyright, setAgreeCopyright] = useState(false);
  const [agreeFtcTcpa, setAgreeFtcTcpa] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Async states
  const [isSigning, setIsSigning] = useState(false);
  const [signedContractId, setSignedContractId] = useState<string | null>(null);
  const [contractSha256, setContractSha256] = useState<string | null>(null);
  const [contractHtml, setContractHtml] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Founder slots
  const [founderSlotsRemaining, setFounderSlotsRemaining] = useState<number>(2);

  // Read URL query params on mount
  useEffect(() => {
    const pkg = searchParams.get('package')?.toUpperCase();
    if (pkg === 'FOUNDER' || pkg === 'BASE' || pkg === 'PREMIUM') {
      setPackageType(pkg as any);
    }
    const ch = searchParams.get('channel')?.toUpperCase();
    if (ch === 'BOOKING' || ch === 'IG_FB' || ch === 'WHATSAPP') {
      setExtraChannel(ch as any);
    }
    const biz = searchParams.get('businessName') || searchParams.get('biz');
    if (biz) setBusinessName(biz);
    const owner = searchParams.get('ownerName') || searchParams.get('owner');
    if (owner) setOwnerName(owner);
    const ph = searchParams.get('phone');
    if (ph) setPhone(ph);
    const em = searchParams.get('email');
    if (em) setEmail(em);
  }, [searchParams]);

  const pricing = getPackageAmounts(packageType);

  // Handle Step 2 -> 3 Transition
  const handleProceedToContract = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!businessName || !ownerName || !address || !phone || !email || !zipCode) {
      setErrorMessage('Por favor completa todos los campos del negocio requeridos.');
      return;
    }
    setStep(3);
  };

  // Handle Step 3: Sign Contract
  const handleSignContract = async () => {
    setErrorMessage(null);
    if (!signatureDataUrl) {
      setErrorMessage('Por favor dibuja tu firma en el recuadro antes de continuar.');
      return;
    }
    if (
      !agreeTerms ||
      !agree5050 ||
      !agreeDay1Pause ||
      !agreeZeroPasswords ||
      !agreeCopyright ||
      !agreeFtcTcpa
    ) {
      setErrorMessage('Debes marcar todas las casillas de verificación legal obligatorias.');
      return;
    }

    setIsSigning(true);
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          ownerName,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
          packageType,
          extraChannel,
          signatureDataUrl,
          agreeTerms: true,
          agree5050: true,
          agreeDay1Pause: true,
          agreeZeroPasswords: true,
          agreeCopyright: true,
          agreeFtcTcpa: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la firma del contrato');
      }

      setSignedContractId(data.contractId);
      setContractSha256(data.documentHashSha256);
      setContractHtml(data.contractHtml);
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSigning(false);
    }
  };

  // Handle Step 4: Create Stripe Session
  const handlePayDeposit = async () => {
    if (!signedContractId || !contractSha256) {
      setErrorMessage('Falta el contrato firmado previamente.');
      return;
    }

    setIsCheckingOut(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: signedContractId,
          contractSha256,
          packageType,
          extraChannel,
          clientEmail: email,
          businessName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar la pasarela de pago');
      }

      // Redirect to Stripe checkout (or mock success URL)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el pago con Stripe.');
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-lumo-noche py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="font-heading font-extrabold text-2xl tracking-tight text-lumo-noche">
              LUMO<span className="text-lumo-ambar">HQ</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-lumo-noche">
            Contratación y Activación Oficial
          </h1>
          <p className="text-sm text-lumo-pizarra mt-1">
            Luis Barbera (DBA Lumo HQ, Midland, TX) · Garantía de entrega en 5 días hábiles
          </p>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-lumo-niebla p-4 mb-6">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            <div
              className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                step >= 1 ? 'bg-amber-50 text-lumo-noche border border-lumo-ambar' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step >= 1 ? 'bg-lumo-ambar text-lumo-noche' : 'bg-slate-200 text-slate-500'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline">Paquete</span>
            </div>

            <div
              className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                step >= 2 ? 'bg-amber-50 text-lumo-noche border border-lumo-ambar' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step >= 2 ? 'bg-lumo-ambar text-lumo-noche' : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline">Tu Negocio</span>
            </div>

            <div
              className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                step >= 3 ? 'bg-amber-50 text-lumo-noche border border-lumo-ambar' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step >= 3 ? 'bg-lumo-ambar text-lumo-noche' : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline">Contrato & Firma</span>
            </div>

            <div
              className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                step >= 4 ? 'bg-amber-50 text-lumo-noche border border-lumo-ambar' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step >= 4 ? 'bg-lumo-ambar text-lumo-noche' : 'bg-slate-200 text-slate-500'
                }`}
              >
                4
              </div>
              <span className="hidden sm:inline">Anticipo 50%</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold">Atención:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: SELECT PACKAGE & CHANNEL */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lumo-ambar" />
                Paso 1: Selecciona tu Paquete de Presencia Digital
              </h2>
              <p className="text-sm text-lumo-pizarra mt-1">
                Transparencia total: 50% de anticipo al firmar y 50% restante solo cuando apruebes la web.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Founder Package */}
              <div
                onClick={() => setPackageType('FOUNDER')}
                className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                  packageType === 'FOUNDER'
                    ? 'border-lumo-ambar bg-amber-50/50 shadow-md ring-2 ring-lumo-ambar/30'
                    : 'border-lumo-niebla hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lumo-ambar text-lumo-noche">
                    Oferta Sprint 1
                  </span>
                  <div className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {founderSlotsRemaining} cupos
                  </div>
                </div>
                <h3 className="font-heading font-bold text-base text-lumo-noche">Cliente Fundador</h3>
                <div className="mt-2 mb-3">
                  <span className="text-2xl font-extrabold text-lumo-noche">$250</span>
                  <span className="text-xs text-lumo-pizarra"> USD montaje</span>
                  <div className="text-xs text-emerald-700 font-bold mt-0.5">
                    Anticipo hoy: $125 USD (50%)
                  </div>
                </div>
                <p className="text-xs text-lumo-pizarra">
                  Todo el Paquete Base con 50% de descuento a cambio de testimonio honesto y uso en portafolio.
                </p>
              </div>

              {/* Base Package */}
              <div
                onClick={() => setPackageType('BASE')}
                className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                  packageType === 'BASE'
                    ? 'border-lumo-ambar bg-amber-50/50 shadow-md ring-2 ring-lumo-ambar/30'
                    : 'border-lumo-niebla hover:border-slate-300 bg-white'
                }`}
              >
                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Estándar
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-lumo-noche">Paquete Base</h3>
                <div className="mt-2 mb-3">
                  <span className="text-2xl font-extrabold text-lumo-noche">$500</span>
                  <span className="text-xs text-lumo-pizarra"> USD montaje</span>
                  <div className="text-xs text-emerald-700 font-bold mt-0.5">
                    Anticipo hoy: $250 USD (50%)
                  </div>
                </div>
                <p className="text-xs text-lumo-pizarra">
                  Perfil Google optimizado + Web rápida de 1 página con llamadas en 1 clic + QR físico para reseñas.
                </p>
              </div>

              {/* Premium Package */}
              <div
                onClick={() => setPackageType('PREMIUM')}
                className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                  packageType === 'PREMIUM'
                    ? 'border-lumo-ambar bg-amber-50/50 shadow-md ring-2 ring-lumo-ambar/30'
                    : 'border-lumo-niebla hover:border-slate-300 bg-white'
                }`}
              >
                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    Pro
                  </span>
                </div>
                <h3 className="font-heading font-bold text-base text-lumo-noche">Paquete Premium</h3>
                <div className="mt-2 mb-3">
                  <span className="text-2xl font-extrabold text-lumo-noche">$1,000</span>
                  <span className="text-xs text-lumo-pizarra"> USD montaje</span>
                  <div className="text-xs text-emerald-700 font-bold mt-0.5">
                    Anticipo hoy: $500 USD (50%)
                  </div>
                </div>
                <p className="text-xs text-lumo-pizarra">
                  Para contratistas y clínicas: cotizador interactivo, galería de proyectos y multi-canal.
                </p>
              </div>
            </div>

            {/* Extra Channel Selector */}
            <div className="pt-4 border-t border-lumo-niebla">
              <label className="block text-sm font-bold text-lumo-noche mb-2">
                Elige tu canal de contacto directo adicional (incluido sin costo extra):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setExtraChannel('BOOKING')}
                  className={`min-h-touch p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    extraChannel === 'BOOKING'
                      ? 'border-lumo-ambar bg-amber-50 text-lumo-noche font-black ring-1 ring-lumo-ambar'
                      : 'border-lumo-niebla bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-lumo-ambar flex-shrink-0" />
                  <span>Reservas en Línea (Square / Booksy)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExtraChannel('WHATSAPP')}
                  className={`min-h-touch p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    extraChannel === 'WHATSAPP'
                      ? 'border-lumo-ambar bg-amber-50 text-lumo-noche font-black ring-1 ring-lumo-ambar'
                      : 'border-lumo-niebla bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>WhatsApp Business Automatizado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExtraChannel('IG_FB')}
                  className={`min-h-touch p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    extraChannel === 'IG_FB'
                      ? 'border-lumo-ambar bg-amber-50 text-lumo-noche font-black ring-1 ring-lumo-ambar'
                      : 'border-lumo-niebla bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Respuestas en Meta (IG & Facebook)</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-touch min-w-touch w-full sm:w-auto px-8 py-3.5 bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-heading font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Continuar a Datos del Negocio</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS DETAILS */}
        {step === 2 && (
          <form
            onSubmit={handleProceedToContract}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla space-y-5"
          >
            <div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche flex items-center gap-2">
                <Building2 className="w-5 h-5 text-lumo-ambar" />
                Paso 2: Información Oficial de tu Negocio
              </h2>
              <p className="text-sm text-lumo-pizarra mt-1">
                Estos datos figurarán en tu contrato legal y en tu Perfil de Google Business.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Nombre Comercial del Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej: El Rey Barbershop"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-1 focus:ring-lumo-ambar outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Nombre Completo del Titular o Dueño *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ej: Roberto Sánchez"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-1 focus:ring-lumo-ambar outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-lumo-noche mb-1">
                Dirección Física del Negocio *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: 1405 N Big Spring St"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-lumo-niebla focus:border-lumo-ambar focus:ring-1 focus:ring-lumo-ambar outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">Ciudad *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-lumo-niebla outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">Estado</label>
                <input
                  type="text"
                  disabled
                  value={state}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-lumo-niebla bg-slate-100 text-slate-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">Código Postal (ZIP) *</label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="79701"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-lumo-niebla outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Teléfono de Contacto Directo *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(432) 555-0199"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-lumo-niebla focus:border-lumo-ambar outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Correo Electrónico (Para recibir contrato y facturas) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="roberto@negocio.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-lumo-niebla focus:border-lumo-ambar outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-lumo-niebla">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-touch min-w-touch px-4 py-2 text-xs font-bold text-lumo-pizarra hover:text-lumo-noche flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modificar Paquete</span>
              </button>

              <button
                type="submit"
                className="min-h-touch min-w-touch px-8 py-3.5 bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-heading font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Revisar y Firmar Contrato</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CONTRACT REVIEW & DIGITAL SIGNATURE */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche flex items-center gap-2">
                <FileText className="w-5 h-5 text-lumo-ambar" />
                Paso 3: Contrato Legal de Servicios y Firma Digital
              </h2>
              <p className="text-sm text-lumo-pizarra mt-1">
                Validez legal bajo el Código de Comercio de Texas (Capítulo 322 - UETA).
              </p>
            </div>

            {/* Read-only contract scrollable viewer */}
            <div className="rounded-2xl border border-lumo-niebla bg-slate-50 p-4 max-h-64 overflow-y-auto text-xs leading-relaxed font-mono text-slate-700 shadow-inner">
              <p className="font-bold text-lumo-noche mb-2">
                CONTRATO DE SERVICIOS DIGITALES Y PRESENCIA LOCAL — LUMO HQ
              </p>
              <p>LUGAR: Midland, Texas, EE. UU. | FECHA: {new Date().toISOString().split('T')[0]}</p>
              <p className="mt-2">
                <strong>1. PARTES:</strong> Luis Barbera (DBA "Lumo HQ") y {ownerName || '[TITULAR]'} ({businessName || '[NEGOCIO]'}, {address}, {city}, TX {zipCode}).
              </p>
              <p className="mt-2">
                <strong>2. OBJETO:</strong> Montaje de presencia digital {packageType} con canal {extraChannel}.
              </p>
              <p className="mt-2">
                <strong>3. CASCADA DE PAGO 50/50:</strong> Anticipo inicial hoy: <strong>${pricing.deposit} USD</strong>. Pago final al aprobar la web (Día 5): <strong>${pricing.final} USD</strong>. Mensualidad de mantenimiento recurrente: <strong>${pricing.monthly} USD/mes</strong> (+ imp. ventas Texas ~$6.60 USD).
              </p>
              <p className="mt-2">
                <strong>4. PLAZO DE ENTREGA:</strong> 5 días hábiles a partir de contar con el anticipo del 50% acreditado Y los materiales completos del Día 1.
              </p>
              <p className="mt-2">
                <strong>5. CERO CONTRASEÑAS:</strong> Lumo HQ jamás te pedirá contraseñas; los accesos son por invitación de usuario administrador.
              </p>
              <p className="mt-2">
                <strong>6. DERECHOS DE AUTOR:</strong> El Cliente declara tener los derechos sobre fotografías, marcas y logotipos entregados.
              </p>
              <p className="mt-2">
                <strong>7. CUMPLIMIENTO FTC & TCPA:</strong> No se promete número 1 en Google ni reseñas falsas. Se prohíbe el spam telefónico.
              </p>
              {packageType === 'FOUNDER' && (
                <p className="mt-2 text-amber-900 bg-amber-100 p-2 rounded">
                  <strong>8. CLÁUSULA FUNDADOR:</strong> Autorización de capturas del "antes y después" en portafolio y testimonio honesto a los 30 días a cambio del precio especial de $250 USD.
                </p>
              )}
            </div>

            {/* Mandatory checkboxes for legal defense */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 text-xs text-lumo-noche cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lumo-ambar focus:ring-lumo-ambar"
                />
                <span>
                  He leído y acepto el contrato de servicios de Lumo HQ y sus términos en Midland, TX.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-lumo-noche cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree5050}
                  onChange={(e) => setAgree5050(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lumo-ambar focus:ring-lumo-ambar"
                />
                <span>
                  Acepto la regla de pago 50/50: pago del 50% de anticipo hoy y el 50% restante solo cuando apruebe la entrega en el Día 5.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-lumo-noche cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeDay1Pause}
                  onChange={(e) => setAgreeDay1Pause(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lumo-ambar focus:ring-lumo-ambar"
                />
                <span>
                  Entiendo que el plazo de 5 días hábiles se pausará si no entrego las fotos e información requeridas en el Día 1.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-lumo-noche cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeZeroPasswords}
                  onChange={(e) => setAgreeZeroPasswords(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lumo-ambar focus:ring-lumo-ambar"
                />
                <span>
                  Confirmo la política "Cero Contraseñas": otorgaré accesos como administrador sin compartir contraseñas personales ni bancarias.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-lumo-noche cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeCopyright}
                  onChange={(e) => setAgreeCopyright(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lumo-ambar focus:ring-lumo-ambar"
                />
                <span>
                  Declaro ser titular o tener los derechos legales de autor sobre las fotos y logotipo proporcionados para el sitio.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-lumo-noche cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeFtcTcpa}
                  onChange={(e) => setAgreeFtcTcpa(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-lumo-ambar focus:ring-lumo-ambar"
                />
                <span>
                  Reconozco que no se garantizan posiciones fijas en Google (FTC) y que no se enviará spam telefónico a clientes (TCPA).
                </span>
              </label>
            </div>

            {/* Interactive Canvas Signature Pad */}
            <div className="pt-2">
              <SignaturePad
                signerName={ownerName}
                onSignatureChange={(url) => setSignatureDataUrl(url)}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-lumo-niebla">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-touch min-w-touch px-4 py-2 text-xs font-bold text-lumo-pizarra hover:text-lumo-noche flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Datos</span>
              </button>

              <button
                type="button"
                disabled={isSigning || !signatureDataUrl}
                onClick={handleSignContract}
                className={`min-h-touch min-w-touch px-8 py-3.5 font-heading font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2 ${
                  isSigning || !signatureDataUrl
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche'
                }`}
              >
                {isSigning ? (
                  <span>Firmando y Sellando Criptográficamente...</span>
                ) : (
                  <>
                    <span>Firmar Contrato y Pasar a Pago</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT OF 50% DEPOSIT WITH STRIPE */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-lumo-niebla space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-lumo-noche">
                Contrato Firmado Exitosamente
              </h2>
              <p className="text-xs text-lumo-pizarra mt-1">
                Identificador de Contrato: <span className="font-mono font-bold text-lumo-noche">{signedContractId}</span>
              </p>
              {contractSha256 && (
                <div className="mt-2 inline-block bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-600 max-w-full truncate">
                  SHA-256: {contractSha256}
                </div>
              )}
            </div>

            {/* Financial breakdown */}
            <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200/60 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-lumo-noche pb-2 border-b border-amber-200">
                <span>Resumen de Cobro — {businessName}</span>
                <span className="text-xs font-normal text-slate-600">{packageType}</span>
              </div>

              <div className="flex justify-between text-xs text-lumo-pizarra">
                <span>Costo Total de Montaje:</span>
                <span className="font-bold text-lumo-noche">${pricing.setup}.00 USD</span>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span>Anticipo a pagar hoy (50%):</span>
                <span>${pricing.deposit}.00 USD</span>
              </div>

              <div className="flex justify-between text-xs text-lumo-pizarra pt-1">
                <span>Saldo pendiente al aprobar la web (Día 5):</span>
                <span className="font-bold text-lumo-noche">${pricing.final}.00 USD</span>
              </div>

              <div className="flex justify-between text-xs text-lumo-pizarra">
                <span>Mantenimiento posterior (a partir del mes 2):</span>
                <span>${pricing.monthly}.00/mes + Tax (~$6.60)</span>
              </div>
            </div>

            {/* Stripe trust info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-lumo-pizarra">
              <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                Pago cifrado de 256 bits procesado a través de <strong>Stripe</strong>. Acepta tarjetas Visa, Mastercard, AMEX y Apple/Google Pay.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={handlePayDeposit}
                className={`min-h-touch min-w-touch w-full py-4 text-center font-heading font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base ${
                  isCheckingOut
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche'
                }`}
              >
                {isCheckingOut ? (
                  <span>Conectando con Pasarela Segura de Stripe...</span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar Anticipo de ${pricing.deposit} USD y Activar Día 1</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-center text-sm">Cargando pasarela segura...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}


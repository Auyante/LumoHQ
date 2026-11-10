'use client';

import Image from 'next/image';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Download,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ClientProject, clientProjectStore } from '@/lib/client-portal';

function PortalContent() {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('client_id') || 'cli_elrey_01';
  // Access key from the client's portal link; the API refuses changes without it.
  const portalKey = searchParams.get('k') || '';

  const [project, setProject] = useState<ClientProject | null>(null);
  const [activeTab, setActiveTab] = useState<'clock' | 'checklist' | 'passwords' | 'preview' | 'kit'>('clock');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>('google');

  // Load client data
  useEffect(() => {
    // In dev/demo, load from memory store
    const p = clientProjectStore.getById(clientIdParam) || clientProjectStore.getAll()[0];
    if (p) setProject(p);
  }, [clientIdParam]);

  const handleToggleChecklistItem = async (key: keyof ClientProject['day1Checklist']) => {
    if (!project) return;
    const currentVal = project.day1Checklist[key];
    const updates = { [key]: !currentVal };

    try {
      const res = await fetch('/api/client/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: project.id, key: portalKey, updates }),
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!project || !files || files.length === 0) return;
    const fd = new FormData();
    fd.append('clientId', project.id);
    fd.append('key', portalKey);
    Array.from(files).forEach((f) => fd.append('photos', f));
    setUploadMsg('Subiendo…');
    try {
      const res = await fetch('/api/client/photos', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.project) setProject(data.project);
      const bad = (data.rejected || []).map((r: { name: string; error: string }) => `${r.name}: ${r.error}`).join(' · ');
      setUploadMsg(data.error || (data.saved ? `${data.saved} foto(s) guardada(s).${bad ? ' Rechazadas: ' + bad : ''}` : bad || 'No se pudo subir.'));
    } catch {
      setUploadMsg('No se pudo subir. Revisa tu conexión.');
    }
  };


  const handleClientApproval = async () => {
    if (!project) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/client/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: project.id, key: portalKey,
          clientWrittenConfirmation: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.project);
        setApprovalSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-sm text-slate-500">Cargando portal del cliente...</div>
      </div>
    );
  }

  const isPaused = project.clock.isPaused;

  return (
    <div className="min-h-screen bg-slate-50 text-lumo-noche pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-lumo-niebla px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-heading font-extrabold text-xl text-lumo-noche">
              LUMO<span className="text-lumo-ambar">HQ</span>
            </Link>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
              Portal del Cliente
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-lumo-pizarra">Cliente:</span>
            <strong className="text-lumo-noche">{project.businessName}</strong>
            <span className="text-slate-400">({project.city}, TX)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Project Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 mb-2">
              <Building2 className="w-3.5 h-3.5 text-lumo-ambar" />
              <span>Expediente: {project.businessName}</span>
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-lumo-noche">
              Tu Línea de Entrega Técnica en 5 Días
            </h1>
            <p className="text-xs text-lumo-pizarra mt-1">
              Paquete: <strong>{project.packageType}</strong> · Canal: <strong>{project.extraChannel}</strong>
            </p>
          </div>

          {/* Clock Status Badge */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isPaused
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {isPaused ? (
              <PauseCircle className="w-8 h-8 text-red-600 flex-shrink-0 animate-pulse" />
            ) : (
              <PlayCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            )}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                {isPaused ? 'Reloj de 5 Días Pausado' : `Día ${project.clock.currentDay} de 5 en Progreso`}
              </span>
              <span className="text-xs">
                {isPaused ? 'Pendiente completar materiales' : 'Avanzando según cronograma'}
              </span>
            </div>
          </div>
        </div>

        {/* Warning if paused */}
        {isPaused && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl text-xs text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">¿Por qué está pausado el reloj de 5 días hábiles?</p>
              <p className="mt-1">
                {project.clock.pauseReason ||
                  'Para garantizar la calidad de tu entrega, el reloj de 5 días hábiles requiere contar con el anticipo del 50% y los datos del Día 1 completos (fotos, horarios y confirmación de derechos).'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className="mt-2 text-xs font-bold text-red-900 underline"
              >
                Completar Checklist del Día 1 ahora →
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-lumo-niebla pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('clock')}
            className={`min-h-touch px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'clock'
                ? 'bg-lumo-noche text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cronograma de 5 Días
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`min-h-touch px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'checklist'
                ? 'bg-lumo-noche text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            Checklist Día 1 ({project.day1Checklist.isComplete ? 'Listo' : 'Pendiente'})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('passwords')}
            className={`min-h-touch px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'passwords'
                ? 'bg-lumo-noche text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            Guía Cero Contraseñas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`min-h-touch px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'preview'
                ? 'bg-lumo-noche text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vista Previa de tu Web
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kit')}
            className={`min-h-touch px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'kit'
                ? 'bg-lumo-noche text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            }`}
          >
            Kit de Reseñas QR
          </button>
        </div>

        {/* TAB 1: 5-DAY CLOCK & PIPELINE */}
        {activeTab === 'clock' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche">
                Línea de Producción de 5 Días Hábiles
              </h2>
              <p className="text-xs text-lumo-pizarra mt-1">
                Supervisado por Carlos Gómez (Ingeniería) y Luis Barbera (Operaciones Midland).
              </p>
            </div>

            <div className="space-y-4">
              {/* Day 0 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  D0
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-lumo-noche">
                      Día 0: Firma de Contrato y Anticipo 50%
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Completado
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Contrato digital sellado con SHA-256 e inicio formal de expediente en Midland, TX.
                  </p>
                </div>
              </div>

              {/* Day 1 */}
              <div
                className={`flex items-start gap-4 p-4 rounded-2xl border ${
                  project.day1Checklist.isComplete
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-amber-50 border-amber-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    project.day1Checklist.isComplete
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-200 text-amber-900 animate-pulse'
                  }`}
                >
                  D1
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-lumo-noche">
                      Día 1: Recolección de Datos, Horarios y 10-20 Fotos
                    </h4>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        project.day1Checklist.isComplete
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-amber-800 bg-amber-200'
                      }`}
                    >
                      {project.day1Checklist.isComplete ? 'Completado' : 'En Recolección'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Bárbara y el Cliente completan horarios exactos, menú o servicios y fotos de alta calidad.
                  </p>
                </div>
              </div>

              {/* Day 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  D2
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-lumo-noche">
                      Día 2: Montaje Técnico en Next.js & Subida a Producción
                    </h4>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      Ingeniería (Carlos)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Creación del sitio de 1 página con botones de llamada en 1 toque y canal adicional.
                  </p>
                </div>
              </div>

              {/* Day 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  D3
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-lumo-noche">
                      Día 3: Auditoría de Velocidad Móvil & Accesibilidad
                    </h4>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      Auditoría QA
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Verificación de carga en menos de 1.5s en smartphones y botones accesibles de 48x48px.
                  </p>
                </div>
              </div>

              {/* Day 4 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  D4
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-lumo-noche">
                      Día 4: Presentación Privada al Cliente
                    </h4>
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      Revisión (Luis)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Envío del enlace interactivo de demostración para que pruebes tu web directamente en tu celular.
                  </p>
                </div>
              </div>

              {/* Day 5 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  D5
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-lumo-noche">
                      Día 5: Aprobación Final, 50% Restante y Entrega de Kit de Reseñas
                    </h4>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Entrega
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Aprobación por escrito, entrega de accesos y sticker físico para el mostrador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DAY 1 CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche">
                Checklist de Recolección de Datos (Día 1)
              </h2>
              <p className="text-xs text-lumo-pizarra mt-1">
                La regla operativa de Lumo HQ requiere completar estos puntos para activar el plazo de 5 días hábiles.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={project.day1Checklist.napVerified}
                  onChange={() => handleToggleChecklistItem('napVerified')}
                  className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                />
                <div>
                  <strong className="block text-lumo-noche">Datos NAP Verificados (Nombre, Dirección, Teléfono)</strong>
                  <span className="text-slate-600">{project.address}, {project.city}, {project.state} · Tel: {project.phone}</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={project.day1Checklist.hoursSet}
                  onChange={() => handleToggleChecklistItem('hoursSet')}
                  className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                />
                <div>
                  <strong className="block text-lumo-noche">Horarios de Atención Exactos</strong>
                  <span className="text-slate-600">Lunes a Sábado de 9:00 AM a 7:00 PM (Domingos cerrado)</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={project.day1Checklist.servicesMenuSet}
                  onChange={() => handleToggleChecklistItem('servicesMenuSet')}
                  className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                />
                <div>
                  <strong className="block text-lumo-noche">Lista de Servicios o Menú de Precios</strong>
                  <span className="text-slate-600">Cortes clásicos, afeitados con navaja, arreglo de barba, etc.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={project.day1Checklist.serviceAreaSet}
                  onChange={() => handleToggleChecklistItem('serviceAreaSet')}
                  className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                />
                <div>
                  <strong className="block text-lumo-noche">Área de Cobertura Local</strong>
                  <span className="text-slate-600">Midland y Odessa, Texas</span>
                </div>
              </label>
            </div>

            {/* Photos Upload & Rights Confirmation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <strong className="text-lumo-noche">Fotografías del Negocio (10 a 20 requeridas):</strong>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {project.day1Checklist.photosUploadedCount} fotos cargadas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="min-h-touch px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <UploadCloud className="w-4 h-4 text-lumo-ambar" />
                  <span>Subir fotos (JPG, PNG o WebP, hasta 10 MB)</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { handlePhotoUpload(e.target.files); e.target.value = ''; }} />
                </label>
              </div>
              {uploadMsg && <p className="text-xs text-slate-600" role="status">{uploadMsg}</p>}

              {/* Mandatory copyright checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-700 pt-2 border-t border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={project.day1Checklist.copyrightConfirmed}
                  onChange={() => handleToggleChecklistItem('copyrightConfirmed')}
                  className="mt-0.5 w-4 h-4 text-lumo-ambar rounded"
                />
                <span>
                  <strong>Declaración Legal de Derechos de Autor:</strong> Confirmo que poseo los derechos y autorizaciones sobre las fotografías y marcas suministradas para el sitio web.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: ZERO PASSWORDS GUIDE */}
        {activeTab === 'passwords' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Política &ldquo;Cero Contraseñas&rdquo; de Lumo HQ</span>
              </div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche">
                Tú mantienes el control total de tus cuentas
              </h2>
              <p className="text-xs text-lumo-pizarra mt-1">
                Lumo HQ jamás te pedirá contraseñas personales o bancarias. Todo se gestiona por invitación de administrador.
              </p>
            </div>

            <div className="space-y-3">
              {/* Google Business Profile */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === 'google' ? null : 'google')}
                  className="w-full flex justify-between items-center text-left text-xs font-bold text-lumo-noche"
                >
                  <span>1. ¿Cómo invitar a Lumo HQ a tu Perfil de Google Business?</span>
                  {expandedFaq === 'google' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedFaq === 'google' && (
                  <div className="text-xs text-slate-700 mt-2 space-y-1.5 pl-2 border-l-2 border-lumo-ambar">
                    <p>1. Entra a Google y busca el nombre exacto de tu negocio.</p>
                    <p>2. Haz clic en los tres puntos verticales (Menú) → <strong>Configuración del perfil de negocio</strong>.</p>
                    <p>3. Selecciona <strong>Administradores</strong> → <strong>Agregar</strong>.</p>
                    <p>4. Ingresa el correo de Lumo HQ: <strong>operaciones@lumohq.com</strong> y asígnale el rol de <em>Administrador</em>.</p>
                  </div>
                )}
              </div>

              {/* Meta Business */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === 'meta' ? null : 'meta')}
                  className="w-full flex justify-between items-center text-left text-xs font-bold text-lumo-noche"
                >
                  <span>2. ¿Cómo asignar acceso a tu Página de Facebook / Instagram?</span>
                  {expandedFaq === 'meta' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedFaq === 'meta' && (
                  <div className="text-xs text-slate-700 mt-2 space-y-1.5 pl-2 border-l-2 border-lumo-ambar">
                    <p>1. Ve a Meta Business Suite o a la configuración de tu página.</p>
                    <p>2. En la sección <strong>Acceso a la página</strong>, haz clic en <em>Personas con acceso a tareas</em>.</p>
                    <p>3. Agrega a Luis Barbera con acceso para vincular la web sin otorgar control de facturación ni propiedad.</p>
                  </div>
                )}
              </div>

              {/* Square / Booksy */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === 'square' ? null : 'square')}
                  className="w-full flex justify-between items-center text-left text-xs font-bold text-lumo-noche"
                >
                  <span>3. ¿Cómo conectar tus reservas en línea (Square o Booksy)?</span>
                  {expandedFaq === 'square' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedFaq === 'square' && (
                  <div className="text-xs text-slate-700 mt-2 space-y-1.5 pl-2 border-l-2 border-lumo-ambar">
                    <p>Solo necesitamos el enlace público de reservas de tu cuenta (ejemplo: <em>square.site/book/...</em>).</p>
                    <p>Nosotros lo embebemos dentro del botón de 1 clic en tu web para que los clientes agenden citas directamente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WEB PREVIEW & DAY 5 CLIENT APPROVAL */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-heading font-bold text-lumo-noche">
                  Vista Previa Privada de tu Web
                </h2>
                <p className="text-xs text-lumo-pizarra mt-1">
                  Revisa cómo se ve tu sitio web en smartphones y comprueba los botones de contacto en 1 clic.
                </p>
              </div>

              <Link
                href={project.previewDemoUrl}
                target="_blank"
                className="min-h-touch px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-lumo-noche rounded-xl flex items-center gap-1.5"
              >
                <span>Abrir en Pestaña Nueva</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Embedded mockup view */}
            <div className="rounded-2xl border-2 border-lumo-niebla overflow-hidden bg-slate-900 shadow-inner">
              <div className="p-2 bg-slate-800 text-slate-300 text-xs flex items-center justify-between font-mono">
                <span>https://lumohq.com{project.previewDemoUrl}</span>
                <span className="text-[10px] text-emerald-400">● 100% Responsive</span>
              </div>
              <iframe
                src={project.previewDemoUrl}
                className="w-full h-96 bg-white"
                title="Vista previa del cliente"
              />
            </div>

            {/* DAY 5 FINAL APPROVAL SECTION */}
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-lumo-ambar" />
                <h3 className="text-sm font-bold text-lumo-noche">
                  Aprobación Escrita de Entrega Técnica (Día 5)
                </h3>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Al hacer clic en este botón confirmas que has revisado tu página web, verificado los botones de contacto y estás 100% satisfecho con el trabajo técnico entregado por Lumo HQ. Esto desbloquea el pago del 50% restante y activa el mantenimiento mensual.
              </p>

              {approvalSuccess || project.finalPaid ? (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>¡Entrega técnica aprobada con éxito! Tu sitio está en producción oficial.</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={handleClientApproval}
                  className="min-h-touch min-w-touch w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {isApproving
                      ? 'Procesando Aprobación Oficial...'
                      : 'He revisado mi web y apruebo la entrega técnica final'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: REVIEW KIT DOWNLOAD */}
        {activeTab === 'kit' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-lumo-noche">
                Kit Físico de Reseñas para Mostrador
              </h2>
              <p className="text-xs text-lumo-pizarra mt-1">
                Diseñado para que tus clientes satisfechos escaneen el código QR y te califiquen en Google Maps al momento de pagar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <Image
                  src="/images/sticker_resenas_1200x1200.png"
                  width={192}
                  height={192}
                  alt="Sticker de Reseñas Lumo HQ"
                  className="w-48 h-48 mx-auto rounded-xl shadow-md object-contain bg-white p-2"
                />
                <span className="text-[11px] font-bold text-lumo-pizarra block">
                  Sticker de 1200x1200px en alta resolución
                </span>
                <a
                  href="/images/sticker_resenas_1200x1200.png"
                  download="Sticker_Resenas_LumoHQ.png"
                  className="min-h-touch inline-flex items-center gap-2 px-4 py-2 bg-lumo-ambar text-lumo-noche font-bold text-xs rounded-xl shadow-sm hover:bg-lumo-brillo"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Sticker Imprimible</span>
                </a>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <strong className="block text-amber-900 mb-1">Enlace Corto a tu Perfil:</strong>
                  <code className="text-[11px] bg-white px-2 py-1 rounded border border-amber-300 block select-all">
                    {project.reviewShortLink || 'https://g.page/r/lumo-elrey/review'}
                  </code>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-lumo-noche">¿Cómo usarlo en tu local?</h4>
                  <p>• Pégalo en tu caja registradora, mostrador de cobro o espejos de corte.</p>
                  <p>• Di al cliente: <em>&ldquo;Si te gustó el servicio, ¿nos regalas una reseña en Google con tu celular escaneando este código?&rdquo;</em></p>
                  <p className="text-[11px] text-slate-500 italic">
                    Cumplimiento FTC: No ofrezcas descuentos a cambio de reseñas de 5 estrellas. Solo experiencias auténticas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-center text-sm">Cargando portal...</div>}>
      <PortalContent />
    </Suspense>
  );
}


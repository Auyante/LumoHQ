'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Flame,
  Clock,
  Sparkles,
  BookOpen,
  LayoutGrid,
  List,
  Download,
  CheckSquare,
  Square,
  Printer,
  Calendar,
  Send,
  X,
  MapPin,
  Tag,
  DollarSign,
  Upload,
} from 'lucide-react';
import {
  ProspectItem,
  OFFICIAL_SCRIPTS,
  calculateProspectSignals,
} from '@/lib/crm';
import { toCsv, byUrgency, commissionLedger, type Moment } from '@/lib/crm-engine';

const commissionLedgerTotal = (list: ProspectItem[]) => commissionLedger(list).barbaraTotal;
import { CadenceBadge, ContactLauncher, CsvImport, FunnelAndMoney, ObjectionFinder, WorkQueue, useNow } from '@/components/admin/crm/CrmTools';

const SIGNAL_DEFS: { key: keyof ProspectItem['signals']; label: string }[] = [
  { key: 'scoreReviews', label: '1. Menos de 20 reseñas, o la última tiene más de 3 meses.' },
  { key: 'scoreWebsite', label: '2. Sin página web, o rota o desactualizada.' },
  { key: 'scorePhotos', label: '3. Fotos viejas, pocas o ninguna.' },
  { key: 'scoreHours', label: '4. Horario vacío o incompleto.' },
  { key: 'scoreDescription', label: '5. Sin descripción, sin servicios o con categorías mal puestas.' },
  { key: 'scoreReviewResponse', label: '6. Reseñas sin respuesta del dueño.' },
  { key: 'scoreBooking', label: '7. Sin botón de reservar (barberías, salones, talleres con citas).' },
  { key: 'scoreSpanish', label: '8. Atiende en español (por las reseñas, las fotos o el nombre).' },
];

export default function AdminCrmPage() {
  // The operator is whoever is signed in; there is no role switch in the UI.
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  useEffect(() => {
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then((d) => d?.user && setMe(d.user)).catch(() => {});
  }, []);
  const role: 'SALES_BARBARA' | 'ADMIN_LUIS' = me?.role === 'SALES_BARBARA' ? 'SALES_BARBARA' : 'ADMIN_LUIS';
  const operatorName = me?.name ?? (role === 'SALES_BARBARA' ? 'Bárbara' : 'Luis');
  const [prospects, setProspects] = useState<ProspectItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number>(1);
  const [selectedLead, setSelectedLead] = useState<ProspectItem | null>(null);
  const [activeTab, setActiveTab] = useState<'kanban' | 'scripts' | 'objections'>('kanban');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState<'ALL' | 'Midland' | 'Odessa'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'P1' | 'P2' | 'DISCARD'>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<'ALL' | ProspectItem['source']>('ALL');
  const [mobileStage, setMobileStage] = useState<ProspectItem['stage']>('LISTED');
  const [isImporting, setIsImporting] = useState(false);
  const [diagnosisUrl, setDiagnosisUrl] = useState<string | null>(null);
  const now = useNow();
  const isAdmin = !!me && ['SUPER_ADMIN', 'ADMIN_LUIS', 'ADMIN_CARLOS'].includes(me.role);

  // Detail Modal Sub-state
  const [newNoteInput, setNewNoteInput] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // New Lead Form State
  const [newBizName, setNewBizName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('Midland');
  const [newCategory, setNewCategory] = useState('Servicios Locales');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/crm/prospects');
      const data = await res.json();
      if (data.prospects) {
        setProspects(data.prospects);
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    }
  };

  const handleUpdateStage = async (id: string, newStage: ProspectItem['stage']) => {
    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'update_stage', stage: newStage }),
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, stage: newStage } : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSignal = async (signalKey: keyof ProspectItem['signals']) => {
    if (!selectedLead) return;
    const currentSignals = { ...selectedLead.signals };
    currentSignals[signalKey] = !currentSignals[signalKey];

    const { score, priority } = calculateProspectSignals(currentSignals);
    const updatedLead: ProspectItem = {
      ...selectedLead,
      signals: currentSignals,
      totalScore: score,
      priority,
    };

    setSelectedLead(updatedLead);
    setProspects((prev) => prev.map((p) => (p.id === selectedLead.id ? updatedLead : p)));

    try {
      await fetch('/api/crm/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLead.id,
          action: 'update_signals',
          signals: currentSignals,
        }),
      });
    } catch (e) {
      console.error('Error saving signals:', e);
    }
  };

  const handleSaveLeadDetails = async () => {
    if (!selectedLead) return;
    setSavingDetails(true);
    try {
      const details: Partial<ProspectItem> = {
        preferredChannel: selectedLead.preferredChannel,
        questionSource: selectedLead.questionSource,
        questionMissedCalls: selectedLead.questionMissedCalls,
      };

      const res = await fetch('/api/crm/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLead.id,
          action: 'update_details',
          details,
        }),
      });

      if (res.ok) {
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNoteInput.trim()) return;
    const note = newNoteInput.trim();
    setNewNoteInput('');
    try {
      // The server stamps the date and the author; notes are append-only.
      const res = await fetch('/api/crm/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedLead.id, action: 'add_note', note }),
      });
      const data = await res.json();
      if (res.ok && data.prospect) setSelectedLead(data.prospect);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowUp = async (id: string) => {
    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'follow_up',
          note: `Seguimiento registrado por ${operatorName}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error al registrar seguimiento');
      } else {
        fetchLeads();
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(data.prospect);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: newBizName,
          ownerName: newOwnerName,
          phone: newPhone,
          city: newCity,
          category: newCategory,
          batchNumber: selectedBatch,
          source: role === 'SALES_BARBARA' ? 'BARBARA' : 'LUIS',
          signals: {
            scoreReviews: true,
            scoreWebsite: true,
            scorePhotos: true,
            scoreHours: false,
            scoreDescription: true,
            scoreReviewResponse: false,
            scoreBooking: false,
            scoreSpanish: true,
          },
        }),
      });
      if (res.ok) {
        setIsCreatingLead(false);
        setNewBizName('');
        setNewOwnerName('');
        setNewPhone('');
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(label);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  // Export to CSV helper
  const handleExportCsv = () => {
    // toCsv quotes every cell and neutralizes =, +, -, @ so a business name can never run as a formula.
    const blob = new Blob([toCsv(filteredProspects, now)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LumoHQ_Lote_${selectedBatch}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  /** What "Marcar como enviado" records for each moment. Follow-ups go through the server's TCPA check. */
  const handleSent = async (lead: ProspectItem, moment: Moment): Promise<string | null> => {
    const patch = (body: Record<string, unknown>) =>
      fetch('/api/crm/prospects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lead.id, ...body }) });
    let res: Response;
    if (moment === 'primerContacto') res = await patch({ action: 'update_stage', stage: lead.stage === 'LISTED' ? 'CONTACTED' : lead.stage });
    else if (moment === 'envioDiagnostico') res = await patch({ action: 'update_stage', stage: 'DIAGNOSED' });
    else if (moment === 'propuesta') res = await patch({ action: 'add_note', note: 'Propuesta enviada.' });
    else res = await patch({ action: 'follow_up' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || 'No se pudo registrar.';
    if (data.prospect) setSelectedLead(data.prospect);
    fetchLeads();
    return 'Registrado. El siguiente paso ya se recalculó.';
  };

  const handleOptOut = async (lead: ProspectItem, optedOut: boolean) => {
    const res = await fetch('/api/crm/prospects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lead.id, action: 'opt_out', optedOut }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.prospect) setSelectedLead(data.prospect);
    fetchLeads();
  };

  // A fresh signed share link for the 1-page diagnosis whenever a lead is opened.
  useEffect(() => {
    setDiagnosisUrl(null);
    if (!selectedLead) return;
    fetch(`/api/crm/diagnosis-link?id=${encodeURIComponent(selectedLead.id)}`)
      .then((r) => (r.ok ? r.json() : null)).then((d) => d?.url && setDiagnosisUrl(d.url)).catch(() => {});
  }, [selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered prospects with combined criteria
  const batchProspects = useMemo(() => {
    return prospects.filter((p) => p.batchNumber === selectedBatch);
  }, [prospects, selectedBatch]);

  const filteredProspects = useMemo(() => {
    return batchProspects.filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.businessName.toLowerCase().includes(query);
        const matchOwner = (p.ownerName || '').toLowerCase().includes(query);
        const matchPhone = p.phone.toLowerCase().includes(query);
        if (!matchName && !matchOwner && !matchPhone) return false;
      }
      if (filterCity !== 'ALL' && p.city !== filterCity) return false;
      if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
      if (filterPriority !== 'ALL' && p.priority !== filterPriority) return false;
      if (filterStage !== 'ALL' && p.stage !== filterStage) return false;
      if (filterSource !== 'ALL' && p.source !== filterSource) return false;
      return true;
    }).sort((a, b) => byUrgency(a, b, now)); // work queue order: overdue first
  }, [batchProspects, searchQuery, filterCity, filterCategory, filterPriority, filterStage, filterSource, now]);

  // Barbara commission calculations
  // Official waterfall (finance.ts): $25 for clients 1-5, $15 for 6-30, $0 referrals, $500 cap.
  const barbaraEstimatedEarned = useMemo(() => commissionLedgerTotal(prospects), [prospects]);

  const stages: { key: ProspectItem['stage']; label: string; badge: string }[] = [
    { key: 'LISTED', label: '1. Lista en Google', badge: 'bg-slate-100 text-slate-700' },
    { key: 'CONTACTED', label: '2. Primer Contacto', badge: 'bg-blue-100 text-blue-800' },
    { key: 'DIAGNOSED', label: '3. Diagnóstico 24h', badge: 'bg-purple-100 text-purple-800' },
    { key: 'MET', label: '4. Reunión 15 min', badge: 'bg-amber-100 text-amber-800' },
    { key: 'CLOSED', label: '5. Cierre / Contrato', badge: 'bg-emerald-100 text-emerald-800' },
    { key: 'FOLLOW_UP', label: '6. Seguimiento (TCPA)', badge: 'bg-orange-100 text-orange-800' },
  ];

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(batchProspects.map((p) => p.category)));
  }, [batchProspects]);

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-16 flex flex-col antialiased">
      <AdminNav />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6 grow w-full">
        {/* Role & Operational Context Bar */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-lumo-niebla shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-lumo-pizarra">Sesión:</span>
            <strong className="text-lumo-noche">{me ? me.name : '…'}</strong>
            {me && <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-slate-600">{me.role}</span>}
          </div>
          <div className="text-xs text-lumo-pizarra">
            Fuente de Verdad:{' '}
            <strong className="text-lumo-noche">LUMO-SOP-003 · Manual de Operaciones</strong>
          </div>
        </div>

        {/* 1. TOP METRIC CARDS (grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Batch Selector */}
          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs flex flex-col justify-between">
            <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
              Lote de Prospección (30 max)
            </span>
            <div className="flex items-center gap-2.5 mt-2">
              {[1, 2, 3, 4, 5].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBatch(b)}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-colors active:scale-95 ${
                    selectedBatch === b
                      ? 'bg-lumo-ambar text-lumo-noche ring-2 ring-lumo-ambar/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  L{b}
                </button>
              ))}
            </div>
          </div>

          {/* Qualified Leads */}
          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs">
            <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
              Prospectos Lote {selectedBatch}
            </span>
            <div className="text-2xl font-black text-lumo-noche mt-1">
              {batchProspects.length} <span className="text-xs font-normal text-slate-500">/ 30 meta</span>
            </div>
            <div className="text-xs text-emerald-700 font-bold mt-1">
              {batchProspects.filter((p) => p.priority === 'P1').length} Prioridad Alta (P1: 4+ señales)
            </div>
          </div>

          {/* Closed Deals */}
          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs">
            <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
              Cierres Confirmados
            </span>
            <div className="text-2xl font-black text-lumo-noche mt-1">
              {prospects.filter((p) => p.stage === 'CLOSED').length}
            </div>
            <span className="text-xs text-slate-500">Contratos firmados 50/50</span>
          </div>

          {/* Barbara Commission Cap Tracker */}
          <div className="bg-white p-4 rounded-2xl border border-lumo-niebla shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs text-lumo-pizarra font-bold uppercase tracking-wider">
                Comisión Bárbara (Tope $500)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Tope 3 Meses
              </span>
            </div>
            <div className="text-2xl font-black text-lumo-noche mt-1">
              ${barbaraEstimatedEarned} <span className="text-xs font-normal text-slate-500">/ $500 max</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-lumo-ambar h-full rounded-full transition-all"
                style={{ width: `${(barbaraEstimatedEarned / 500) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Today's work queue, then funnel, commission and batch projection */}
        <WorkQueue prospects={batchProspects} now={now} onOpen={setSelectedLead} />
        <FunnelAndMoney prospects={prospects} batch={selectedBatch} />

        {/* View Tabs & Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-lumo-niebla pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'kanban'
                  ? 'bg-lumo-noche text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pipeline & Prospectos ({filteredProspects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scripts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scripts'
                  ? 'bg-lumo-noche text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Guiones Oficiales (Doc 03)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('objections')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'objections'
                  ? 'bg-lumo-noche text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              Manejo de 8 Objeciones (Doc 03)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'kanban' && (
              <>
                {/* View Mode Toggle: Kanban vs List */}
                <div className="inline-flex rounded-xl bg-slate-200 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'kanban'
                        ? 'bg-white text-lumo-noche shadow-xs'
                        : 'text-slate-600 hover:text-lumo-noche'
                    }`}
                    title="Vista Tablero Kanban"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-lumo-noche shadow-xs'
                        : 'text-slate-600 hover:text-lumo-noche'
                    }`}
                    title="Vista Lista Compacta"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* CSV Export Button */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="min-h-touch px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                  title="Exportar a CSV"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsImporting(true)}
                    className="min-h-touch px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    title="Importar CSV"
                  >
                    <Upload className="w-4 h-4 text-sky-700" />
                    <span className="hidden sm:inline">Importar CSV</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setIsCreatingLead(true)}
              className="min-h-touch px-4 py-2 bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Negocio</span>
            </button>
          </div>
        </div>

        {/* TAB 1: KANBAN & PROSPECTS (WITH SEARCH & COMBINED FILTERS) */}
        {activeTab === 'kanban' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl p-4 border border-lumo-niebla shadow-xs space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-center">
                {/* Search query */}
                <div className="col-span-2 md:col-span-3 lg:col-span-5 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por negocio, dueño o teléfono..."
                    className="w-full min-h-touch pl-9 pr-3 py-2 text-sm rounded-xl border border-lumo-niebla focus:border-lumo-ambar outline-none"
                  />
                </div>

                {/* City Filter */}
                <div>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value as any)}
                    className="w-full min-h-touch px-2.5 py-2 text-xs rounded-xl border border-lumo-niebla bg-white focus:border-lumo-ambar outline-none"
                  >
                    <option value="ALL">Ciudad: Todas</option>
                    <option value="Midland">Midland, TX</option>
                    <option value="Odessa">Odessa, TX</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full min-h-touch px-2.5 py-2 text-xs rounded-xl border border-lumo-niebla bg-white focus:border-lumo-ambar outline-none"
                  >
                    <option value="ALL">Categoría: Todas</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="w-full min-h-touch px-2.5 py-2 text-xs rounded-xl border border-lumo-niebla bg-white focus:border-lumo-ambar outline-none"
                  >
                    <option value="ALL">Prioridad: Todas</option>
                    <option value="P1">P1 (4+ Señales)</option>
                    <option value="P2">P2 (2-3 Señales)</option>
                    <option value="DISCARD">Descartar (&lt; 2)</option>
                  </select>
                </div>

                {/* Stage Filter */}
                <div>
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full min-h-touch px-2.5 py-2 text-xs rounded-xl border border-lumo-niebla bg-white focus:border-lumo-ambar outline-none"
                  >
                    <option value="ALL">Etapa: Todas</option>
                    {stages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Filter */}
                <div>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value as typeof filterSource)}
                    aria-label="Origen"
                    className="w-full min-h-touch px-2.5 py-2 text-xs rounded-xl border border-lumo-niebla bg-white focus:border-lumo-ambar outline-none"
                  >
                    <option value="ALL">Origen: Todos</option>
                    <option value="BARBARA">Bárbara</option>
                    <option value="LUIS">Luis</option>
                    <option value="REFERRAL">Referido</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View Mode: Kanban Grid */}
            {viewMode === 'kanban' ? (
              <>
              {/* Phones: one stage at a time, so the 6 columns never squeeze */}
              <div className="md:hidden flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Etapas">
                {stages.map((st) => {
                  const n = filteredProspects.filter((p) => p.stage === st.key).length;
                  return (
                    <button key={st.key} type="button" role="tab" aria-selected={mobileStage === st.key} onClick={() => setMobileStage(st.key)}
                      className={`shrink-0 min-h-touch px-3 rounded-xl text-xs font-bold border ${mobileStage === st.key ? 'bg-lumo-noche text-white border-lumo-noche' : 'bg-white text-slate-700 border-slate-200'}`}>
                      {st.label.replace(/^\d\.\s*/, '')} <span className="tabular-nums opacity-70">{n}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 pb-4">
                {stages.map((st) => {
                  const stageLeads = filteredProspects.filter((p) => p.stage === st.key);
                  return (
                    <div
                      key={st.key}
                      className={`bg-white rounded-2xl p-3 border border-lumo-niebla shadow-xs flex-col min-w-0 ${mobileStage === st.key ? 'flex' : 'hidden'} md:flex`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-lumo-niebla">
                        <span className="text-xs font-black text-lumo-noche">{st.label}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="space-y-2 flex-1">
                        {stageLeads.length === 0 && (
                          <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            Sin negocios en esta etapa
                          </div>
                        )}
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md ${
                              lead.priority === 'P1'
                                ? 'border-amber-300 bg-amber-50/40'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-bold text-lumo-noche leading-tight">
                                {lead.businessName}
                              </span>
                              {lead.priority === 'P1' && (
                                <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                                  <Flame className="w-3 h-3 text-red-600" />
                                  P1
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-lumo-pizarra mb-2">
                              {lead.city}, TX · {lead.category}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                              <span className="font-bold text-lumo-noche">Señales: {lead.totalScore}/8</span>
                              <span
                                className={
                                  lead.followUpCount >= 3 ? 'text-red-600 font-bold' : ''
                                }
                              >
                                Seg: {lead.followUpCount}/3
                              </span>
                            </div>
                            <div className="mt-2"><CadenceBadge lead={lead} now={now} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            ) : (
              /* View Mode: Compact Touch List (Optimized for Mobile) */
              <div className="bg-white rounded-3xl border border-lumo-niebla shadow-xs overflow-hidden divide-y divide-slate-100">
                {filteredProspects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-lumo-pizarra">
                    No se encontraron prospectos con los filtros aplicados.
                  </div>
                ) : (
                  filteredProspects.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-lumo-noche">{lead.businessName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              lead.priority === 'P1'
                                ? 'bg-red-100 text-red-800'
                                : lead.priority === 'P2'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.priority}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {lead.stage}
                          </span>
                        </div>
                        <p className="text-xs text-lumo-pizarra">
                          {lead.ownerName || 'Dueño por confirmar'} · {lead.phone} · {lead.city}, TX ({lead.category})
                        </p>
                        <CadenceBadge lead={lead} now={now} />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs font-black text-lumo-noche bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          {lead.totalScore}/8 Señales
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="min-h-touch px-3 py-1.5 rounded-xl bg-lumo-noche text-white font-bold text-xs"
                        >
                          Ver Ficha
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFICIAL SCRIPTS & TIMINGS (DOC 03) */}
        {activeTab === 'scripts' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-heading font-black text-lumo-noche">
                Guiones Oficiales y Tiempos de Seguimiento (Doc 03 Sección 1.2)
              </h3>
              <p className="text-xs text-lumo-pizarra mt-1">
                Copiar y personalizar uno por uno, a mano (por WhatsApp, Instagram o Facebook). Sin spam ni mensajes masivos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visitas Luis */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Visitas en Persona (Luis Barbera) — Máximo 5 minutos con teléfono en mano
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.visitasLuis({
                          dueno: 'Roberto',
                          tipoDeNegocio: 'barbería Midland TX',
                          negocio: 'El Rey Barbershop',
                          queLeFalta: 'pocas fotos y sin botón de reservar cita',
                        }),
                        'visita_luis'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'visita_luis' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-amber-200">
                  {OFFICIAL_SCRIPTS.visitasLuis({
                    dueno: '[dueño]',
                    tipoDeNegocio: '[tipo de negocio]',
                    negocio: '[negocio]',
                    queLeFalta: '[lo que le falta]',
                  })}
                </p>
              </div>

              {/* Primer Contacto */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-lumo-niebla space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Primer Contacto (WhatsApp / Redes)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.primerContacto({
                          nombre: 'Carlos',
                          negocio: 'Taquería El Primo',
                          queLeFalta: 'sale con pocas fotos y sin botón de llamada directo',
                        }),
                        'script_primer_contacto'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'script_primer_contacto' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200">
                  {OFFICIAL_SCRIPTS.primerContacto({
                    nombre: '[nombre]',
                    negocio: '[negocio]',
                    queLeFalta: '[lo que le falta]',
                  })}
                </p>
              </div>

              {/* Envío del Diagnóstico */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-lumo-niebla space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Envío del Diagnóstico (24 horas después)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.envioDiagnostico({
                          nombre: 'Carlos',
                        }),
                        'script_envio_diag'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'script_envio_diag' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200">
                  {OFFICIAL_SCRIPTS.envioDiagnostico({
                    nombre: '[nombre]',
                  })}
                </p>
              </div>

              {/* Seguimiento 1 (2 días) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-lumo-niebla space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Seguimiento 1 (2 días)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.seguimiento1({ nombre: 'Carlos' }),
                        'script_seg_1'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'script_seg_1' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200">
                  {OFFICIAL_SCRIPTS.seguimiento1({ nombre: '[nombre]' })}
                </p>
              </div>

              {/* Seguimiento 2 (5 días) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-lumo-niebla space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                    Seguimiento 2 (5 días)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.seguimiento2({
                          nombre: 'Carlos',
                          tipoDeNegocio: 'barbería en Midland',
                          dia: 'este jueves',
                        }),
                        'script_seg_2'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'script_seg_2' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200">
                  {OFFICIAL_SCRIPTS.seguimiento2({
                    nombre: '[nombre]',
                    tipoDeNegocio: '[tipo de negocio]',
                    dia: '[día]',
                  })}
                </p>
              </div>

              {/* Seguimiento 3 (1 semana, último) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-lumo-niebla space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wide">
                    Seguimiento 3 (1 semana, último — Estricto TCPA)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.seguimiento3({
                          nombre: 'José',
                          negocio: 'Barbería La Frontera',
                        }),
                        'script_seg_3'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'script_seg_3' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200">
                  {OFFICIAL_SCRIPTS.seguimiento3({
                    nombre: '[nombre]',
                    negocio: '[negocio]',
                  })}
                </p>
              </div>

              {/* Propuesta (mismo día de la reunión) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-lumo-niebla space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Propuesta (mismo día de la reunión)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        OFFICIAL_SCRIPTS.propuesta({ nombre: 'Roberto' }),
                        'script_propuesta'
                      )
                    }
                    className="min-h-touch px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScript === 'script_propuesta' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded-xl border border-slate-200">
                  {OFFICIAL_SCRIPTS.propuesta({ nombre: '[nombre]' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LAS 8 OBJECIONES EXACTAS (DOC 03 SECCIÓN 1.3) */}
        {activeTab === 'objections' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-lumo-niebla shadow-xs space-y-4">
            <div>
              <h3 className="text-xl font-heading font-black text-lumo-noche">
                Manejo de las 8 Objeciones Oficiales (Doc 03 Sección 1.3)
              </h3>
              <p className="text-xs text-lumo-pizarra mt-1">
                Lo que dice el dueño vs la respuesta exacta aprobada para el equipo de Lumo HQ.
              </p>
            </div>

            <ObjectionFinder />
          </div>
        )}
      </main>

      {/* LEAD DETAIL MODAL (WITH INTERACTIVE CHECKBOXES & 1-PAGE DIAGNOSIS LINK) */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-lumo-niebla">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Lote {selectedLead.batchNumber} · {selectedLead.category}
                </span>
                <h3 className="text-xl font-heading font-black text-lumo-noche mt-1">
                  {selectedLead.businessName}
                </h3>
                <p className="text-xs text-lumo-pizarra">
                  {selectedLead.ownerName || 'Dueño por confirmar'} · Tel: {selectedLead.phone} · {selectedLead.city}, TX
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="min-h-touch min-w-touch p-2 text-slate-400 hover:text-lumo-noche rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={diagnosisUrl ?? '#'}
                aria-disabled={!diagnosisUrl}
                target="_blank"
                className="min-h-touch inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche text-xs font-black shadow-xs transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Ver Ficha de Diagnóstico Imprimible</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </Link>

              <button
                type="button"
                onClick={() => handleFollowUp(selectedLead.id)}
                className="min-h-touch inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-lumo-noche text-xs font-bold transition-transform active:scale-95"
              >
                <Clock className="w-4 h-4 text-lumo-ambar" />
                <span>Registrar Seguimiento ({selectedLead.followUpCount}/3)</span>
              </button>
            </div>

            <ContactLauncher
              lead={selectedLead}
              now={now}
              onSent={(m) => handleSent(selectedLead, m)}
              onOptOut={(v) => handleOptOut(selectedLead, v)}
            />

            <details className="pt-2 border-t border-slate-200">
              <summary className="min-h-touch flex items-center justify-between gap-2 text-xs font-black text-lumo-noche cursor-pointer">Objeciones durante la llamada<span className="text-[11px] font-bold text-lumo-pizarra">buscar respuesta</span></summary>
              <div className="pt-2"><ObjectionFinder compact /></div>
            </details>

            {/* Stage Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Etapa del Pipeline:
                </label>
                <select
                  value={selectedLead.stage}
                  onChange={(e) => handleUpdateStage(selectedLead.id, e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none font-bold bg-white"
                >
                  {stages.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Canal Preferido de Contacto:
                </label>
                <select
                  value={selectedLead.preferredChannel || 'WhatsApp'}
                  onChange={(e) =>
                    setSelectedLead({ ...selectedLead, preferredChannel: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none font-bold bg-white"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Llamada">Llamada Telefónica</option>
                  <option value="Presencial">Visita Presencial</option>
                </select>
              </div>
            </div>

            {/* 8 Signals Interactive Checkboxes (ZERO EMOJIS - 100% SVG) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between font-black text-lumo-noche">
                <span>Evaluación de 8 Señales (Toca para actualizar en vivo):</span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-black">
                  {selectedLead.totalScore} de 8 puntos ({selectedLead.priority})
                </span>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200">
                {SIGNAL_DEFS.map((sig) => {
                  const isActive = Boolean(selectedLead.signals[sig.key]);
                  return (
                    <button
                      key={sig.key}
                      type="button"
                      onClick={() => handleToggleSignal(sig.key)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                        isActive
                          ? 'bg-amber-50/70 border-amber-300 text-lumo-noche font-medium'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {isActive ? (
                        <CheckSquare className="w-4 h-4 text-lumo-ambar shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className="text-xs leading-snug">{sig.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                Prioridad recalculada en tiempo real:{' '}
                <strong className="text-lumo-noche">
                  {selectedLead.priority === 'P1'
                    ? 'P1 (4+ puntos: Contactar primero)'
                    : selectedLead.priority === 'P2'
                    ? 'P2 (2 o 3 puntos: Segunda tanda)'
                    : 'Descartar (Menos de 2 puntos)'}
                </strong>
              </p>
            </div>

            {/* 2 Mandatory Qualification Questions (Doc 03) */}
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3">
              <span className="text-xs font-black text-amber-900 block">
                2 Preguntas Obligatorias de Calificación (Doc 03 Sección 1.1):
              </span>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    1. &ldquo;¿De dónde vienen tus clientes hoy?&rdquo;
                  </label>
                  <input
                    type="text"
                    value={selectedLead.questionSource || ''}
                    onChange={(e) =>
                      setSelectedLead({ ...selectedLead, questionSource: e.target.value })
                    }
                    placeholder="Ej. Boca en boca, pasan por enfrente, Facebook..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-lumo-ambar"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    2. &ldquo;¿Qué pasa cuando te llaman y estás ocupado?&rdquo;
                  </label>
                  <input
                    type="text"
                    value={selectedLead.questionMissedCalls || ''}
                    onChange={(e) =>
                      setSelectedLead({ ...selectedLead, questionMissedCalls: e.target.value })
                    }
                    placeholder="Ej. Suena y se pierde, llaman a otro, entra buzón..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-lumo-ambar"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveLeadDetails}
                  disabled={savingDetails}
                  className="px-3 py-1.5 bg-lumo-noche text-white text-[11px] font-bold rounded-lg transition-transform active:scale-95"
                >
                  {savingDetails ? 'Guardando...' : 'Guardar Respuestas'}
                </button>
              </div>
            </div>

            {/* Internal Notes with Timestamp */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-lumo-noche">
                Notas Internas de Seguimiento:
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  placeholder="Agregar nota rápida con fecha..."
                  className="grow px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-lumo-ambar"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="min-h-touch px-4 py-2 bg-lumo-noche text-white rounded-xl text-xs font-bold"
                >
                  Agregar
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {(selectedLead.contactNotes || []).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Sin notas registradas aún.</p>
                ) : (
                  (selectedLead.contactNotes || []).map((note, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-mono"
                    >
                      {note}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isImporting && <CsvImport batch={selectedBatch} onClose={() => setIsImporting(false)} onDone={fetchLeads} />}

      {/* CREATE LEAD MODAL */}
      {isCreatingLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-lumo-niebla">
              <h3 className="font-heading font-black text-lg text-lumo-noche">
                Agregar Negocio a Lote {selectedBatch}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingLead(false)}
                className="text-slate-400 hover:text-lumo-noche p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Nombre Comercial del Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="Ej. Barbería Los Compadres"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Nombre del Dueño
                </label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="Ej. Mateo Morales"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-lumo-noche mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(432) 555-0199"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none focus:border-lumo-ambar"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">Ciudad *</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none bg-white"
                  >
                    <option value="Midland">Midland, TX</option>
                    <option value="Odessa">Odessa, TX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-lumo-noche mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-lumo-niebla outline-none bg-white"
                  >
                    <option value="Barbería">Barbería</option>
                    <option value="Taquería y Comida">Taquería y Comida</option>
                    <option value="Taller Mecánico">Taller Mecánico</option>
                    <option value="Clínica y Spa">Clínica y Spa</option>
                    <option value="Servicios Locales">Servicios Locales</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-touch py-3 rounded-xl bg-lumo-ambar hover:bg-lumo-brillo text-lumo-noche font-black text-xs transition-transform active:scale-95 shadow-md"
                >
                  Guardar en Lote {selectedBatch}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

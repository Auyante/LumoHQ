'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { ShieldCheck, ShieldAlert, Ban, LogIn, UserX, RefreshCw, Unlock, LogOut, Link2 } from 'lucide-react';

interface Entry { seq: number; ts: string; type: string; severity: 'INFO' | 'WARN' | 'CRITICAL'; ip: string; actor?: string; detail: string; hash: string }
interface Block { ip: string; until: string; strikes: number; reason: string; since: string; active: boolean }
interface SocUser { id: string; name: string; email: string; role: string; active: boolean; lastLoginAt?: string; sessionVersion: number }
interface SocData {
  integrity: { intact: boolean; brokenAt?: number; total: number };
  stats: { loginOk: number; loginFail: number; attacks: number; denied: number };
  blocks: Block[]; entries: Entry[]; users: SocUser[];
}

const SEV_STYLE: Record<Entry['severity'], string> = {
  INFO: 'bg-slate-100 text-slate-700',
  WARN: 'bg-amber-100 text-amber-900',
  CRITICAL: 'bg-red-100 text-red-800',
};
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('es-US', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function SecurityPage() {
  const [data, setData] = useState<SocData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'WARN' | 'CRITICAL'>('ALL');
  const [busy, setBusy] = useState<string | null>(null);
  const [links, setLinks] = useState<{ clientId: string; businessName: string; url: string }[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security', { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status === 403 ? 'Tu usuario no tiene acceso a esta sección.' : 'No se pudo cargar el registro.');
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // live: refresh every 15 s
    return () => clearInterval(t);
  }, [load]);

  const act = async (label: string, body: Record<string, unknown>, url = '/api/admin/security', method = 'POST') => {
    setBusy(label);
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError(d.error || 'La acción falló.');
      await load();
    } finally {
      setBusy(null);
    }
  };

  const purgeAll = async () => {
    if (!confirm('Esto cierra la sesión de TODOS, incluida la tuya. ¿Continuar?')) return;
    await act('purge', { action: 'purge-sessions' });
    window.location.href = '/login';
  };

  const loadLinks = async () => {
    const res = await fetch('/api/admin/portal-link', { cache: 'no-store' });
    if (res.ok) setLinks((await res.json()).links);
  };

  const entries = useMemo(
    () => (data?.entries ?? []).filter((e) => filter === 'ALL' || (filter === 'WARN' ? e.severity !== 'INFO' : e.severity === 'CRITICAL')),
    [data, filter]
  );
  const activeBlocks = (data?.blocks ?? []).filter((b) => b.active);

  return (
    <div className="min-h-screen bg-slate-100 text-lumo-noche pb-16 antialiased">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading">Centro de seguridad</h1>
            <p className="text-sm text-lumo-pizarra">Registro de auditoría, IPs bloqueadas y sesiones. Se actualiza cada 15 segundos.</p>
          </div>
          <button type="button" onClick={load} className="min-h-touch inline-flex items-center gap-2 px-4 rounded-xl bg-white border border-slate-300 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Actualizar
          </button>
        </header>

        {error && <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</p>}

        {data && (
          <>
            <div className={`flex items-start gap-3 p-4 rounded-2xl border ${data.integrity.intact ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-300'}`}>
              {data.integrity.intact ? <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" /> : <ShieldAlert className="w-6 h-6 text-red-700 shrink-0" aria-hidden="true" />}
              <div className="text-sm">
                <strong>{data.integrity.intact ? 'Registro íntegro' : `Registro alterado desde la entrada #${data.integrity.brokenAt}`}</strong>
                <p className="text-slate-700">
                  {data.integrity.total} entradas encadenadas con SHA-256. {data.integrity.intact
                    ? 'Ninguna fue editada ni borrada.'
                    : 'Alguien editó o borró entradas del archivo. Revisa el servidor.'}
                </p>
              </div>
            </div>

            <section aria-label="Últimas 24 horas" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Inicios de sesión', value: data.stats.loginOk, Icon: LogIn, tone: 'text-emerald-700' },
                { label: 'Intentos fallidos', value: data.stats.loginFail, Icon: UserX, tone: 'text-amber-700' },
                { label: 'Ataques neutralizados', value: data.stats.attacks, Icon: ShieldAlert, tone: 'text-red-700' },
                { label: 'IPs bloqueadas ahora', value: activeBlocks.length, Icon: Ban, tone: 'text-red-700' },
              ].map(({ label, value, Icon, tone }) => (
                <div key={label} className="bg-white rounded-2xl border border-lumo-niebla p-4 flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${tone}`} aria-hidden="true" />
                  <div><p className="text-2xl font-black tabular-nums">{value}</p><p className="text-xs font-bold text-lumo-pizarra">{label} · 24 h</p></div>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-2xl border border-lumo-niebla p-4 space-y-3">
                <h2 className="font-black text-lg">IPs bloqueadas</h2>
                {data.blocks.length === 0 && <p className="text-sm text-lumo-pizarra">Ninguna IP bloqueada.</p>}
                <ul className="divide-y divide-slate-100">
                  {data.blocks.map((b) => (
                    <li key={b.ip} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div className="text-sm min-w-0">
                        <p className="font-mono font-bold break-all">{b.ip}</p>
                        <p className="text-xs text-lumo-pizarra">{b.reason} · falta {b.strikes} · {b.active ? `hasta ${fmt(b.until)}` : 'vencido'}</p>
                      </div>
                      <button type="button" disabled={busy !== null} onClick={() => act(`unblock-${b.ip}`, { action: 'unblock-ip', ip: b.ip })}
                        className="min-h-touch inline-flex items-center gap-2 px-3 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 self-start sm:self-auto">
                        <Unlock className="w-4 h-4" aria-hidden="true" /> Desbloquear
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white rounded-2xl border border-lumo-niebla p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-black text-lg">Sesiones del equipo</h2>
                  <button type="button" onClick={purgeAll} disabled={busy !== null}
                    className="min-h-touch inline-flex items-center gap-2 px-3 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 disabled:opacity-50">
                    <LogOut className="w-4 h-4" aria-hidden="true" /> Cerrar todas
                  </button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {data.users.map((u) => (
                    <li key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div className="text-sm min-w-0">
                        <p className="font-bold">{u.name} <span className="text-xs font-bold text-lumo-pizarra">{u.role}</span>{!u.active && <span className="ml-2 text-xs font-bold text-red-700">suspendida</span>}</p>
                        <p className="text-xs text-lumo-pizarra break-all">{u.email} · último acceso {fmt(u.lastLoginAt)}</p>
                      </div>
                      <button type="button" disabled={busy !== null} onClick={() => act(`revoke-${u.id}`, { userId: u.id, action: 'revoke-sessions' }, '/api/admin/users', 'PATCH')}
                        className="min-h-touch inline-flex items-center gap-2 px-3 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 self-start sm:self-auto">
                        <LogOut className="w-4 h-4" aria-hidden="true" /> Revocar sesiones
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="bg-white rounded-2xl border border-lumo-niebla p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-black text-lg">Enlaces privados del portal de clientes</h2>
                <button type="button" onClick={loadLinks} className="min-h-touch inline-flex items-center gap-2 px-3 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50">
                  <Link2 className="w-4 h-4" aria-hidden="true" /> Mostrar enlaces
                </button>
              </div>
              <p className="text-xs text-lumo-pizarra">Cada cliente entra con su enlace. Sin la clave del enlace, el portal no acepta cambios ni fotos.</p>
              {links && (
                <ul className="divide-y divide-slate-100">
                  {links.map((l) => (
                    <li key={l.clientId} className="py-2 text-sm">
                      <p className="font-bold">{l.businessName}</p>
                      <input readOnly value={l.url} onFocus={(e) => e.currentTarget.select()} aria-label={`Enlace de ${l.businessName}`}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs" />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-lumo-niebla p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="font-black text-lg">Registro de auditoría</h2>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold" role="group" aria-label="Filtrar por gravedad">
                  {(['ALL', 'WARN', 'CRITICAL'] as const).map((f) => (
                    <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                      className={`min-h-[36px] px-3 rounded-lg ${filter === f ? 'bg-lumo-noche text-white' : 'text-slate-600'}`}>
                      {f === 'ALL' ? 'Todo' : f === 'WARN' ? 'Avisos' : 'Críticos'}
                    </button>
                  ))}
                </div>
              </div>
              {entries.length === 0 && <p className="text-sm text-lumo-pizarra">Sin entradas para este filtro.</p>}
              <ol className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <li key={e.seq} className="py-2.5 grid grid-cols-1 md:grid-cols-[150px_120px_minmax(0,1fr)] gap-1 md:gap-3 text-sm">
                    <span className="text-xs text-lumo-pizarra tabular-nums">#{e.seq} · {fmt(e.ts)}</span>
                    <span><span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${SEV_STYLE[e.severity]}`}>{e.type}</span></span>
                    <span className="min-w-0 break-words">
                      {e.detail}
                      <span className="block text-xs text-lumo-pizarra">IP {e.ip}{e.actor ? ` · ${e.actor}` : ''} · <span className="font-mono">{e.hash.slice(0, 12)}</span></span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

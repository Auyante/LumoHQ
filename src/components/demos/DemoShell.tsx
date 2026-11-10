'use client';

import React, { useEffect, useState } from 'react';
import { MasterTemplateView } from '@/components/template/MasterTemplateView';
import { DemoBadge } from './DemoBadge';
import { BarberOwnerPanel } from './BarberOwnerPanel';
import { TaqueriaOwnerPanel } from './TaqueriaOwnerPanel';
import { SEED_APPOINTMENTS, SEED_ORDERS } from './demo-seeds';
import { DEMO_KEYS, demoId, pushDemo, useDemoList, type DemoAppointment, type DemoOrder } from '@/lib/demo-store';
import { barberiaDemoConfig, taqueriaDemoConfig } from '@/lib/demo-data';
import type { Locale } from '@/lib/types';

type View = 'client' | 'owner';
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Demo page with two views: the customer's site and the owner's panel. What the visitor books or orders
 * in the customer view is saved in this browser and shows up in the owner view right away.
 * The view lives in the URL (?vista=dueno) so the owner view can be opened in a second tab.
 */
export function DemoShell({ kind }: { kind: 'barberia' | 'taqueria' }) {
  const config = kind === 'barberia' ? barberiaDemoConfig : taqueriaDemoConfig;
  const [view, setView] = useState<View>('client');
  const [locale, setLocale] = useState<Locale>('es');
  const [citas] = useDemoList<DemoAppointment>(DEMO_KEYS.citas, SEED_APPOINTMENTS);
  const [pedidos] = useDemoList<DemoOrder>(DEMO_KEYS.pedidos, SEED_ORDERS);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('vista') === 'dueno') setView('owner');
  }, []);

  const change = (v: View) => {
    setView(v);
    const url = new URL(window.location.href);
    if (v === 'owner') url.searchParams.set('vista', 'dueno'); else url.searchParams.delete('vista');
    window.history.replaceState(null, '', url);
    window.scrollTo({ top: 0 });
  };

  const count = kind === 'barberia'
    ? citas.filter((a) => a.status === 'Pendiente' || a.status === 'Confirmada').length
    : pedidos.filter((o) => ['Nueva', 'En preparación', 'Lista'].includes(o.status)).length;

  const ownerToggle = {
    view,
    ownerLabel: kind === 'barberia' ? (locale === 'es' ? 'Vista del dueño: agenda' : 'Owner view: bookings') : (locale === 'es' ? 'Vista del dueño: comandas' : 'Owner view: orders'),
    count,
    onChange: change,
  };

  if (view === 'owner') {
    return (
      <div className="min-h-screen bg-slate-100">
        <DemoBadge businessName={config.name} locale={locale} onToggleLocale={() => setLocale(locale === 'es' ? 'en' : 'es')} ownerToggle={ownerToggle} />
        {kind === 'barberia' ? <BarberOwnerPanel businessName={config.name} /> : <TaqueriaOwnerPanel businessName={config.name} />}
      </div>
    );
  }

  return (
    <MasterTemplateView
      config={config}
      ownerToggle={ownerToggle}
      locale={locale}
      onLocaleChange={setLocale}
      onBooked={kind === 'barberia' ? (b) => pushDemo<DemoAppointment>(DEMO_KEYS.citas, {
        id: demoId('cita'), ...b, date: todayIso(), status: 'Pendiente', smsReminder: 'programado', createdAt: new Date().toISOString(), fromDemo: true,
      }, SEED_APPOINTMENTS) : undefined}
      onOrdered={(o) => pushDemo<DemoOrder>(DEMO_KEYS.pedidos, {
        id: demoId('pedido'), ...o, status: 'Nueva', createdAt: new Date().toISOString(), fromDemo: true,
      }, SEED_ORDERS)}
    />
  );
}

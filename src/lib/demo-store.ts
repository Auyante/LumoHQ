'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Demo-only storage for the barbershop and taquería owner views. Lives in the visitor's browser
 * (localStorage), never reaches the server, and holds only what the visitor typed in the demo.
 * Updates reach every open view of the same browser right away: same tab through a custom event,
 * other tabs through the `storage` event.
 */

export type AppointmentStatus = 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

export interface DemoAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: string;
  barber: string;
  date: string;   // YYYY-MM-DD
  time: string;   // "3:30 PM"
  price: number;
  status: AppointmentStatus;
  smsReminder: 'enviado' | 'programado';
  createdAt: string;
  fromDemo?: boolean; // booked by the visitor (vs. sample data)
}

export type OrderStatus = 'Nueva' | 'En preparación' | 'Lista' | 'Entregada' | 'Cancelada';

export interface DemoOrder {
  id: string;
  customerName: string;
  type: 'pickup' | 'delivery';
  lines: { name: string; qty: number; price: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  fromDemo?: boolean;
}

export const DEMO_KEYS = { citas: 'lumo-demo:barberia:citas:v1', pedidos: 'lumo-demo:taqueria:pedidos:v1' } as const;
type Key = (typeof DEMO_KEYS)[keyof typeof DEMO_KEYS];

const MAX_ITEMS = 50;
const EVENT = 'lumo-demo-change';

const APPT_STATUS: AppointmentStatus[] = ['Pendiente', 'Confirmada', 'Completada', 'Cancelada'];
const ORDER_STATUS: OrderStatus[] = ['Nueva', 'En preparación', 'Lista', 'Entregada', 'Cancelada'];

const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 100_000 ? v : 0);

/** Storage can be edited by hand: keep only well-formed records. */
function cleanAppointment(x: unknown): DemoAppointment | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (!str(o.id) || !APPT_STATUS.includes(o.status as AppointmentStatus)) return null;
  return {
    id: str(o.id, 60), clientName: str(o.clientName, 60), clientPhone: str(o.clientPhone, 25), service: str(o.service, 80),
    barber: str(o.barber, 60), date: str(o.date, 10), time: str(o.time, 10), price: num(o.price),
    status: o.status as AppointmentStatus, smsReminder: o.smsReminder === 'enviado' ? 'enviado' : 'programado',
    createdAt: str(o.createdAt, 30), fromDemo: o.fromDemo === true,
  };
}

function cleanOrder(x: unknown): DemoOrder | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (!str(o.id) || !ORDER_STATUS.includes(o.status as OrderStatus) || !Array.isArray(o.lines)) return null;
  const lines = o.lines.slice(0, 20).map((l) => {
    const r = (l ?? {}) as Record<string, unknown>;
    return { name: str(r.name, 80), qty: Math.min(99, Math.floor(num(r.qty))), price: num(r.price) };
  }).filter((l) => l.name && l.qty > 0);
  return {
    id: str(o.id, 60), customerName: str(o.customerName, 60), type: o.type === 'delivery' ? 'delivery' : 'pickup',
    lines, total: num(o.total), status: o.status as OrderStatus, createdAt: str(o.createdAt, 30), fromDemo: o.fromDemo === true,
  };
}

const CLEAN: Record<Key, (x: unknown) => unknown> = { [DEMO_KEYS.citas]: cleanAppointment, [DEMO_KEYS.pedidos]: cleanOrder };

// Cache per key so useSyncExternalStore gets a stable snapshot between changes.
const cache = new Map<string, { raw: string | null; value: unknown[] }>();

function read<T>(key: Key): T[] | null {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(key); } catch { return (cache.get(key)?.value as T[] | undefined) ?? null; }
  if (raw === null) return null; // nothing saved yet: caller shows the seed
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T[];
  let value: unknown[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) value = parsed.map(CLEAN[key]).filter(Boolean).slice(0, MAX_ITEMS);
  } catch { /* corrupt: treat as empty */ }
  cache.set(key, { raw, value });
  return value as T[];
}

function write<T>(key: Key, list: T[]) {
  const value = list.slice(0, MAX_ITEMS);
  const raw = JSON.stringify(value);
  cache.set(key, { raw, value });
  try { window.localStorage.setItem(key, raw); } catch { /* private mode: keep it in memory */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith('lumo-demo:')) cb(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(EVENT, cb);
  return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(EVENT, cb); };
}

/**
 * A demo list shared by every view of this browser. `seed` shows until the visitor changes something.
 * Returns [list, update, reset].
 */
export function useDemoList<T extends { id: string }>(key: Key, seed: T[]) {
  const list = useSyncExternalStore(subscribe, () => read<T>(key) ?? seed, () => seed);
  const update = useCallback((fn: (prev: T[]) => T[]) => write(key, fn(read<T>(key) ?? seed)), [key, seed]);
  const reset = useCallback(() => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    cache.delete(key);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  }, [key]);
  return [list, update, reset] as const;
}

/** Add one record from a demo form (newest first). */
export function pushDemo<T extends { id: string }>(key: Key, item: T, seed: T[]) {
  write(key, [item, ...(read<T>(key) ?? seed)]);
}

export const demoId = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

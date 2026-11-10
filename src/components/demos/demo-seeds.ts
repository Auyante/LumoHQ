import type { DemoAppointment, DemoOrder } from '@/lib/demo-store';

/** Sample data for the demo owner views. Fictional people; (432) 555-01xx numbers are reserved for fiction. */

export const DEMO_BARBERS = [
  { name: 'Mateo', roleEs: 'Fades y navaja', roleEn: 'Fades and razor' },
  { name: 'Iván', roleEs: 'Cortes clásicos y barba', roleEn: 'Classic cuts and beard' },
  { name: 'El primero disponible', roleEs: 'Te atienden más rápido', roleEn: 'Fastest service' },
] as const;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const SEED_APPOINTMENTS: DemoAppointment[] = [
  { id: 'seed-a1', clientName: 'Ramiro G.', clientPhone: '(432) 555-0192', service: 'Corte Clásico & Fade Moderno', barber: 'Mateo', date: today(), time: '11:30 AM', price: 35, status: 'Confirmada', smsReminder: 'enviado', createdAt: ago(600) },
  { id: 'seed-a2', clientName: 'Miguel R.', clientPhone: '(432) 555-0144', service: 'Arreglo de Barba & Toalla Caliente', barber: 'Iván', date: today(), time: '1:00 PM', price: 25, status: 'Confirmada', smsReminder: 'enviado', createdAt: ago(540) },
  { id: 'seed-a3', clientName: 'Roberto D.', clientPhone: '(432) 555-0188', service: 'El Combo Rey (Corte + Barba Completa)', barber: 'Mateo', date: today(), time: '2:15 PM', price: 55, status: 'Pendiente', smsReminder: 'programado', createdAt: ago(90) },
];

export const SEED_ORDERS: DemoOrder[] = [
  { id: 'seed-o1', customerName: 'Martín G.', type: 'pickup', lines: [{ name: 'Orden de 5 Tacos al Pastor con Piña', qty: 2, price: 12.5 }], total: 25, status: 'En preparación', createdAt: ago(12) },
  { id: 'seed-o2', customerName: 'Lupita S.', type: 'delivery', lines: [{ name: 'Tacos de Asada al Carbón (Orden de 4)', qty: 1, price: 13.5 }, { name: 'Orden de 5 Tacos al Pastor con Piña', qty: 1, price: 12.5 }], total: 26, status: 'Nueva', createdAt: ago(3) },
];

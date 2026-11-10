import type { Metadata } from 'next';
import { DemoShell } from '@/components/demos/DemoShell';

export const metadata: Metadata = {
  title: 'Demo: Barbería con Reservas | Lumo HQ Midland, TX',
  description: 'Ejemplo de página bilingüe para barberías con reservas en un toque, y la agenda que ve el dueño.',
};

export default function BarberiaDemoPage() {
  return <DemoShell kind="barberia" />;
}

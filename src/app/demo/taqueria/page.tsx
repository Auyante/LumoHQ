import type { Metadata } from 'next';
import { DemoShell } from '@/components/demos/DemoShell';

export const metadata: Metadata = {
  title: 'Demo Oficial: Taquería con Menú Digital | Lumo HQ Odessa, TX',
  description:
    'Ejemplo interactivo de página web bilingüe para taquerías con menú digital, pedidos por WhatsApp y las comandas que ve el dueño.',
};

export default function TaqueriaDemoPage() {
  return <DemoShell kind="taqueria" />;
}

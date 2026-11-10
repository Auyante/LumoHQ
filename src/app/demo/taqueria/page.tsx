import { MasterTemplateView } from '@/components/template/MasterTemplateView';
import { taqueriaDemoConfig } from '@/lib/demo-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo Oficial: Taquería con Menú Digital | Lumo HQ Odessa, TX',
  description:
    'Ejemplo interactivo de página web bilingüe para taquerías y restaurantes con menú digital interactivo, pedidos por WhatsApp Business y sticker QR de mostrador.',
};

export default function TaqueriaDemoPage() {
  return <MasterTemplateView config={taqueriaDemoConfig} />;
}


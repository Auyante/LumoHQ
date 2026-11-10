'use client';

import { Printer } from 'lucide-react';

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()}
      className="min-h-touch inline-flex items-center gap-2 px-4 rounded-xl bg-lumo-noche text-white text-sm font-bold hover:bg-black">
      <Printer className="w-4 h-4" aria-hidden="true" />{label}
    </button>
  );
}

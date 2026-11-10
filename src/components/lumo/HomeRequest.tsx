'use client';

import { useI18n } from '@/lib/i18n';
import { COPY } from '@/components/talonario/copy';
import { Request } from '@/components/talonario/Landing';

/**
 * The diagnosis form from the talonario landing, for the new homepage.
 * A client wrapper because the copy object holds functions, which can't
 * cross from a server component. talonario.css styles it under `.tal`.
 */
export function HomeRequest({ className }: { className?: string }) {
  const { locale } = useI18n();
  return (
    <div className={`tal ${className ?? ''}`} lang={locale}>
      <Request t={COPY[locale]} />
    </div>
  );
}

import type { Metadata } from 'next';

// Team sign-in is not linked from the public site; keep it out of search engines too.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

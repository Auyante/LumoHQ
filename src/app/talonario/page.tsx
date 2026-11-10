import type { Metadata } from 'next';
import { Landing } from '@/components/talonario/Landing';

/** Previous homepage ("talonario de notas"), kept reachable after the 3D + bento redesign. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function TalonarioPage() {
  return <Landing />;
}

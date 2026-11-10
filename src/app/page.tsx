import { Hero } from '@/components/landing/Hero';
import { InteractiveContactDemo } from '@/components/landing/InteractiveContactDemo';
import { PackagesSection } from '@/components/landing/PackagesSection';
import { BeforeAfterSlider } from '@/components/landing/BeforeAfterSlider';
import { DiagnosisForm } from '@/components/landing/DiagnosisForm';
import { FaqSection } from '@/components/landing/FaqSection';
import { FtcDisclaimer } from '@/components/landing/FtcDisclaimer';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <InteractiveContactDemo />
      <PackagesSection />
      <BeforeAfterSlider />
      <DiagnosisForm />
      <FaqSection />
      <FtcDisclaimer />
    </div>
  );
}

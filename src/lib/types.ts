export type Locale = 'es' | 'en';

export type ExtraChannel = 'booking' | 'meta' | 'whatsapp';

export interface DiagnosisFormData {
  ownerName: string;
  businessName: string;
  phone: string;
  preferredChannel: 'whatsapp' | 'sms' | 'call';
  sourceOfCustomers: string;
  currentContactMethod: string;
  tcpaConsent: boolean;
}

export interface PackageFeature {
  text: string;
  highlight?: boolean;
}

export interface PricingTier {
  id: 'founder' | 'base' | 'premium';
  name: string;
  badge?: string;
  price: string;
  priceBreakdown: string;
  monthly: string;
  forWhom: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
}


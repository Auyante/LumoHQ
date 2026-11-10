import { z } from 'zod';

// Zod Schema for Master Template Configuration to prevent SSTI and Parameter Tampering
export const TemplateConfigSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug debe ser alfanumérico en minúsculas con guiones'),
  businessType: z.enum(['barberia', 'salon', 'taqueria', 'restaurante', 'taller', 'contratista']),
  name: z.string().min(2).max(100),
  taglineEs: z.string().max(160),
  taglineEn: z.string().max(160),
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Color hexadecimal inválido'),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Color hexadecimal inválido'),
  
  // NAP — Must match Google Business Profile exactly
  nap: z.object({
    businessName: z.string().min(2),
    address: z.string().min(5),
    city: z.string().default('Midland'),
    state: z.string().default('TX'),
    zipCode: z.string().regex(/^\d{5}$/, 'Código postal de 5 dígitos'),
    phone: z.string().regex(/^[+0-9\s().-]+$/, 'Teléfono válido'),
    googleMapsEmbedUrl: z.string().url().refine((url) => url.startsWith('https://www.google.com/maps') || url.startsWith('https://maps.google.com'), {
      message: 'Solo se permiten URLs oficiales de Google Maps',
    }),
  }),

  // Toggle buttons
  buttons: z.object({
    hasCall: z.boolean().default(true),
    hasSms: z.boolean().default(true),
    hasBooking: z.boolean().default(false),
    bookingUrl: z.string().url().optional(),
    hasWhatsApp: z.boolean().default(false),
    whatsAppNumber: z.string().optional(),
    hasMeta: z.boolean().default(false),
    metaUrl: z.string().url().optional(),
  }),

  // Schedule with holidays
  schedule: z.object({
    weekdays: z.string(),
    saturday: z.string(),
    sunday: z.string(),
    holidaysNotice: z.string().optional(),
  }),

  // Items (Services or Menu)
  items: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      nameEs: z.string(),
      nameEn: z.string(),
      descriptionEs: z.string().optional(),
      descriptionEn: z.string().optional(),
      price: z.number().positive(),
      imageUrl: z.string().optional(),
      popular: z.boolean().default(false),
    })
  ),

  // Google Reviews QR Kit
  reviews: z.object({
    googleReviewShortLink: z.string().url().refine(
      (url) => url.startsWith('https://g.page/') || url.startsWith('https://search.google.com/local/writereview'),
      { message: 'El enlace de reseñas debe ser un enlace legítimo de Google' }
    ),
    rating: z.number().min(1).max(5).default(4.9),
    reviewCount: z.number().int().nonnegative().default(30),
  }),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;


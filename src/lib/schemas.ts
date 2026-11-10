import { z } from 'zod';

export const DiagnosisSchema = z.object({
  ownerName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'Nombre demasiado largo')
    .transform((str) => str.replace(/[<>]/g, '').trim()),
  businessName: z
    .string()
    .min(2, 'El nombre del negocio es obligatorio')
    .max(100, 'Nombre demasiado largo')
    .transform((str) => str.replace(/[<>]/g, '').trim()),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'Teléfono inválido')
    .regex(/^[+0-9\s().-]+$/, 'Formato de teléfono no válido'),
  preferredChannel: z.enum(['whatsapp', 'sms', 'call']),
  sourceOfCustomers: z.string().min(2, 'Selecciona una opción'),
  currentContactMethod: z.string().min(2, 'Selecciona una opción'),
  tcpaConsent: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar el consentimiento TCPA' }),
  }),
});

export type DiagnosisInput = z.infer<typeof DiagnosisSchema>;

export const ContractSigningSchema = z.object({
  businessName: z
    .string()
    .min(2, 'El nombre del negocio es requerido')
    .max(120)
    .transform((s) => s.replace(/[<>]/g, '').trim()),
  ownerName: z
    .string()
    .min(2, 'El nombre del titular es requerido')
    .max(100)
    .transform((s) => s.replace(/[<>]/g, '').trim()),
  address: z
    .string()
    .min(5, 'La dirección física del negocio es requerida')
    .max(150)
    .transform((s) => s.replace(/[<>]/g, '').trim()),
  city: z
    .string()
    .min(2, 'La ciudad es requerida')
    .max(80)
    .default('Midland')
    .transform((s) => s.replace(/[<>]/g, '').trim()),
  state: z.string().default('TX'),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Código postal de EE. UU. inválido (5 dígitos)'),
  phone: z
    .string()
    .min(10, 'Teléfono de 10 dígitos mínimo')
    .regex(/^[+0-9\s().-]+$/, 'Formato de teléfono no válido'),
  email: z.string().email('Correo electrónico no válido'),
  packageType: z.enum(['FOUNDER', 'BASE', 'PREMIUM']),
  extraChannel: z.enum(['BOOKING', 'IG_FB', 'WHATSAPP']),
  signatureDataUrl: z
    .string()
    .min(50, 'Se requiere una firma electrónica trazada en pantalla'),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }),
  }),
  agree5050: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la regla de pago 50/50' }),
  }),
  agreeDay1Pause: z.literal(true, {
    errorMap: () => ({
      message: 'Debes aceptar la regla de pausa de 5 días hábiles',
    }),
  }),
  agreeZeroPasswords: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política Cero Contraseñas' }),
  }),
  agreeCopyright: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar los derechos sobre fotos y logos' }),
  }),
  agreeFtcTcpa: z.literal(true, {
    errorMap: () => ({
      message: 'Debes confirmar el cumplimiento de las normas FTC y TCPA',
    }),
  }),
  leadId: z.string().optional(),
});

export type ContractSigningInput = z.infer<typeof ContractSigningSchema>;

export const CreateCheckoutSessionSchema = z.object({
  contractId: z.string().min(1, 'El ID de contrato es obligatorio'),
  contractSha256: z
    .string()
    .length(64, 'Hash SHA-256 de contrato inválido'),
  packageType: z.enum(['FOUNDER', 'BASE', 'PREMIUM']),
  extraChannel: z.enum(['BOOKING', 'IG_FB', 'WHATSAPP']),
  clientEmail: z.string().email(),
  businessName: z.string().min(1),
  // Parameter tampering test defense: if the client attempts to pass a custom amount, the server rejects it or overrides with PRICING_CONSTANTS
  claimedDepositAmount: z.number().optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;



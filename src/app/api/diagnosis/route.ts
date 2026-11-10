import { NextResponse } from 'next/server';
import { z } from 'zod';

// Zod Schema with strict input validation
const diagnosisSchema = z.object({
  ownerName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'Nombre demasiado largo')
    .transform((str) => str.replace(/[<>]/g, '').trim()), // basic XSS sanitize
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

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    // 1. IP extraction & Rate Limiting (max 5 requests per 10 minutes per IP)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const now = Date.now();
    const clientRate = rateLimitMap.get(ip);

    if (clientRate) {
      if (now < clientRate.expiresAt) {
        if (clientRate.count >= 5) {
          return NextResponse.json(
            { error: 'Demasiadas solicitudes. Por favor espera unos minutos antes de intentar de nuevo.' },
            { status: 429 }
          );
        }
        clientRate.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    }

    // 2. Parse & validate body
    const json = await request.json();
    const result = diagnosisSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos no válidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Log the valid audit request (In Sprint 4 this attaches to Prisma Prospect Lot)
    console.log('[LUMO HQ] Diagnóstico Solicitado:', {
      businessName: data.businessName,
      ownerName: data.ownerName,
      phone: data.phone,
      channel: data.preferredChannel,
      timestamp: new Date().toISOString(),
      ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico registrado con éxito. Se entregará en 24h hábiles.',
      lead: {
        businessName: data.businessName,
        phone: data.phone,
      },
    });
  } catch (error) {
    console.error('[API Diagnosis Error]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la solicitud' },
      { status: 500 }
    );
  }
}


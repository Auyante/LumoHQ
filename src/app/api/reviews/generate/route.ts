import { NextResponse } from 'next/server';
import { z } from 'zod';

// Allowed Google Review URL prefixes to block Open Redirect attacks
const ALLOWED_GOOGLE_REVIEW_PREFIXES = [
  'https://g.page/',
  'https://search.google.com/local/writereview',
  'https://maps.app.goo.gl/',
  'https://goo.gl/maps/',
];

const ReviewKitSchema = z.object({
  businessName: z
    .string()
    .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
    .max(80, 'Nombre demasiado largo')
    .transform((str) => str.replace(/[<>]/g, '').trim()), // Anti-XSS
  googleUrlOrPlaceId: z
    .string()
    .min(5, 'URL o Place ID obligatorio')
    .transform((str) => str.trim()),
  ownerName: z
    .string()
    .max(60)
    .optional()
    .transform((str) => (str ? str.replace(/[<>]/g, '').trim() : '')),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = ReviewKitSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos no válidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { businessName, googleUrlOrPlaceId, ownerName } = result.data;

    // Validate against Open Redirect vulnerabilities
    let shortReviewLink = '';
    const isUrl = googleUrlOrPlaceId.startsWith('http://') || googleUrlOrPlaceId.startsWith('https://');

    if (isUrl) {
      const isAllowed = ALLOWED_GOOGLE_REVIEW_PREFIXES.some((prefix) =>
        googleUrlOrPlaceId.startsWith(prefix)
      );

      if (!isAllowed) {
        return NextResponse.json(
          {
            error:
              'URL no permitida. Por seguridad solo se aceptan enlaces oficiales de Google Reviews (g.page, search.google.com o maps.app.goo.gl).',
          },
          { status: 400 }
        );
      }
      shortReviewLink = googleUrlOrPlaceId;
    } else {
      // It's a Google Place ID (e.g. ChIJN1t_tDeuEmsRUsoyG83frY4)
      const sanitizedPlaceId = googleUrlOrPlaceId.replace(/[^a-zA-Z0-9_-]/g, '');
      shortReviewLink = `https://search.google.com/local/writereview?placeid=${sanitizedPlaceId}`;
    }

    // Pre-approved message templates from Ops Manual (Document 03)
    const templates = [
      {
        id: 'msg-direct-whatsapp',
        title: 'Mensaje 1: Después de atender a un cliente satisfecho (WhatsApp/SMS)',
        text: `Hola! Muchas gracias por visitarnos en ${businessName}. Nos ayuda muchísimo una opinión en Google para que más vecinos nos conozcan. Si tienes 30 segundos, nos dejas tu reseña aquí: ${shortReviewLink} — Te lo agradecemos mucho!`,
      },
      {
        id: 'msg-service-done',
        title: 'Mensaje 2: Para clientes habituales o al entregar un trabajo',
        text: `Hola! Qué tal quedó todo en ${businessName}? Tu opinión nos ayuda a seguir mejorando. Nos apoyarías con una calificación rápida en Google? Solo toca aquí: ${shortReviewLink} Muchas gracias por tu preferencia!`,
      },
      {
        id: 'msg-bilingual',
        title: 'Mensaje 3: Bilingüe (Inglés y Español)',
        text: `Thank you for visiting ${businessName}! If you enjoyed your visit, please leave us a quick review on Google: ${shortReviewLink} / Gracias por tu visita! Si te gustó el servicio, déjanos tu reseña en Google: ${shortReviewLink}`,
      },
    ];

    // QR Code generation URL using standard secure QR renderer
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      shortReviewLink
    )}&margin=10`;

    return NextResponse.json({
      success: true,
      businessName,
      shortReviewLink,
      qrCodeUrl,
      templates,
      ftcComplianceNote:
        'Aviso FTC: Todo mensaje debe enviarse de forma manual y uno a uno a clientes reales atendidos. Se prohíbe ofrecer incentivos, rifas o descuentos a cambio de 5 estrellas.',
    });
  } catch (error) {
    console.error('[API Reviews Kit Error]', error);
    return NextResponse.json(
      { error: 'Error interno al generar el kit de reseñas' },
      { status: 500 }
    );
  }
}


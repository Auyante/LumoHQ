import { NextRequest, NextResponse } from 'next/server';
import { CreateCheckoutSessionSchema } from '@/lib/schemas';
import { getPackageAmounts, createStripeDepositSession } from '@/lib/stripe';
import { contractStore } from '@/lib/contract-store';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';
import { honeypotTripped } from '@/lib/security/guard';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 10 per minute per IP
    const clientIp = getClientIp(req.headers);

    const rateLimit = checkRateLimit(`checkout-create:${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera antes de continuar.' },
        { status: 429 }
      );
    }

    // 2. Body validation
    const rawBody = await req.json();
    const trap = honeypotTripped(req, rawBody, 'checkout');
    if (trap) return trap;
    const parsed = CreateCheckoutSessionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos de sesión de pago inválidos.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3. Verify contract existence in store
    const contract = contractStore.get(data.contractId);
    if (!contract) {
      return NextResponse.json(
        {
          error:
            'No se encontró el contrato previo. No es posible procesar un pago sin firma previa.',
        },
        { status: 404 }
      );
    }

    // 4. Verify SHA-256 cryptographic integrity
    if (contract.signedResult.documentHashSha256 !== data.contractSha256) {
      return NextResponse.json(
        {
          error:
            'Falla de integridad criptográfica: El hash SHA-256 no coincide con el contrato firmado.',
        },
        { status: 403 }
      );
    }

    // 5. Parameter Tampering Protection (OWASP ASVS 5.1)
    const officialPricing = getPackageAmounts(data.packageType);
    if (
      data.claimedDepositAmount !== undefined &&
      Math.abs(data.claimedDepositAmount - officialPricing.deposit) > 0.001
    ) {
      return NextResponse.json(
        {
          error:
            'Intento de manipulación de precio detectado (Parameter Tampering). El pago debe coincidir exactamente con el anticipo legal.',
        },
        { status: 400 }
      );
    }

    // 6. Host & URLs construction
    const origin =
      req.headers.get('origin') ||
      req.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
      'http://localhost:3000';

    const successUrl = `${origin}/portal?session_id={CHECKOUT_SESSION_ID}&contract_id=${data.contractId}&payment_status=success`;
    const cancelUrl = `${origin}/checkout?canceled=true&contract_id=${data.contractId}`;

    // 7. Create Stripe Checkout Session
    const sessionResult = await createStripeDepositSession({
      contractId: data.contractId,
      contractSha256: data.contractSha256,
      packageType: data.packageType,
      extraChannel: data.extraChannel,
      businessName: data.businessName,
      clientEmail: data.clientEmail,
      successUrl,
      cancelUrl,
    });

    // Update contract status
    contractStore.updateStatus(
      data.contractId,
      'SIGNED_PENDING_PAYMENT',
      sessionResult.sessionId
    );

    return NextResponse.json({
      success: true,
      sessionId: sessionResult.sessionId,
      checkoutUrl: sessionResult.checkoutUrl,
      depositAmount: sessionResult.depositAmount,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Error interno al generar la sesión de pago de Stripe.' },
      { status: 500 }
    );
  }
}


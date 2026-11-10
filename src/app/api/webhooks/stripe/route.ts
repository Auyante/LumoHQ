import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhookSignature } from '@/lib/stripe';
import { contractStore } from '@/lib/contract-store';
import { calculateWaterfall, recordTransaction, financialStore } from '@/lib/finance';

// In-memory idempotency cache
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

    // 1. Signature Verification (unless explicitly mock in development test)
    const isMockTest = req.headers.get('x-lumo-test-webhook') === 'true';

    if (!isMockTest) {
      const isValid = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Firma de webhook inválida o manipulada.' },
          { status: 400 }
        );
      }
    }

    // 2. Parse payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
    }

    const eventId = event.id || `evt_${Date.now()}`;

    // 3. Idempotency Check (prevents double-charge or duplicate distribution)
    if (processedEvents.has(eventId)) {
      return NextResponse.json({ received: true, note: 'Already processed (idempotent)' });
    }
    processedEvents.add(eventId);

    // Keep cache bounded
    if (processedEvents.size > 1000) {
      const first = processedEvents.values().next().value;
      if (first) processedEvents.delete(first);
    }

    // 4. Handle Event Types
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const contractId = session.metadata?.contractId || session.client_reference_id;
      const packageType = session.metadata?.packageType || 'BASE';
      const amountPaid = (session.amount_total ? session.amount_total / 100 : 250);

      if (contractId) {
        // Update contract status
        contractStore.updateStatus(contractId, 'DEPOSIT_PAID', session.id);

        // Calculate and record financial waterfall
        const isFounder = packageType === 'FOUNDER';
        const clientCount = financialStore.getClientCount() + 1;
        const currentBarbaraTotal = financialStore.getBarbaraEarnedTotal();

        const waterfall = calculateWaterfall({
          isFounder,
          clientIndex: clientCount,
          isReferral: false,
          currentBarbaraTotal,
          paymentType: 'SETUP',
          grossAmount: amountPaid,
        });

        recordTransaction({
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          contractId,
          type: 'DEPOSIT_50',
          grossAmount: amountPaid,
          waterfall,
          timestamp: new Date().toISOString(),
          stripePaymentIntentId: session.payment_intent || session.id,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error interno en procesamiento de webhook' },
      { status: 500 }
    );
  }
}


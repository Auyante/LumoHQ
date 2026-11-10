import { NextRequest, NextResponse } from 'next/server';
import { clientProjectStore } from '@/lib/client-portal';
import { calculateWaterfall, recordTransaction, financialStore } from '@/lib/finance';
import { getPackageAmounts } from '@/lib/stripe';
import { requireClientKey } from '@/lib/security/guard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, clientWrittenConfirmation, key } = body;
    const denied = requireClientKey(req, clientId, key);
    if (denied) return denied;

    if (!clientId) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 });
    }

    if (!clientWrittenConfirmation) {
      return NextResponse.json(
        { error: 'Se requiere confirmación escrita de aprobación final (Día 5).' },
        { status: 400 }
      );
    }

    // Idempotent: a second approval must never record a second final payment.
    if (clientProjectStore.getById(clientId)?.finalPaid) {
      return NextResponse.json({ error: 'Esta entrega ya fue aprobada.' }, { status: 409 });
    }

    const res = clientProjectStore.approveDelivery(clientId);
    if (!res.success || !res.project) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const project = res.project;
    const pricing = getPackageAmounts(project.packageType);

    // Record the 50% final payment in the financial waterfall
    const isFounder = project.packageType === 'FOUNDER';
    const clientCount = financialStore.getClientCount();
    const currentBarbaraTotal = financialStore.getBarbaraEarnedTotal();

    const waterfall = calculateWaterfall({
      isFounder,
      clientIndex: clientCount,
      isReferral: false,
      currentBarbaraTotal,
      paymentType: 'SETUP',
      grossAmount: pricing.final,
    });

    recordTransaction({
      id: `tx_${Date.now()}_final`,
      contractId: project.contractId,
      type: 'FINAL_50',
      grossAmount: pricing.final,
      waterfall,
      timestamp: new Date().toISOString(),
      description: `Pago final 50% aprobado en Día 5 por ${project.businessName}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Entrega técnica aprobada exitosamente por el cliente.',
      project,
      finalAmountCharged: pricing.final,
      monthlySubscriptionActivated: pricing.monthly,
      salesTaxEstimate: pricing.salesTax,
    });
  } catch (error) {
    console.error('Delivery approval error:', error);
    return NextResponse.json({ error: 'Error interno en aprobación final' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { ContractSigningSchema } from '@/lib/schemas';
import { generateContractLegalText, calculateContractSha256 } from '@/lib/contracts';
import { getPackageAmounts, PRICING_CONSTANTS } from '@/lib/stripe';
import { contractStore } from '@/lib/contract-store';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 10 attempts per minute per IP
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(`contract-sign:${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Por favor espera antes de intentar firmar de nuevo.',
        },
        { status: 429 }
      );
    }

    // 2. Body parsing and schema validation
    const rawBody = await req.json();
    const parsed = ContractSigningSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos para la firma del contrato.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3. Founder slot enforcement (Max 2 slots in Sprint 1)
    if (data.packageType === 'FOUNDER') {
      const activeFounderCount = contractStore.countFounderContracts();
      if (activeFounderCount >= PRICING_CONSTANTS.FOUNDER_MAX_SLOTS) {
        return NextResponse.json(
          {
            error:
              'Los 2 cupos exclusivos de Cliente Fundador ($250 USD) ya han sido reclamados. Por favor selecciona el Paquete Base ($500 USD).',
            code: 'FOUNDER_SLOTS_FULL',
          },
          { status: 409 }
        );
      }
    }

    // 4. Server-enforced pricing (Zero Trust / Anti Parameter Tampering)
    const pricing = getPackageAmounts(data.packageType);

    // 5. Generate legal contract text and Texas UETA clauses
    const contractLegal = generateContractLegalText({
      businessName: data.businessName,
      ownerName: data.ownerName,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email,
      packageType: data.packageType,
      extraChannel: data.extraChannel,
      depositAmount: pricing.deposit,
      finalAmount: pricing.final,
      monthlyAmount: pricing.monthly,
    });

    const signedAtUtc = new Date().toISOString();

    // 6. Calculate immutable SHA-256 Hash
    const documentHashSha256 = calculateContractSha256(
      contractLegal.text,
      data.ownerName,
      clientIp,
      signedAtUtc
    );

    const contractId = `ct_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 7. Store in state store
    contractStore.save({
      id: contractId,
      leadId: data.leadId,
      data: {
        businessName: data.businessName,
        ownerName: data.ownerName,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        email: data.email,
        packageType: data.packageType,
        extraChannel: data.extraChannel,
        depositAmount: pricing.deposit,
        finalAmount: pricing.final,
        monthlyAmount: pricing.monthly,
      },
      signedResult: {
        contractText: contractLegal.text,
        contractHtml: contractLegal.html,
        signerName: data.ownerName,
        signerIp: clientIp,
        signedAtUtc,
        documentHashSha256,
        signatureDataUrl: data.signatureDataUrl,
        includesPortfolioPermission: contractLegal.includesPortfolioPermission,
        includesTestimonialPermission: contractLegal.includesTestimonialPermission,
      },
      status: 'SIGNED_PENDING_PAYMENT',
      createdAt: signedAtUtc,
      updatedAt: signedAtUtc,
    });

    return NextResponse.json({
      success: true,
      contractId,
      documentHashSha256,
      signedAtUtc,
      depositAmount: pricing.deposit,
      finalAmount: pricing.final,
      monthlyAmount: pricing.monthly,
      salesTaxEstimate: pricing.salesTax,
      contractHtml: contractLegal.html,
    });
  } catch (error) {
    console.error('Contract signing error:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar y firmar el contrato legal.' },
      { status: 500 }
    );
  }
}


/**
 * Stripe Service & Texas Sales Tax Computation
 * Strict adherence to Document 04 (LUMO-FIN-004) & OWASP ASVS Level 2
 */

import crypto from 'crypto';

export const TEXAS_SALES_TAX_RATE = 0.0825; // Texas State (6.25%) + Midland City (2.00%) = 8.25%
export const DATA_PROCESSING_TAXABLE_RATIO = 0.80; // Texas exempts 20% of data processing/hosting services

export const PRICING_CONSTANTS = {
  FOUNDER_SETUP: 250.0,
  FOUNDER_DEPOSIT: 125.0,
  FOUNDER_FINAL: 125.0,
  FOUNDER_MAX_SLOTS: 2,

  REGULAR_SETUP: 500.0,
  REGULAR_DEPOSIT: 250.0,
  REGULAR_FINAL: 250.0,

  PREMIUM_SETUP: 1000.0,
  PREMIUM_DEPOSIT: 500.0,
  PREMIUM_FINAL: 500.0,

  MONTHLY_SUBSCRIPTION: 100.0,
  MONTHLY_SALES_TAX_ESTIMATE: 6.6,

  EXTRA_CHANGE_FEE: 25.0,
  MAJOR_WORK_MINIMUM_FEE: 75.0,
};

/**
 * Computes exact Texas sales tax for monthly hosting/software maintenance
 * @param monthlyAmount Subtotal (e.g. $100.00)
 * @returns Tax amount in USD (e.g. ~$6.60 on $100)
 */
export function calculateTexasSalesTax(monthlyAmount: number = 100.0): number {
  const taxableBase = monthlyAmount * DATA_PROCESSING_TAXABLE_RATIO;
  const tax = taxableBase * TEXAS_SALES_TAX_RATE;
  return Math.round(tax * 100) / 100; // Returns 6.60
}

/**
 * Enforces Server-Side Source of Truth for Package Pricing
 * Parameter Tampering Defense (OWASP ASVS 5.1)
 */
export function getPackageAmounts(packageType: 'FOUNDER' | 'BASE' | 'PREMIUM') {
  switch (packageType) {
    case 'FOUNDER':
      return {
        setup: PRICING_CONSTANTS.FOUNDER_SETUP,
        deposit: PRICING_CONSTANTS.FOUNDER_DEPOSIT,
        final: PRICING_CONSTANTS.FOUNDER_FINAL,
        monthly: PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION,
        salesTax: calculateTexasSalesTax(PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION),
        totalMonthlyWithTax:
          PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION +
          calculateTexasSalesTax(PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION),
      };
    case 'BASE':
      return {
        setup: PRICING_CONSTANTS.REGULAR_SETUP,
        deposit: PRICING_CONSTANTS.REGULAR_DEPOSIT,
        final: PRICING_CONSTANTS.REGULAR_FINAL,
        monthly: PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION,
        salesTax: calculateTexasSalesTax(PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION),
        totalMonthlyWithTax:
          PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION +
          calculateTexasSalesTax(PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION),
      };
    case 'PREMIUM':
      return {
        setup: PRICING_CONSTANTS.PREMIUM_SETUP,
        deposit: PRICING_CONSTANTS.PREMIUM_DEPOSIT,
        final: PRICING_CONSTANTS.PREMIUM_FINAL,
        monthly: PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION,
        salesTax: calculateTexasSalesTax(PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION),
        totalMonthlyWithTax:
          PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION +
          calculateTexasSalesTax(PRICING_CONSTANTS.MONTHLY_SUBSCRIPTION),
      };
  }
}

export interface CreateCheckoutParams {
  contractId: string;
  contractSha256: string;
  packageType: 'FOUNDER' | 'BASE' | 'PREMIUM';
  extraChannel: 'BOOKING' | 'IG_FB' | 'WHATSAPP';
  businessName: string;
  clientEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Server-side creation of Stripe Checkout Session
 * Blindado contra Parameter Tampering
 */
export async function createStripeDepositSession(params: CreateCheckoutParams): Promise<{
  sessionId: string;
  checkoutUrl: string;
  depositAmount: number;
}> {
  const pricing = getPackageAmounts(params.packageType);
  const depositCents = Math.round(pricing.deposit * 100);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  // Real Stripe Integration if live key is provided
  if (stripeSecretKey && !stripeSecretKey.startsWith('mock_')) {
    const formData = new URLSearchParams();
    formData.append('payment_method_types[0]', 'card');
    formData.append('mode', 'payment');
    formData.append('customer_email', params.clientEmail);
    formData.append('success_url', params.successUrl);
    formData.append('cancel_url', params.cancelUrl);
    formData.append('client_reference_id', params.contractId);

    // Line item
    formData.append(
      'line_items[0][price_data][currency]',
      'usd'
    );
    formData.append(
      'line_items[0][price_data][product_data][name]',
      `Anticipo 50% - Paquete ${params.packageType} (${params.businessName})`
    );
    formData.append(
      'line_items[0][price_data][product_data][description]',
      `Anticipo del 50% para activación técnica. Pendiente 50% ($${pricing.final} USD) tras aprobación final en Día 5.`
    );
    formData.append(
      'line_items[0][price_data][unit_amount]',
      depositCents.toString()
    );
    formData.append('line_items[0][quantity]', '1');

    // Security metadata
    formData.append('metadata[contractId]', params.contractId);
    formData.append('metadata[contractSha256]', params.contractSha256);
    formData.append('metadata[packageType]', params.packageType);
    formData.append('metadata[businessName]', params.businessName);
    formData.append('metadata[paymentPhase]', 'DEPOSIT_50');

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Stripe API error: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return {
      sessionId: data.id,
      checkoutUrl: data.url,
      depositAmount: pricing.deposit,
    };
  }

  // Resilient Mock/Dev Session when in local or test mode
  const mockSessionId = `cs_test_${crypto.randomBytes(16).toString('hex')}`;
  const mockCheckoutUrl = `${params.successUrl.split('?')[0]}?session_id=${mockSessionId}&contract_id=${encodeURIComponent(
    params.contractId
  )}&amount=${pricing.deposit}&status=paid_mock`;

  return {
    sessionId: mockSessionId,
    checkoutUrl: mockCheckoutUrl,
    depositAmount: pricing.deposit,
  };
}

/**
 * Verifies Stripe Webhook Signature (anti-replay and tampering)
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = sigPart.split('=')[1];

    // Anti-replay: tolerance 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (Math.abs(now - ts) > 300) {
      return false;
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

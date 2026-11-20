import crypto from 'node:crypto';
import { z } from 'zod';
import { registerService, fail, ok, type Result } from './service';
import { getEventBus } from './event-bus';
import {
  PackageTypeSchema,
  type EventContext,
  type LeadConvertedPayload,
  type PackageType,
} from './events';
import { calculateContractSha256, generateContractLegalText } from '@/lib/contracts';

/**
 * svc-erp-billing — Contratos digitales UETA, facturación y orquestación de pagos.
 * Escucha `crm.lead.converted` y genera el contrato + enlace de anticipo 50%. Al confirmarse el
 * pago emite `billing.deposit.paid`, que despierta producción (Día 0) y finanzas (cascada).
 */

export interface BillingContract {
  id: string;
  leadId: string;
  businessName: string;
  ownerName: string;
  clientNumber: number;
  packageType: PackageType;
  source: 'BARBARA' | 'LUIS' | 'REFERRAL';
  depositAmount: number;
  finalAmount: number;
  monthlyAmount: number;
  depositLink: string;
  documentHashSha256: string;
  status: 'PENDING_SIGNATURE' | 'DEPOSIT_PAID' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export const ConfirmDepositSchema = z.object({
  contractId: z.string().min(1),
  amount: z.number().finite().nonnegative(),
  stripePaymentIntentId: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
});

const g = globalThis as unknown as { __lumoBillingContracts?: Map<string, BillingContract> };
const contracts = (g.__lumoBillingContracts ??= new Map<string, BillingContract>());

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

type Caller = Omit<EventContext, 'source'>;

export const billingService = {
  name: 'svc-erp-billing' as const,

  listContracts(): BillingContract[] {
    return [...contracts.values()];
  },

  getContract(id: string): BillingContract | undefined {
    return contracts.get(id);
  },

  /**
   * Genera el contrato y el enlace de anticipo 50% para un lead recién convertido.
   * El precio siempre se calcula aquí (anti-tampering): fundador $125/$125, regular $250/$250.
   */
  generateContract(p: LeadConvertedPayload, actorId: string, role: string, correlationId?: string): BillingContract {
    const founder = p.packageType === 'FOUNDER';
    const depositAmount = founder ? 125 : 250;
    const finalAmount = founder ? 125 : 250;
    const monthlyAmount = 100;

    const id = newId('ct');
    const ownerName = p.ownerName || p.businessName;
    const slug = p.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cliente';

    const legal = generateContractLegalText({
      businessName: p.businessName,
      ownerName,
      address: 'Midland, TX',
      city: 'Midland',
      state: 'TX',
      zipCode: '79701',
      phone: '(432) 555-0100',
      email: `cliente@${slug}.com`,
      packageType: p.packageType,
      extraChannel: 'BOOKING',
      depositAmount,
      finalAmount,
      monthlyAmount,
    });

    const documentHashSha256 = calculateContractSha256(legal.text, ownerName, 'pending-signature', new Date().toISOString());
    const contract: BillingContract = {
      id,
      leadId: p.leadId,
      businessName: p.businessName,
      ownerName,
      clientNumber: p.clientNumber,
      packageType: p.packageType,
      source: p.source,
      depositAmount,
      finalAmount,
      monthlyAmount,
      depositLink: `/checkout?contractId=${id}`,
      documentHashSha256,
      status: 'PENDING_SIGNATURE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contracts.set(id, contract);

    getEventBus().publish('billing.contract.generated', {
      leadId: p.leadId,
      contractId: id,
      businessName: p.businessName,
      packageType: p.packageType,
      depositAmount,
      finalAmount,
      monthlyAmount,
      depositLink: contract.depositLink,
      documentHashSha256,
    }, { actorId, role, source: 'svc-erp-billing', correlationId });

    return contract;
  },

  /** Confirma el anticipo. Anti-tampering: el importe debe coincidir al centavo con el contrato. */
  confirmDeposit(input: z.infer<typeof ConfirmDepositSchema>, caller: Caller): Result<{ contract: BillingContract; eventId: string }> {
    const contract = contracts.get(input.contractId);
    if (!contract) return fail(404, 'Contrato no encontrado.');

    if (input.amount !== contract.depositAmount) {
      return fail(409, `Importe incorrecto. El anticipo para este contrato es $${contract.depositAmount.toFixed(2)} USD.`);
    }

    if (contract.status === 'DEPOSIT_PAID') {
      return ok({ contract, eventId: 'already-paid' });
    }

    contract.status = 'DEPOSIT_PAID';
    contract.updatedAt = new Date().toISOString();

    const pub = getEventBus().publish('billing.deposit.paid', {
      leadId: contract.leadId,
      contractId: contract.id,
      businessName: contract.businessName,
      clientNumber: contract.clientNumber,
      packageType: contract.packageType,
      source: contract.source,
      amount: input.amount,
      stripePaymentIntentId: input.stripePaymentIntentId,
      paidAt: new Date().toISOString(),
    }, { ...caller, source: 'svc-erp-billing', idempotencyKey: input.idempotencyKey });

    return ok({ contract, eventId: pub.envelope.id });
  },

  schemas: { ConfirmDepositSchema, PackageTypeSchema },
};

getEventBus().subscribe('crm.lead.converted', (env) => {
  billingService.generateContract(env.payload, env.actorId, env.role, env.correlationId);
}, 'svc-erp-billing');

registerService({
  name: 'svc-erp-billing',
  description: 'Contratos UETA (SHA-256), enlace de anticipo 50% y orquestación de pagos.',
  subscribesTo: ['crm.lead.converted'],
  emits: ['billing.contract.generated', 'billing.deposit.paid'],
});

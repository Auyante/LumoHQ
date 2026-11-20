import { z } from 'zod';
import type { WaterfallResult } from '@/lib/finance';

/**
 * LUMO HQ — CONTRATO DE EVENTOS TIPADO (EDA)
 * Fuente de Verdad: Documento 01 (gobernanza) y Documento 03/04 (flujo CRM -> ERP).
 * Cada microservicio sólo conoce estos nombres y payloads: se comunican por el EventBus,
 * nunca llamando directamente a los stores de otro servicio.
 */

export const SERVICE_NAMES = [
  'svc-iam-gateway',
  'svc-crm-sales',
  'svc-erp-finance',
  'svc-erp-ops',
  'svc-erp-billing',
  'svc-erp-bi',
] as const;
export type ServiceName = (typeof SERVICE_NAMES)[number];

export const EVENT_NAMES = [
  'crm.lead.created',
  'crm.lead.converted',
  'billing.contract.generated',
  'billing.deposit.paid',
  'erp.ops.production.started',
  'erp.ops.day1.completed',
  'erp.finance.ledger.posted',
  'erp.bi.mrr.changed',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/* ---------------------------------------------------------------- context */

export interface EventContext {
  /** Idempotency + tracing: an operation keeps one correlation id across every hop. */
  actorId: string;
  role: string;
  source: ServiceName;
  correlationId?: string;
  /** Transactional endpoints require an Idempotency-Key; the bus dedupes on it. */
  idempotencyKey?: string;
}

/* ---------------------------------------------------------------- payloads */

export const PackageTypeSchema = z.enum(['FOUNDER', 'BASE', 'PREMIUM']);
export type PackageType = z.infer<typeof PackageTypeSchema>;

export const LeadSourceSchema = z.enum(['BARBARA', 'LUIS', 'REFERRAL']);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

export interface LeadCreatedPayload {
  leadId: string;
  businessName: string;
  city: string;
  priority: 'P1' | 'P2' | 'DISCARD';
}

export interface LeadConvertedPayload {
  leadId: string;
  businessName: string;
  ownerName?: string;
  clientNumber: number;
  packageType: PackageType;
  source: LeadSource;
  closedAt: string;
}

export interface ContractGeneratedPayload {
  leadId: string;
  contractId: string;
  businessName: string;
  packageType: PackageType;
  depositAmount: number;
  finalAmount: number;
  monthlyAmount: number;
  depositLink: string;
  documentHashSha256: string;
}

export interface DepositPaidPayload {
  leadId: string;
  contractId: string;
  businessName: string;
  clientNumber: number;
  packageType: PackageType;
  source: LeadSource;
  amount: number;
  stripePaymentIntentId: string;
  paidAt: string;
}

export interface ProductionStartedPayload {
  leadId: string;
  contractId: string;
  businessName: string;
  productionId: string;
  day0At: string;
}

export interface Day1CompletedPayload {
  productionId: string;
  businessName: string;
  completedAt: string;
}

export interface LedgerPostedPayload {
  transactionId: string;
  leadId: string;
  businessName: string;
  clientNumber: number;
  waterfall: WaterfallResult;
}

export interface MrrChangedPayload {
  mrr: number;
  closedClients: number;
  changedAt: string;
}

export interface EventPayloadMap {
  'crm.lead.created': LeadCreatedPayload;
  'crm.lead.converted': LeadConvertedPayload;
  'billing.contract.generated': ContractGeneratedPayload;
  'billing.deposit.paid': DepositPaidPayload;
  'erp.ops.production.started': ProductionStartedPayload;
  'erp.ops.day1.completed': Day1CompletedPayload;
  'erp.finance.ledger.posted': LedgerPostedPayload;
  'erp.bi.mrr.changed': MrrChangedPayload;
}

/* ---------------------------------------------------------------- Zod schemas */

const MoneySchema = z.number().finite().nonnegative();
const IsoDateSchema = z.string().datetime();

export const LeadCreatedSchema = z.object({
  leadId: z.string().min(1),
  businessName: z.string().min(1),
  city: z.string().min(1),
  priority: z.enum(['P1', 'P2', 'DISCARD']),
});

export const LeadConvertedSchema = z.object({
  leadId: z.string().min(1),
  businessName: z.string().min(1),
  ownerName: z.string().optional(),
  clientNumber: z.number().int().positive(),
  packageType: PackageTypeSchema,
  source: LeadSourceSchema,
  closedAt: IsoDateSchema,
});

export const ContractGeneratedSchema = z.object({
  leadId: z.string().min(1),
  contractId: z.string().min(1),
  businessName: z.string().min(1),
  packageType: PackageTypeSchema,
  depositAmount: MoneySchema,
  finalAmount: MoneySchema,
  monthlyAmount: MoneySchema,
  depositLink: z.string().min(1),
  documentHashSha256: z.string().length(64),
});

export const DepositPaidSchema = z.object({
  leadId: z.string().min(1),
  contractId: z.string().min(1),
  businessName: z.string().min(1),
  clientNumber: z.number().int().positive(),
  packageType: PackageTypeSchema,
  source: LeadSourceSchema,
  amount: MoneySchema,
  stripePaymentIntentId: z.string().min(1),
  paidAt: IsoDateSchema,
});

export const ProductionStartedSchema = z.object({
  leadId: z.string().min(1),
  contractId: z.string().min(1),
  businessName: z.string().min(1),
  productionId: z.string().min(1),
  day0At: IsoDateSchema,
});

export const Day1CompletedSchema = z.object({
  productionId: z.string().min(1),
  businessName: z.string().min(1),
  completedAt: IsoDateSchema,
});

export const LedgerPostedSchema = z.object({
  transactionId: z.string().min(1),
  leadId: z.string().min(1),
  businessName: z.string().min(1),
  clientNumber: z.number().int().positive(),
  waterfall: z.object({
    grossAmount: MoneySchema,
    stripeFee: MoneySchema,
    barbaraCommission: MoneySchema,
    toolsAndDomain: MoneySchema,
    preFundProfit: MoneySchema,
    businessFund8pct: MoneySchema,
    netDistributable: MoneySchema,
    carlosShare: MoneySchema,
    luisShare: MoneySchema,
    luisTaxReserve: MoneySchema,
    texasSalesTaxCollected: MoneySchema,
  }),
});

export const MrrChangedSchema = z.object({
  mrr: MoneySchema,
  closedClients: z.number().int().nonnegative(),
  changedAt: IsoDateSchema,
});

/** Payload schema by event name, used to validate on the wire and in tests. */
export const EVENT_PAYLOAD_SCHEMAS: { [K in EventName]: z.ZodType<EventPayloadMap[K]> } = {
  'crm.lead.created': LeadCreatedSchema,
  'crm.lead.converted': LeadConvertedSchema,
  'billing.contract.generated': ContractGeneratedSchema,
  'billing.deposit.paid': DepositPaidSchema,
  'erp.ops.production.started': ProductionStartedSchema,
  'erp.ops.day1.completed': Day1CompletedSchema,
  'erp.finance.ledger.posted': LedgerPostedSchema,
  'erp.bi.mrr.changed': MrrChangedSchema,
};

/* ---------------------------------------------------------------- envelope */

export interface EventEnvelope<T = unknown> {
  id: string;
  correlationId: string;
  name: EventName;
  source: ServiceName;
  actorId: string;
  role: string;
  timestampUtc: string;
  payload: T;
  signature: string;
}

export const EventEnvelopeSchema = z.object({
  id: z.string().min(1),
  correlationId: z.string().uuid(),
  name: z.enum(EVENT_NAMES),
  source: z.enum(SERVICE_NAMES),
  actorId: z.string().min(1),
  role: z.string().min(1),
  timestampUtc: IsoDateSchema,
  payload: z.unknown(),
  signature: z.string().min(32),
});

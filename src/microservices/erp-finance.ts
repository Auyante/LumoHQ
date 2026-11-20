import crypto from 'node:crypto';
import { registerService } from './service';
import { getEventBus } from './event-bus';
import {
  calculateMonthlyWaterfall,
  calculateSetupWaterfall,
  financialStore,
  type ExpenseRecord,
  type TransactionRecord,
  type WaterfallResult,
} from '@/lib/finance';

/**
 * svc-erp-finance — Libro Mayor, cascada del Documento 04 y motor fiscal IRS.
 * Escucha `billing.deposit.paid` y ejecuta la cascada al centavo; después emite
 * `erp.finance.ledger.posted` para que BI actualice el MRR. Deduplica por Payment Intent
 * para que ningún asiento contable se registre dos veces.
 */

const g = globalThis as unknown as { __lumoSeenIntents?: Set<string> };
const seenIntents = (g.__lumoSeenIntents ??= new Set<string>());

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

export const financeService = {
  name: 'svc-erp-finance' as const,

  /* --- cascada (Doc 04) --- */
  quoteWaterfall(clientNumber: number, isFounder: boolean, openedByBarbara: boolean, barbaraTotalEarnedSoFar: number): WaterfallResult {
    return calculateSetupWaterfall(clientNumber, isFounder, openedByBarbara, barbaraTotalEarnedSoFar);
  },

  monthlyWaterfall(activeClients: number) {
    return calculateMonthlyWaterfall(activeClients);
  },

  /* --- consulta --- */
  listTransactions(): TransactionRecord[] {
    return financialStore.getTransactions();
  },

  getBarbaraCapStatus() {
    return financialStore.getBarbaraCapStatus();
  },

  getFundTotal(): number {
    return financialStore.getFundTotal();
  },

  getLuisTaxReserveTotal(): number {
    return financialStore.getLuisTaxReserveTotal();
  },

  listExpenses(): ExpenseRecord[] {
    return financialStore.getExpenses();
  },

  /* --- gobernanza de gastos (doble firma >$100) --- */
  createExpense(concept: string, amount: number, requestedBy: ExpenseRecord['requestedBy'], receiptUrl?: string): ExpenseRecord {
    return financialStore.createExpense(concept, amount, requestedBy, receiptUrl);
  },

  approveExpense(id: string, approver: 'ADMIN_LUIS' | 'ADMIN_CARLOS'): boolean {
    return financialStore.approveExpense(id, approver);
  },
};

getEventBus().subscribe('billing.deposit.paid', (env) => {
  const p = env.payload;
  if (seenIntents.has(p.stripePaymentIntentId)) return; // idempotencia de asiento
  seenIntents.add(p.stripePaymentIntentId);

  const isFounder = p.packageType === 'FOUNDER' || p.clientNumber <= 2;
  const openedByBarbara = p.source === 'BARBARA';
  const barbaraEarned = financialStore.getBarbaraEarnedTotal();
  const waterfall = calculateSetupWaterfall(p.clientNumber, isFounder, openedByBarbara, barbaraEarned);

  const tx: TransactionRecord = {
    id: newId('tx'),
    contractId: p.contractId,
    type: 'DEPOSIT_50',
    grossAmount: waterfall.grossAmount,
    waterfall,
    timestamp: p.paidAt,
    stripePaymentIntentId: p.stripePaymentIntentId,
    description: `Anticipo 50% — ${p.businessName}`,
  };
  financialStore.recordTransaction(tx);

  getEventBus().publish('erp.finance.ledger.posted', {
    transactionId: tx.id,
    leadId: p.leadId,
    businessName: p.businessName,
    clientNumber: p.clientNumber,
    waterfall,
  }, { actorId: env.actorId, role: env.role, source: 'svc-erp-finance', correlationId: env.correlationId });
}, 'svc-erp-finance');

registerService({
  name: 'svc-erp-finance',
  description: 'Ledger, cascada 50/50, tope de Bárbara $500, impuestos IRS y doble firma.',
  subscribesTo: ['billing.deposit.paid'],
  emits: ['erp.finance.ledger.posted'],
});

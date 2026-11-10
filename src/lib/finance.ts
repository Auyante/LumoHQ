/**
 * LUMO HQ — MOTOR FINANCIERO Y CASCADA DE REPARTO
 * Fuente de Verdad: Documento 04 (LUMO-FIN-004 · Versión 2)
 */

export interface WaterfallResult {
  grossAmount: number;
  stripeFee: number;
  barbaraCommission: number;
  toolsAndDomain: number;
  preFundProfit: number;
  businessFund8pct: number;
  netDistributable: number;
  carlosShare: number;
  luisShare: number;
  luisTaxReserve: number;
  texasSalesTaxCollected: number;
}

export interface BarbaraCapStatus {
  totalEarned: number;
  cap: number; // $500.00
  capReached: boolean;
  remainingAllowance: number;
}

export interface TransactionRecord {
  id: string;
  contractId?: string;
  type: 'DEPOSIT_50' | 'FINAL_50' | 'MONTHLY_SUBSCRIPTION' | 'EXTRA_CHANGE' | 'EXPENSE';
  grossAmount: number;
  waterfall?: WaterfallResult;
  timestamp: string;
  stripePaymentIntentId?: string;
  description?: string;
}

export interface ExpenseRecord {
  id: string;
  concept: string;
  amount: number;
  requestedBy: 'ADMIN_LUIS' | 'ADMIN_CARLOS' | 'SALES_BARBARA';
  approvedByLuis: boolean;
  approvedByCarlos: boolean;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  receiptUrl?: string;
  createdAt: string;
}

/**
 * Calcula la cascada de reparto exacta al centavo para montajes de clientes
 * @param clientNumber Número de cliente acumulado (1 a 30)
 * @param isFounder Si es cliente fundador (clientes 1 y 2)
 * @param openedByBarbara Si el prospecto fue abierto directamente por Bárbara
 * @param barbaraTotalEarnedSoFar Total que Bárbara ha cobrado hasta la fecha
 */
export function calculateSetupWaterfall(
  clientNumber: number,
  isFounder: boolean,
  openedByBarbara: boolean = true,
  barbaraTotalEarnedSoFar: number = 0
): WaterfallResult {
  const BARBARA_CAP = 500.0;
  const TOOLS_AND_DOMAIN = 20.0;

  if (isFounder || clientNumber <= 2) {
    // 1. Cliente Fundador ($250 USD)
    const grossAmount = 250.0;
    const stripeFee = 8.0;

    let barbaraCommission = 0;
    if (openedByBarbara && barbaraTotalEarnedSoFar < BARBARA_CAP) {
      const allowed = BARBARA_CAP - barbaraTotalEarnedSoFar;
      barbaraCommission = Math.min(25.0, allowed);
    }

    const preFundProfit = grossAmount - stripeFee - barbaraCommission - TOOLS_AND_DOMAIN;
    const businessFund8pct = Math.round(preFundProfit * 0.08); // ~$16
    const netDistributable = preFundProfit - businessFund8pct;
    const carlosShare = Math.round((netDistributable / 2) * 100) / 100; // ~$90
    const luisShare = Math.round((netDistributable / 2) * 100) / 100; // ~$90
    const luisTaxReserve = 25.0; // Apartado el mismo día a cuenta de impuestos

    return {
      grossAmount,
      stripeFee,
      barbaraCommission,
      toolsAndDomain: TOOLS_AND_DOMAIN,
      preFundProfit,
      businessFund8pct,
      netDistributable,
      carlosShare,
      luisShare,
      luisTaxReserve,
      texasSalesTaxCollected: 0,
    };
  }

  // 2. Clientes Regulares ($500 USD)
  const grossAmount = 500.0;
  const stripeFee = 15.0;

  let rawBarbaraRate = 0;
  if (openedByBarbara) {
    if (clientNumber >= 3 && clientNumber <= 5) {
      rawBarbaraRate = 25.0; // Escalonado clientes 3-5
    } else {
      rawBarbaraRate = 15.0; // Clientes 6-30
    }
  }

  let barbaraCommission = 0;
  if (openedByBarbara && barbaraTotalEarnedSoFar < BARBARA_CAP) {
    const allowed = BARBARA_CAP - barbaraTotalEarnedSoFar;
    barbaraCommission = Math.min(rawBarbaraRate, allowed);
  }

  const preFundProfit = grossAmount - stripeFee - barbaraCommission - TOOLS_AND_DOMAIN;
  const businessFund8pct = Math.round(preFundProfit * 0.08); // ~$35 o $36
  const netDistributable = preFundProfit - businessFund8pct;
  const carlosShare = Math.round((netDistributable / 2) * 100) / 100; // ~$202 o $207
  const luisShare = Math.round((netDistributable / 2) * 100) / 100;
  const luisTaxReserve = 60.0; // Apartado el mismo día a cuenta de impuestos

  return {
    grossAmount,
    stripeFee,
    barbaraCommission,
    toolsAndDomain: TOOLS_AND_DOMAIN,
    preFundProfit,
    businessFund8pct,
    netDistributable,
    carlosShare,
    luisShare,
    luisTaxReserve,
    texasSalesTaxCollected: 0,
  };
}

/**
 * Calcula el reparto de la mensualidad recurrente ($100/mes)
 * @param activeClientsCount Total de clientes activos pagando este mes
 */
export function calculateMonthlyWaterfall(activeClientsCount: number): {
  totalRevenue: number;
  stripeAndToolsCost: number;
  businessFund8pct: number;
  carlosShare: number;
  luisShare: number;
  luisTaxReserveTotal: number;
  texasSalesTaxTotal: number;
} {
  const REVENUE_PER_CLIENT = 100.0;
  const TAX_PER_CLIENT = 6.6; // Texas sales tax on hosting
  const TAX_RESERVE_PER_CLIENT = 11.0; // Luis personal taxes

  const totalRevenue = activeClientsCount * REVENUE_PER_CLIENT;
  const texasSalesTaxTotal = activeClientsCount * TAX_PER_CLIENT;
  const luisTaxReserveTotal = activeClientsCount * TAX_RESERVE_PER_CLIENT;

  const stripeAndToolsCost = Math.round(activeClientsCount * 13.9);
  const profitPreFund = totalRevenue - stripeAndToolsCost;
  const businessFund8pct = Math.round(profitPreFund * 0.08);
  const distributable = profitPreFund - businessFund8pct;

  const carlosShare = Math.round((distributable / 2) * 100) / 100;
  const luisShare = Math.round((distributable / 2) * 100) / 100;

  return {
    totalRevenue,
    stripeAndToolsCost,
    businessFund8pct,
    carlosShare,
    luisShare,
    luisTaxReserveTotal,
    texasSalesTaxTotal,
  };
}

export function calculateWaterfall(params: {
  isFounder: boolean;
  clientIndex: number;
  isReferral: boolean;
  currentBarbaraTotal: number;
  paymentType: 'SETUP' | 'MONTHLY';
  grossAmount: number;
}): WaterfallResult {
  const openedByBarbara = !params.isReferral;
  return calculateSetupWaterfall(
    params.clientIndex,
    params.isFounder,
    openedByBarbara,
    params.currentBarbaraTotal
  );
}

// In-memory global financial state store
const globalFinances = globalThis as unknown as {
  __lumo_transactions?: TransactionRecord[];
  __lumo_expenses?: ExpenseRecord[];
  __lumo_client_count?: number;
};

if (!globalFinances.__lumo_transactions) {
  globalFinances.__lumo_transactions = [];
}
if (!globalFinances.__lumo_expenses) {
  globalFinances.__lumo_expenses = [];
}
if (globalFinances.__lumo_client_count === undefined) {
  globalFinances.__lumo_client_count = 0;
}

export const financialStore = {
  getClientCount(): number {
    return globalFinances.__lumo_client_count || 0;
  },

  setClientCount(count: number): void {
    globalFinances.__lumo_client_count = count;
  },

  getBarbaraEarnedTotal(): number {
    let total = 0;
    for (const tx of globalFinances.__lumo_transactions || []) {
      if (tx.waterfall) {
        total += tx.waterfall.barbaraCommission;
      }
    }
    return total;
  },

  getBarbaraCapStatus(): BarbaraCapStatus {
    const totalEarned = this.getBarbaraEarnedTotal();
    const cap = 500.0;
    return {
      totalEarned,
      cap,
      capReached: totalEarned >= cap,
      remainingAllowance: Math.max(0, cap - totalEarned),
    };
  },

  getTransactions(): TransactionRecord[] {
    return globalFinances.__lumo_transactions || [];
  },

  recordTransaction(tx: TransactionRecord): void {
    globalFinances.__lumo_transactions!.unshift(tx);
    if (tx.type === 'DEPOSIT_50') {
      globalFinances.__lumo_client_count = (globalFinances.__lumo_client_count || 0) + 1;
    }
  },

  getFundTotal(): number {
    let fund = 0;
    for (const tx of globalFinances.__lumo_transactions || []) {
      if (tx.waterfall) {
        fund += tx.waterfall.businessFund8pct;
      }
    }
    return fund;
  },

  getLuisTaxReserveTotal(): number {
    let taxes = 0;
    for (const tx of globalFinances.__lumo_transactions || []) {
      if (tx.waterfall) {
        taxes += tx.waterfall.luisTaxReserve;
      }
    }
    return taxes;
  },

  // Expense rule: >$100 requires dual approval
  createExpense(
    concept: string,
    amount: number,
    requestedBy: ExpenseRecord['requestedBy'],
    receiptUrl?: string
  ): ExpenseRecord {
    const requiresDualApproval = amount > 100.0;
    const initialApprovedByLuis = requestedBy === 'ADMIN_LUIS';
    const initialApprovedByCarlos = requestedBy === 'ADMIN_CARLOS';

    const status: ExpenseRecord['status'] =
      requiresDualApproval && (!initialApprovedByLuis || !initialApprovedByCarlos)
        ? 'PENDING_APPROVAL'
        : 'APPROVED';

    const exp: ExpenseRecord = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      concept,
      amount,
      requestedBy,
      approvedByLuis: initialApprovedByLuis,
      approvedByCarlos: initialApprovedByCarlos,
      status,
      receiptUrl,
      createdAt: new Date().toISOString(),
    };

    globalFinances.__lumo_expenses!.unshift(exp);
    return exp;
  },

  approveExpense(id: string, approver: 'ADMIN_LUIS' | 'ADMIN_CARLOS'): boolean {
    const exp = globalFinances.__lumo_expenses!.find((e) => e.id === id);
    if (!exp) return false;

    if (approver === 'ADMIN_LUIS') exp.approvedByLuis = true;
    if (approver === 'ADMIN_CARLOS') exp.approvedByCarlos = true;

    if (exp.amount > 100.0) {
      if (exp.approvedByLuis && exp.approvedByCarlos) {
        exp.status = 'APPROVED';
      }
    } else {
      exp.status = 'APPROVED';
    }
    return true;
  },

  getExpenses(): ExpenseRecord[] {
    return globalFinances.__lumo_expenses || [];
  },
};

export const recordTransaction = financialStore.recordTransaction.bind(financialStore);

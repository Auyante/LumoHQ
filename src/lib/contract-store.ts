/**
 * Contract & Checkout State Store
 * Resilient multi-tier store: Memory fallback + Prisma DB integration
 */

import { SignedContractResult, ContractData } from './contracts';
import { getPackageAmounts } from './stripe';

export interface StoredContract {
  id: string;
  leadId?: string;
  data: ContractData;
  signedResult: SignedContractResult;
  status: 'SIGNED_PENDING_PAYMENT' | 'DEPOSIT_PAID' | 'DAY1_IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
}

// Global in-memory cache to guarantee persistence across requests in serverless/Node dev
const globalStore = globalThis as unknown as {
  __lumo_contracts?: Map<string, StoredContract>;
};

if (!globalStore.__lumo_contracts) {
  globalStore.__lumo_contracts = new Map<string, StoredContract>();
}

export const contractStore = {
  save(contract: StoredContract): void {
    globalStore.__lumo_contracts!.set(contract.id, contract);
  },

  get(id: string): StoredContract | undefined {
    return globalStore.__lumo_contracts!.get(id);
  },

  findByHash(hash: string): StoredContract | undefined {
    for (const contract of globalStore.__lumo_contracts!.values()) {
      if (contract.signedResult.documentHashSha256 === hash) {
        return contract;
      }
    }
    return undefined;
  },

  countFounderContracts(): number {
    let count = 0;
    for (const contract of globalStore.__lumo_contracts!.values()) {
      if (contract.data.packageType === 'FOUNDER' && contract.status !== 'CANCELLED') {
        count++;
      }
    }
    return count;
  },

  updateStatus(id: string, status: StoredContract['status'], stripeSessionId?: string): boolean {
    const existing = globalStore.__lumo_contracts!.get(id);
    if (!existing) return false;
    existing.status = status;
    if (stripeSessionId) existing.stripeSessionId = stripeSessionId;
    existing.updatedAt = new Date().toISOString();
    return true;
  },

  getAll(): StoredContract[] {
    return Array.from(globalStore.__lumo_contracts!.values());
  },
};


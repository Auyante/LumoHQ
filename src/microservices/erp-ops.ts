import crypto from 'node:crypto';
import { registerService, fail, ok, type Result } from './service';
import { getEventBus } from './event-bus';
import type { DepositPaidPayload } from './events';

/**
 * svc-erp-ops — Línea de producción de 5 días hábiles, SLA y Regla de Oro de pausa del reloj.
 * Escucha `billing.deposit.paid` y crea el expediente de producción en Día 0. El reloj de 5 días
 * NO corre hasta que el Día 1 (recolección) esté al 100%; si falta, queda CLOCK_PAUSED_MISSING_DAY1.
 */

export type ClockStatus = 'CLOCK_PAUSED_MISSING_DAY1' | 'RUNNING' | 'COMPLETED';

export interface ProductionProject {
  id: string;
  leadId: string;
  contractId: string;
  businessName: string;
  currentDay: number; // 0 a 5
  clockStatus: ClockStatus;
  day1Complete: boolean;
  day0At: string;
  startedAt?: string;
  approvedAt?: string;
}

const g = globalThis as unknown as { __lumoProduction?: Map<string, ProductionProject> };
const projects = (g.__lumoProduction ??= new Map<string, ProductionProject>());

const newId = () => `prd_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;

export const opsService = {
  name: 'svc-erp-ops' as const,

  listProduction(): ProductionProject[] {
    return [...projects.values()];
  },

  getProduction(id: string): ProductionProject | undefined {
    return projects.get(id);
  },

  /** Día 0: lo llama el suscriptor de billing.deposit.paid. */
  startFromDeposit(p: DepositPaidPayload): ProductionProject {
    const project: ProductionProject = {
      id: newId(),
      leadId: p.leadId,
      contractId: p.contractId,
      businessName: p.businessName,
      currentDay: 0,
      clockStatus: 'CLOCK_PAUSED_MISSING_DAY1',
      day1Complete: false,
      day0At: new Date().toISOString(),
    };
    projects.set(project.id, project);
    return project;
  },

  /** Regla de Oro: sin Día 1 al 100% el reloj sigue pausado. */
  completeDay1(projectId: string, actorId: string, role: string, correlationId?: string): Result<ProductionProject> {
    const p = projects.get(projectId);
    if (!p) return fail(404, 'Expediente de producción no encontrado.');
    if (p.clockStatus === 'COMPLETED') return fail(409, 'El proyecto ya fue entregado.');

    p.day1Complete = true;
    p.clockStatus = 'RUNNING';
    p.currentDay = 1;
    p.startedAt = p.startedAt ?? new Date().toISOString();

    getEventBus().publish('erp.ops.day1.completed', {
      productionId: p.id,
      businessName: p.businessName,
      completedAt: new Date().toISOString(),
    }, { actorId, role, source: 'svc-erp-ops', correlationId });

    return ok(p);
  },

  /** Avanza de día. Se niega si el reloj está pausado por Día 1 incompleto. */
  advanceDay(projectId: string, day: number): Result<ProductionProject> {
    const p = projects.get(projectId);
    if (!p) return fail(404, 'Expediente de producción no encontrado.');
    if (p.clockStatus === 'CLOCK_PAUSED_MISSING_DAY1') {
      return fail(409, 'El reloj está en pausa: falta completar el Checklist del Día 1.');
    }
    if (day < 1 || day > 5) return fail(400, 'Día fuera de rango (1 a 5).');

    p.currentDay = day;
    if (day >= 5) {
      p.clockStatus = 'COMPLETED';
      p.approvedAt = new Date().toISOString();
    }
    return ok(p);
  },
};

getEventBus().subscribe('billing.deposit.paid', (env) => {
  const p = env.payload;
  const project = opsService.startFromDeposit(p);
  getEventBus().publish('erp.ops.production.started', {
    leadId: p.leadId,
    contractId: p.contractId,
    businessName: p.businessName,
    productionId: project.id,
    day0At: project.day0At,
  }, { actorId: env.actorId, role: env.role, source: 'svc-erp-ops', correlationId: env.correlationId });
}, 'svc-erp-ops');

registerService({
  name: 'svc-erp-ops',
  description: 'Línea de 5 días hábiles, SLA y pausa del reloj por Día 1 incompleto.',
  subscribesTo: ['billing.deposit.paid'],
  emits: ['erp.ops.production.started', 'erp.ops.day1.completed'],
});

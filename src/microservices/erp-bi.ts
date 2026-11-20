import { registerService } from './service';
import { getEventBus } from './event-bus';
import { crmStore } from '@/lib/crm';
import { funnel } from '@/lib/crm-engine';
import { retentionStore } from '@/lib/retention';
import {
  MONTHLY_FEE,
  SUNDAY_MILESTONES,
  evaluateRisk1Alert,
  metricsFromFunnel,
  progressPct,
} from '@/lib/sunday-dashboard';

/**
 * svc-erp-bi — Retención mensual, tickets de cambios, tablero dominical y Gates 14/30/60/90.
 * Reacciona a `crm.lead.converted` para mantener el MRR y emite `erp.bi.mrr.changed`.
 */

export const biService = {
  name: 'svc-erp-bi' as const,

  milestones: SUNDAY_MILESTONES,
  monthlyFee: MONTHLY_FEE,
  evaluateRisk: evaluateRisk1Alert,

  dashboard() {
    const leads = crmStore.getAll();
    const reached = funnel(leads).map((s) => s.reached);
    const metrics = metricsFromFunnel(reached);
    const closedClients = metrics.closedClients;
    const mrr = metrics.mrr;

    const milestones = SUNDAY_MILESTONES.map((m) => ({
      day: m.day,
      name: m.name,
      contacts: { target: m.targetContacts, actual: metrics.contacts, pct: progressPct(metrics.contacts, m.targetContacts) },
      diagnoses: { target: m.targetDiagnoses, actual: metrics.diagnoses, pct: progressPct(metrics.diagnoses, m.targetDiagnoses) },
      meetings: { target: m.targetMeetings, actual: metrics.meetings, pct: progressPct(metrics.meetings, m.targetMeetings) },
      closedClients: { target: m.targetClosedClients, actual: closedClients, pct: progressPct(closedClients, m.targetClosedClients) },
      mrr: { target: m.targetMrr, actual: mrr, pct: progressPct(mrr, m.targetMrr) },
    }));

    return { closedClients, mrr, funnel: funnel(leads), milestones };
  },

  retention() {
    return { tickets: retentionStore.getAllTickets(), reports: retentionStore.getMonthlyReports() };
  },

  createTicket(clientId: string, businessName: string, description: string, isMajor = false) {
    return retentionStore.createTicket(clientId, businessName, description, isMajor);
  },
};

getEventBus().subscribe('crm.lead.converted', (env) => {
  const { closedClients, mrr } = biService.dashboard();
  getEventBus().publish('erp.bi.mrr.changed', {
    mrr,
    closedClients,
    changedAt: new Date().toISOString(),
  }, { actorId: env.actorId, role: env.role, source: 'svc-erp-bi', correlationId: env.correlationId });
}, 'svc-erp-bi');

registerService({
  name: 'svc-erp-bi',
  description: 'MRR, tablero dominical 14/30/60/90, retención y tickets $25/$75+.',
  subscribesTo: ['crm.lead.converted'],
  emits: ['erp.bi.mrr.changed'],
});

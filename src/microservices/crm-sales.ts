import { z } from 'zod';
import { registerService, fail, ok, type Result } from './service';
import { getEventBus } from './event-bus';
import { type EventContext, type PackageType } from './events';
import { OFFICIAL_SCRIPTS, calculateProspectSignals, crmStore, type ProspectItem } from '@/lib/crm';
import {
  BATCH_SIZE,
  MAX_FOLLOW_UPS,
  SIGNAL_KEYS,
  SOURCES,
  STAGES,
  buildScript,
  canSend,
  commissionLedger,
  contactLinks,
  funnel,
  nextAction,
  toCsv,
  topMissing,
} from '@/lib/crm-engine';

/**
 * svc-crm-sales — Módulo CRM independiente (prospección y cierre Midland-Odessa).
 * Emite `crm.lead.converted` al cerrar un prospecto; el resto del ERP reacciona por eventos,
 * sin que este servicio conozca facturación, producción ni finanzas.
 */

const text = (max: number) => z.string().trim().max(max);
const phone = z.string().trim().min(10).max(20).regex(/^[+0-9\s().-]+$/, 'Teléfono no válido');
const signalsSchema = z.object(Object.fromEntries(SIGNAL_KEYS.map((k) => [k, z.boolean()])) as Record<(typeof SIGNAL_KEYS)[number], z.ZodBoolean>);

export const CreateLeadSchema = z.object({
  businessName: text(100).min(2),
  ownerName: text(80).optional(),
  phone,
  address: text(120).optional(),
  city: z.enum(['Midland', 'Odessa']).default('Midland'),
  category: text(60).default('Servicios Locales'),
  source: z.enum(SOURCES as [ProspectItem['source'], ...ProspectItem['source'][]]).default('BARBARA'),
  batchNumber: z.number().int().min(1).max(5).default(1),
  signals: signalsSchema.optional(),
});

export const ConvertLeadSchema = z.object({
  leadId: z.string().min(1),
});

type Caller = Omit<EventContext, 'source'>;

export const crmSalesService = {
  name: 'svc-crm-sales' as const,

  /* --- reglas de negocio (Doc 03) --- */
  constants: { BATCH_SIZE, MAX_FOLLOW_UPS, SIGNAL_KEYS, STAGES, SOURCES },
  score: calculateProspectSignals,
  nextAction,
  buildScript,
  canSend,
  topMissing,
  contactLinks,
  funnel,
  toCsv,
  objections: OFFICIAL_SCRIPTS.objections,

  /* --- consulta --- */
  listLeads(): ProspectItem[] {
    return crmStore.getAll();
  },

  getLead(id: string): ProspectItem | undefined {
    return crmStore.getById(id);
  },

  /* --- comandos --- */
  createLead(input: z.infer<typeof CreateLeadSchema>, caller: Caller): ProspectItem {
    const item = crmStore.create({
      businessName: input.businessName,
      ownerName: input.ownerName,
      phone: input.phone,
      address: input.address,
      city: input.city,
      category: input.category,
      source: input.source,
      batchNumber: input.batchNumber,
      stage: 'LISTED',
      signals: input.signals ?? Object.fromEntries(SIGNAL_KEYS.map((k) => [k, false])) as ProspectItem['signals'],
      followUpCount: 0,
      contactNotes: [],
    });
    getEventBus().publish('crm.lead.created', {
      leadId: item.id,
      businessName: item.businessName,
      city: item.city,
      priority: item.priority,
    }, { ...caller, source: 'svc-crm-sales' });
    return item;
  },

  /**
   * Cierra un prospecto (etapa 5) y dispara la conversión. El número de cliente y el paquete se
   * calculan en el servidor (nunca se aceptan del cliente) para impedir la manipulación de precios.
   */
  convertLead(leadId: string, caller: Caller): Result<{ lead: ProspectItem; clientNumber: number; packageType: PackageType }> {
    const lead = crmStore.getById(leadId);
    if (!lead) return fail(404, 'Prospecto no encontrado.');
    if (lead.stage === 'CLOSED') return fail(409, 'El prospecto ya está cerrado.');

    crmStore.updateStage(leadId, 'CLOSED');
    const lines = commissionLedger(crmStore.getAll()).lines;
    const line = lines.find((l) => l.id === leadId);
    const clientNumber = line ? line.clientNumber : lines.length;
    const packageType: PackageType = clientNumber <= 2 ? 'FOUNDER' : 'BASE';

    getEventBus().publish('crm.lead.converted', {
      leadId: lead.id,
      businessName: lead.businessName,
      ownerName: lead.ownerName,
      clientNumber,
      packageType,
      source: lead.source,
      closedAt: new Date().toISOString(),
    }, { ...caller, source: 'svc-crm-sales' });

    return ok({ lead: crmStore.getById(leadId)!, clientNumber, packageType });
  },

  schemas: { CreateLeadSchema, ConvertLeadSchema },
};

registerService({
  name: 'svc-crm-sales',
  description: 'CRM omnicanal: lotes de 30, 8 señales, guiones, objeciones y cadencia TCPA.',
  subscribesTo: [],
  emits: ['crm.lead.created', 'crm.lead.converted'],
});

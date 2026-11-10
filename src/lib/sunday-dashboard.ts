/**
 * LUMO HQ — TABLERO DOMINICAL DE 15 MINUTOS & MONITOR DE RIESGO #1
 * Fuente de Verdad: Documento 04 (LUMO-FIN-004 · Sección 4 y Tablero Semanal)
 */

export interface SundayMilestoneTarget {
  day: 14 | 30 | 60 | 90;
  name: string;
  targetContacts: number;
  targetDiagnoses: number;
  targetMeetings: number;
  targetClosedClients: number;
  targetMrr: number;
}

export const SUNDAY_MILESTONES: SundayMilestoneTarget[] = [
  {
    day: 14,
    name: 'Día 14 (Gate 1 - Validación de Oferta)',
    targetContacts: 30,
    targetDiagnoses: 10,
    targetMeetings: 4,
    targetClosedClients: 2, // 2 clientes fundadores a $250
    targetMrr: 0,
  },
  {
    day: 30,
    name: 'Día 30 (Gate 2 - Primer Mes Completo)',
    targetContacts: 60,
    targetDiagnoses: 20,
    targetMeetings: 10,
    targetClosedClients: 5, // 2 fundadores + 3 regulares
    targetMrr: 500, // $100/mes x 5 clientes
  },
  {
    day: 60,
    name: 'Día 60 (Gate 3 - Escalamiento a 15 Clientes)',
    targetContacts: 120,
    targetDiagnoses: 45,
    targetMeetings: 25,
    targetClosedClients: 15,
    targetMrr: 1500, // $100/mes x 15 clientes
  },
  {
    day: 90,
    name: 'Día 90 (Gate 4 - Meta Final de los 3 Meses)',
    targetContacts: 150,
    targetDiagnoses: 60,
    targetMeetings: 40,
    targetClosedClients: 30, // 30 negocios locales en Midland-Odessa
    targetMrr: 3000, // $100/mes x 30 clientes
  },
];

export interface WeeklyTeamHours {
  weekNumber: number;
  luisHours: number;    // Meta: 8-10h
  carlosHours: number;  // Meta: 15-18h (Sprint 2+)
  barbaraHours: number; // Meta: 4-6h
  contactsThisWeek: number; // Meta: mínimo 10 contactos
  notes?: string;
}

export function evaluateRisk1Alert(hours: WeeklyTeamHours): {
  isAlertActive: boolean;
  totalHours: number;
  reasons: string[];
} {
  const totalHours = Math.round((hours.luisHours + hours.carlosHours + hours.barbaraHours) * 10) / 10;
  const reasons: string[] = [];

  if (totalHours < 18.0) {
    reasons.push(`El equipo trabajó ${totalHours}\u00a0h; el mínimo es 18\u00a0h por semana.`);
  }
  if (hours.contactsThisWeek < 10) {
    reasons.push(`Se hicieron ${hours.contactsThisWeek} contactos; el mínimo es 10 por semana.`);
  }

  return {
    isAlertActive: reasons.length > 0,
    totalHours,
    reasons,
  };
}


/* ---------------------------------------------------------------- weekly review (persisted) */

/** Weekly hour ranges per person (Doc 04). */
export const HOUR_TARGETS = {
  luisHours: { name: 'Luis', min: 8, max: 10 },
  carlosHours: { name: 'Carlos', min: 15, max: 18 },
  barbaraHours: { name: 'Bárbara', min: 4, max: 6 },
} as const;
export const MIN_WEEKLY_HOURS = 18;
export const MIN_WEEKLY_CONTACTS = 10;
export const MONTHLY_FEE = 100;

export interface SundayMetrics { contacts: number; diagnoses: number; meetings: number; closedClients: number; mrr: number }

export interface SundayReview {
  weekOf: string;               // Monday of the week, YYYY-MM-DD
  milestone: SundayMilestoneTarget['day'];
  hours: Omit<WeeklyTeamHours, 'weekNumber' | 'notes'>;
  metrics: SundayMetrics;
  notes: string;
  savedBy?: string;
  savedAt?: string;
}

export const METRIC_KEYS: (keyof SundayMetrics)[] = ['contacts', 'diagnoses', 'meetings', 'closedClients', 'mrr'];

export function targetFor(m: SundayMilestoneTarget, k: keyof SundayMetrics): number {
  return { contacts: m.targetContacts, diagnoses: m.targetDiagnoses, meetings: m.targetMeetings, closedClients: m.targetClosedClients, mrr: m.targetMrr }[k];
}

/** 0-100. A target of 0 counts as met. */
export function progressPct(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

/**
 * Counts the CRM already knows, so the review starts from real numbers.
 * reached = [listed, contacted, diagnosed, met, closed] from crm-engine's funnel().
 */
export function metricsFromFunnel(reached: number[]): SundayMetrics {
  const [, contacts = 0, diagnoses = 0, meetings = 0, closedClients = 0] = reached;
  return { contacts, diagnoses, meetings, closedClients, mrr: closedClients * MONTHLY_FEE };
}

export function mondayOf(d = new Date()): string {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - dow);
  return x.toISOString().slice(0, 10);
}

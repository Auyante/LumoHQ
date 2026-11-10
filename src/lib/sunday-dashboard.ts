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
  const totalHours = hours.luisHours + hours.carlosHours + hours.barbaraHours;
  const reasons: string[] = [];

  if (totalHours < 18.0) {
    reasons.push(`Horas totales invertidas (${totalHours}h) por debajo del umbral mínimo de 18 horas semanales.`);
  }
  if (hours.contactsThisWeek < 10) {
    reasons.push(`Contactos realizados en la semana (${hours.contactsThisWeek}) por debajo de la cuota mínima de 10 contactos.`);
  }

  return {
    isAlertActive: reasons.length > 0,
    totalHours,
    reasons,
  };
}


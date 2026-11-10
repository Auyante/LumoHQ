/**
 * LUMO HQ — SISTEMA DE RETENCIÓN, REPORTES MENSUALES Y TICKETS DE CAMBIO
 * Fuente de Verdad: Documento 03 y Documento 04
 */

export interface MonthlyReportData {
  clientId: string;
  businessName: string;
  month: string; // Ej: "Febrero 2026"
  metrics: {
    callButtonClicks: number;       // 1. Clics en llamar
    messageButtonClicks: number;    // 2. Clics en WhatsApp/SMS
    directionsClicks: number;       // 3. Clics en "Cómo llegar"
    websiteViews: number;           // 4. Visitas web
    directVsDiscoveryRatio: string; // 5. Búsquedas directas vs descubrimiento (ej: "35% / 65%")
    newReviewsCount: number;        // 6. Nuevas reseñas en el mes
    averageRating: number;          // 7. Calificación promedio
  };
  generatedAt: string;
}

export interface ChangeTicket {
  id: string;
  clientId: string;
  businessName: string;
  type: 'SMALL_CHANGE' | 'EXTRA_CHANGE' | 'MAJOR_WORK';
  description: string;
  estimatedMinutes: number;
  cost: number; // $0 para los primeros 2 del mes, $25 para el 3+, $75+ para trabajos mayores
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED';
  requestedAt: string;
  completedAt?: string;
}

// Global in-memory storage for Tickets and Reports
const globalRetention = globalThis as unknown as {
  __lumo_tickets?: ChangeTicket[];
  __lumo_reports?: MonthlyReportData[];
};

if (!globalRetention.__lumo_tickets) {
  globalRetention.__lumo_tickets = [
    {
      id: 'tkt_01',
      clientId: 'cli_elrey_01',
      businessName: 'El Rey Barbershop',
      type: 'SMALL_CHANGE',
      description: 'Actualizar horario de los sábados de 7:00 PM a 8:00 PM',
      estimatedMinutes: 10,
      cost: 0.0, // Dentro de los 2 cambios mensuales incluidos
      status: 'COMPLETED',
      requestedAt: '2026-02-10T15:00:00Z',
      completedAt: '2026-02-10T15:20:00Z',
    },
    {
      id: 'tkt_02',
      clientId: 'cli_elrey_01',
      businessName: 'El Rey Barbershop',
      type: 'SMALL_CHANGE',
      description: 'Subir 2 fotos del nuevo sillón de barbero a la galería',
      estimatedMinutes: 15,
      cost: 0.0, // Segundo cambio incluido del mes
      status: 'COMPLETED',
      requestedAt: '2026-02-18T11:00:00Z',
      completedAt: '2026-02-18T11:25:00Z',
    },
  ];
}

if (!globalRetention.__lumo_reports) {
  globalRetention.__lumo_reports = [
    {
      clientId: 'cli_elrey_01',
      businessName: 'El Rey Barbershop',
      month: 'Primeros 30 Días (Reporte Oficial)',
      metrics: {
        callButtonClicks: 47,
        messageButtonClicks: 62,
        directionsClicks: 89,
        websiteViews: 312,
        directVsDiscoveryRatio: '28% directo / 72% descubrimiento',
        newReviewsCount: 16,
        averageRating: 4.9,
      },
      generatedAt: new Date().toISOString(),
    },
  ];
}

export const retentionStore = {
  getTicketsForClient(clientId: string): ChangeTicket[] {
    return (globalRetention.__lumo_tickets || []).filter((t) => t.clientId === clientId);
  },

  getAllTickets(): ChangeTicket[] {
    return globalRetention.__lumo_tickets || [];
  },

  createTicket(clientId: string, businessName: string, description: string, isMajor: boolean = false): ChangeTicket {
    const existingThisMonth = this.getTicketsForClient(clientId).filter(
      (t) => new Date(t.requestedAt).getMonth() === new Date().getMonth()
    );

    let type: ChangeTicket['type'] = 'SMALL_CHANGE';
    let cost = 0.0;
    let estimatedMinutes = 15;

    if (isMajor) {
      type = 'MAJOR_WORK';
      cost = 75.0; // Tarifa mínima de trabajo mayor
      estimatedMinutes = 90;
    } else if (existingThisMonth.length >= 2) {
      // 3er cambio o posterior: se factura a $25
      type = 'EXTRA_CHANGE';
      cost = 25.0;
      estimatedMinutes = 20;
    }

    const ticket: ChangeTicket = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId,
      businessName,
      type,
      description,
      estimatedMinutes,
      cost,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
    };

    globalRetention.__lumo_tickets!.unshift(ticket);
    return ticket;
  },

  getMonthlyReports(clientId?: string): MonthlyReportData[] {
    if (clientId) {
      return (globalRetention.__lumo_reports || []).filter((r) => r.clientId === clientId);
    }
    return globalRetention.__lumo_reports || [];
  },
};


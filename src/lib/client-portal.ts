/**
 * LUMO HQ — PORTAL DEL CLIENTE Y LÍNEA DE PRODUCCIÓN DE 5 DÍAS
 * Fuente de Verdad: Documento 01, Documento 02 y Documento 03
 */

export interface ClientProject {
  id: string;
  contractId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  packageType: 'FOUNDER' | 'BASE' | 'PREMIUM';
  extraChannel: 'BOOKING' | 'IG_FB' | 'WHATSAPP';
  
  // Estados de Pago
  depositPaid: boolean;
  finalPaid: boolean;
  subscriptionActive: boolean;
  
  // Checklist de Recolección de Datos Día 1
  day1Checklist: {
    napVerified: boolean;
    hoursSet: boolean;
    servicesMenuSet: boolean;
    serviceAreaSet: boolean;
    photosUploadedCount: number;
    copyrightConfirmed: boolean;
    isComplete: boolean;
  };

  // Estado de Accesos Cero Contraseñas
  zeroPasswords: {
    googleAccessGranted: boolean;
    metaAccessGranted: boolean;
    bookingAccessGranted: boolean;
  };

  // Reloj de Entrega de 5 Días Hábiles
  clock: {
    status: 'PAUSED' | 'RUNNING' | 'COMPLETED';
    currentDay: number; // 0 a 5
    isPaused: boolean;
    pauseReason?: string;
    startedAt?: string;
    approvedAt?: string;
  };

  // Estado de los 5 Días de Producción
  productionTasks: {
    day0DepositAndContract: boolean; // Luis
    day1DataCollection: boolean;     // Bárbara / Cliente
    day2TechnicalAssembly: boolean;   // Carlos
    day3SpeedAndAccessibility: boolean; // Carlos
    day4PreviewPresentation: boolean; // Luis
    day5ClientApprovalAndHandover: boolean; // Luis & Carlos
  };

  previewDemoUrl: string;
  reviewShortLink?: string;
}

// Global in-memory storage for Client Projects
const globalProjects = globalThis as unknown as {
  __lumo_client_projects?: Map<string, ClientProject>;
};

if (!globalProjects.__lumo_client_projects) {
  globalProjects.__lumo_client_projects = new Map<string, ClientProject>();

  // Default seed client: Roberto Sánchez (El Rey Barbershop, Midland TX)
  const defaultClient: ClientProject = {
    id: 'cli_elrey_01',
    contractId: 'ct_init_founder_01',
    businessName: 'El Rey Barbershop',
    ownerName: 'Roberto Sánchez',
    phone: '(432) 555-0199',
    email: 'roberto@elreybarber.com',
    address: '1405 N Big Spring St',
    city: 'Midland',
    state: 'TX',
    zipCode: '79701',
    packageType: 'FOUNDER',
    extraChannel: 'BOOKING',
    depositPaid: true,
    finalPaid: false,
    subscriptionActive: false,
    day1Checklist: {
      napVerified: true,
      hoursSet: true,
      servicesMenuSet: true,
      serviceAreaSet: true,
      photosUploadedCount: 14,
      copyrightConfirmed: true,
      isComplete: true,
    },
    zeroPasswords: {
      googleAccessGranted: true,
      metaAccessGranted: true,
      bookingAccessGranted: true,
    },
    clock: {
      status: 'RUNNING',
      currentDay: 3, // Día 3: Pruebas de velocidad móvil y accesibilidad
      isPaused: false,
      startedAt: '2026-03-01T10:00:00Z',
    },
    productionTasks: {
      day0DepositAndContract: true,
      day1DataCollection: true,
      day2TechnicalAssembly: true,
      day3SpeedAndAccessibility: false,
      day4PreviewPresentation: false,
      day5ClientApprovalAndHandover: false,
    },
    previewDemoUrl: '/demo/barberia',
    reviewShortLink: 'https://g.page/r/lumo-elrey/review',
  };

  // Seed client 2: Taquería Los Compadres (Odessa TX) - Pausa por falta de fotos
  const pausedClient: ClientProject = {
    id: 'cli_taqueria_02',
    contractId: 'ct_init_founder_02',
    businessName: 'Taquería Los Compadres',
    ownerName: 'Manuel Ortega',
    phone: '(432) 555-0244',
    email: 'manuel@taquerialoscompadres.com',
    address: '802 E 8th St',
    city: 'Odessa',
    state: 'TX',
    zipCode: '79761',
    packageType: 'FOUNDER',
    extraChannel: 'WHATSAPP',
    depositPaid: true,
    finalPaid: false,
    subscriptionActive: false,
    day1Checklist: {
      napVerified: true,
      hoursSet: true,
      servicesMenuSet: false,
      serviceAreaSet: true,
      photosUploadedCount: 2, // Faltan fotos (< 5)
      copyrightConfirmed: false,
      isComplete: false,
    },
    zeroPasswords: {
      googleAccessGranted: false,
      metaAccessGranted: true,
      bookingAccessGranted: false,
    },
    clock: {
      status: 'PAUSED',
      currentDay: 1,
      isPaused: true,
      pauseReason: 'Faltan fotos del negocio (mínimo 5 requeridas) y confirmación legal de derechos de autor.',
      startedAt: '2026-03-02T14:00:00Z',
    },
    productionTasks: {
      day0DepositAndContract: true,
      day1DataCollection: false,
      day2TechnicalAssembly: false,
      day3SpeedAndAccessibility: false,
      day4PreviewPresentation: false,
      day5ClientApprovalAndHandover: false,
    },
    previewDemoUrl: '/demo/taqueria',
    reviewShortLink: 'https://g.page/r/lumo-loscompadres/review',
  };

  globalProjects.__lumo_client_projects.set(defaultClient.id, defaultClient);
  globalProjects.__lumo_client_projects.set(pausedClient.id, pausedClient);
}

export const clientProjectStore = {
  getById(id: string): ClientProject | undefined {
    return globalProjects.__lumo_client_projects!.get(id);
  },

  getAll(): ClientProject[] {
    return Array.from(globalProjects.__lumo_client_projects!.values());
  },

  save(project: ClientProject): void {
    globalProjects.__lumo_client_projects!.set(project.id, project);
  },

  updateDay1Checklist(
    id: string,
    updates: Partial<ClientProject['day1Checklist']>
  ): ClientProject | undefined {
    const project = this.getById(id);
    if (!project) return undefined;

    project.day1Checklist = { ...project.day1Checklist, ...updates };

    // Check completeness: all fields true and photos >= 5
    const isComplete =
      project.day1Checklist.napVerified &&
      project.day1Checklist.hoursSet &&
      project.day1Checklist.servicesMenuSet &&
      project.day1Checklist.serviceAreaSet &&
      project.day1Checklist.photosUploadedCount >= 5 &&
      project.day1Checklist.copyrightConfirmed;

    project.day1Checklist.isComplete = isComplete;

    // Recalculate clock pause
    if (project.depositPaid && isComplete) {
      project.clock.isPaused = false;
      project.clock.status = 'RUNNING';
      project.clock.pauseReason = undefined;
      project.productionTasks.day1DataCollection = true;
    } else {
      project.clock.isPaused = true;
      project.clock.status = 'PAUSED';
      if (!isComplete) {
        project.clock.pauseReason = 'Checklist del Día 1 incompleto (fotos, horarios o derechos de autor pendientes).';
      } else if (!project.depositPaid) {
        project.clock.pauseReason = 'Anticipo del 50% pendiente de acreditación en Stripe.';
      }
    }

    return project;
  },

  approveDelivery(id: string): { success: boolean; project?: ClientProject } {
    const project = this.getById(id);
    if (!project) return { success: false };

    project.clock.currentDay = 5;
    project.clock.status = 'COMPLETED';
    project.clock.approvedAt = new Date().toISOString();
    project.productionTasks.day5ClientApprovalAndHandover = true;
    project.finalPaid = true;
    project.subscriptionActive = true;

    return { success: true, project };
  },
};


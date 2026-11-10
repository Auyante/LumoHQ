/**
 * LUMO HQ — CRM DE PROSPECCIÓN LOCAL & MOTOR DE 8 SEÑALES
 * Fuente de Verdad: Documento 03 (LUMO-SOP-003 · Versión 2)
 */

export interface ProspectItem {
  id: string;
  batchNumber: number; // Lote 1 a 5 (30 negocios por lote)
  businessName: string;
  ownerName?: string;
  phone: string;
  address?: string;
  city: string; // Midland o Odessa, TX
  googleMapsUrl?: string;
  category: string;
  stage: 'LISTED' | 'CONTACTED' | 'DIAGNOSED' | 'MET' | 'CLOSED' | 'FOLLOW_UP';
  source: 'BARBARA' | 'LUIS' | 'REFERRAL';
  
  // 1.1 Las 8 Señales Exactas de Calificación (1 punto c/u)
  signals: {
    scoreReviews: boolean;         // Señal 1: Menos de 20 reseñas, o la última tiene más de 3 meses.
    scoreWebsite: boolean;         // Señal 2: Sin página web, o rota o desactualizada.
    scorePhotos: boolean;          // Señal 3: Fotos viejas, pocas o ninguna.
    scoreHours: boolean;           // Señal 4: Horario vacío o incompleto.
    scoreDescription: boolean;     // Señal 5: Sin descripción, sin servicios o con categorías mal puestas.
    scoreReviewResponse: boolean;  // Señal 6: Reseñas sin respuesta del dueño.
    scoreBooking: boolean;         // Señal 7: Sin botón de reservar (barberías, salones, talleres con citas).
    scoreSpanish: boolean;         // Señal 8: Atiende en español (por las reseñas, las fotos o el nombre).
  };
  totalScore: number;
  priority: 'P1' | 'P2' | 'DISCARD';
  
  followUpCount: number; // Estricto máximo 3 bajo TCPA
  contactNotes?: string[];
  lastContactedAt?: string;
  preferredChannel?: 'WhatsApp' | 'Llamada' | 'Presencial';
  questionSource?: string;
  questionMissedCalls?: string;
  createdAt: string;

  // Cadence anchors (set when the stage changes). Doc 03: diagnosis <24 h after contact,
  // follow-ups 2, 5 and 7 days after the diagnosis.
  contactedAt?: string;
  diagnosedAt?: string;
  metAt?: string;
  closedAt?: string;
  /** TCPA: the business asked not to be contacted. Blocks every message from then on. */
  optedOut?: boolean;
  optedOutAt?: string;
}

/**
 * 1.1 Cómo calificar las listas de 30 (Doc 03)
 * 4+ puntos = contactar primero (P1)
 * 2 o 3 = segunda tanda (P2)
 * menos de 2 = descartar (DISCARD)
 */
export function calculateProspectSignals(signals: Partial<ProspectItem['signals']>): {
  score: number;
  priority: 'P1' | 'P2' | 'DISCARD';
} {
  let score = 0;
  if (signals.scoreReviews) score++;
  if (signals.scoreWebsite) score++;
  if (signals.scorePhotos) score++;
  if (signals.scoreHours) score++;
  if (signals.scoreDescription) score++;
  if (signals.scoreReviewResponse) score++;
  if (signals.scoreBooking) score++;
  if (signals.scoreSpanish) score++;

  let priority: 'P1' | 'P2' | 'DISCARD' = 'DISCARD';
  if (score >= 4) {
    priority = 'P1'; // 4+ puntos = contactar primero
  } else if (score >= 2) {
    priority = 'P2'; // 2 o 3 = segunda tanda
  } else {
    priority = 'DISCARD'; // menos de 2 = descartar
  }

  return { score, priority };
}

/**
 * 1.2 Guiones Oficiales y Tiempos de Seguimiento (Doc 03)
 */
export const OFFICIAL_SCRIPTS = {
  // Visitas presenciales (Luis): máximo 5 minutos
  visitasLuis: (vars: { dueno?: string; tipoDeNegocio?: string; negocio: string; queLeFalta?: string }) => {
    const d = vars.dueno || '[dueño]';
    const tipo = vars.tipoDeNegocio || 'tu categoría de negocio';
    const falta = vars.queLeFalta || 'pocas fotos y sin botón de llamada directo';
    return `— "Hola, ¿tú eres ${d}? Mucho gusto, soy Luis, de Lumo HQ. Ayudo a negocios latinos aquí en Midland a que los encuentren en Google y que sus clientes los puedan llamar, escribir o reservar en un clic. Busqué ${tipo} y vi que ${vars.negocio} sale con ${falta}. Eso hace que mucha gente se vaya con otro. Te hago gratis un diagnóstico de una página con lo que te falta. ¿A dónde te lo mando?"`;
  },

  // Primer contacto (Bárbara por mensaje / Luis en persona)
  primerContacto: (vars: { nombre?: string; negocio: string; queLeFalta?: string }) => {
    const nom = vars.nombre || '[nombre]';
    const falta = vars.queLeFalta || 'sale con pocas fotos y sin botón de llamada directo';
    return `Hola ${nom}, buenas. Le escribo de Lumo HQ, ayudamos a negocios latinos de Midland a salir completos en Google y a que sus clientes los puedan llamar, escribir o reservar en un clic. Vi que ${vars.negocio} ${falta}. Le podemos mandar gratis un diagnóstico de una página. ¿Se lo envío por aquí?`;
  },

  // Envío del diagnóstico (Bárbara)
  envioDiagnostico: (vars: { nombre?: string }) => {
    const nom = vars.nombre || '[nombre]';
    return `Hola ${nom}, aquí está el diagnóstico de su negocio en Google. Lo más importante está arriba. Si quiere se lo explicamos en 15 minutos esta semana, ¿qué día le queda mejor?`;
  },

  // Seguimiento 1 (2 días)
  seguimiento1: (vars: { nombre?: string; punto1?: string }) => {
    const nom = vars.nombre || '[nombre]';
    const p1 = vars.punto1 || 'el botón de llamada y los horarios';
    return `Hola ${nom}, ¿pudo ver el diagnóstico? Lo primero que le recomendamos arreglar es ${p1}, porque es lo que la gente ve antes de llamarle.`;
  },

  // Seguimiento 2 (5 días)
  seguimiento2: (vars: { nombre?: string; tipoDeNegocio?: string; dia?: string }) => {
    const nom = vars.nombre || '[nombre]';
    const tipo = vars.tipoDeNegocio || 'negocios de su sector';
    const d = vars.dia || 'este jueves';
    return `${nom}, hoy buscamos otra vez ${tipo} y otros negocios salen primero con fotos, horario y botón para reservar. Le enseñamos en 15 minutos cómo dejar el suyo igual o mejor. ¿Le funciona ${d}?`;
  },

  // Seguimiento 3 (1 semana, último - Estricto TCPA)
  seguimiento3: (vars: { nombre?: string; negocio: string }) => {
    const nom = vars.nombre || '[nombre]';
    return `Hola ${nom}, no le molestamos más. Si en algún momento quiere arreglar lo de Google, aquí estamos. Mucho éxito con ${vars.negocio}.`;
  },

  // Propuesta (mismo día de la reunión)
  propuesta: (vars: { nombre?: string }) => {
    const nom = vars.nombre || '[nombre]';
    return `${nom}, gracias por su tiempo. Aquí le dejo la propuesta: precio, qué incluye y el plazo. Para empezar solo hace falta firmar y el 50% del montaje. ¿Lo dejamos listo esta semana?`;
  },

  // 1.3 Las 8 Objeciones Literales del Documento 03
  objections: [
    {
      id: 'obj_1_caro',
      objection: 'Está caro.',
      rebuttal: '¿Cuánto le deja un cliente nuevo? Si esto le trae uno o dos al mes, ya se pagó. Y el montaje se paga en dos partes.',
    },
    {
      id: 'obj_2_tiempo',
      objection: 'No tengo tiempo.',
      rebuttal: 'Por eso lo hacemos nosotros. Solo necesitamos fotos y 20 minutos para revisar al final.',
    },
    {
      id: 'obj_3_boca_en_boca',
      objection: 'Me llegan de boca en boca.',
      rebuttal: 'Eso es lo mejor. Pero cuando alguien lo recomienda, lo primero que hacen es buscarlo en Google. Si no lo ven completo, se van con otro.',
    },
    {
      id: 'obj_4_whatsapp',
      objection: 'Mis clientes no usan WhatsApp.',
      rebuttal: 'No hace falta. Le ponemos lo que sus clientes ya usan: que lo llamen, le manden texto o reserven en un clic.',
    },
    {
      id: 'obj_5_ingles',
      objection: 'Mis clientes hablan inglés.',
      rebuttal: 'Por eso la página y el perfil van en inglés y español.',
    },
    {
      id: 'obj_6_sobrino',
      objection: 'Mi sobrino me hace eso.',
      rebuttal: 'Qué bueno. Le dejo el diagnóstico para que él lo use. Si algún día no tiene tiempo, aquí estamos.',
    },
    {
      id: 'obj_7_no_sirvio',
      objection: 'Ya me vendieron eso y no sirvió.',
      rebuttal: 'No prometemos primer lugar. Dejamos todo completo, mandamos un reporte cada mes y la mensualidad se cancela con 30 días de aviso.',
    },
    {
      id: 'obj_8_adelantado',
      objection: 'No confío en pagar adelantado.',
      rebuttal: 'Por eso es solo el 50%, con contrato firmado y factura. El resto lo paga cuando apruebe.',
    },
  ],
};

// Global Store para Leads/Prospects en Memoria
const globalCrm = globalThis as unknown as {
  __lumo_prospects?: ProspectItem[];
};

if (!globalCrm.__lumo_prospects) {
  // Prospectos iniciales del Lote 1 con las 8 señales literales
  globalCrm.__lumo_prospects = [
    {
      id: 'lead_midland_barber_01',
      batchNumber: 1,
      businessName: 'Barbería La Frontera',
      ownerName: 'José Ramírez',
      phone: '(432) 555-0144',
      address: '2200 W Wall St',
      city: 'Midland',
      category: 'Barbería y Cuidado Personal',
      stage: 'MET',
      source: 'LUIS',
      signals: {
        scoreReviews: true,         // 1. <20 reseñas o última >3 meses
        scoreWebsite: true,         // 2. Sin web o rota
        scorePhotos: true,          // 3. Fotos viejas, pocas o ninguna
        scoreHours: false,          // 4. Horario completo
        scoreDescription: true,     // 5. Sin descripción
        scoreReviewResponse: true,  // 6. Reseñas sin respuesta
        scoreBooking: true,         // 7. Sin botón de reservar
        scoreSpanish: true,         // 8. Atiende en español
      },
      totalScore: 7,
      priority: 'P1',
      followUpCount: 1,
      contactNotes: ['Reunión presencial con Luis el martes. Muy interesado en el botón de Square para citas.'],
      lastContactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead_odessa_taqueria_02',
      batchNumber: 1,
      businessName: 'Taquería El Pastorcito',
      ownerName: 'Martín Hernández',
      phone: '(432) 555-0182',
      address: '1310 E 8th St',
      city: 'Odessa',
      category: 'Restaurante / Comida Mexicana',
      stage: 'DIAGNOSED',
      source: 'BARBARA',
      signals: {
        scoreReviews: true,
        scoreWebsite: true,
        scorePhotos: false,
        scoreHours: true,
        scoreDescription: true,
        scoreReviewResponse: true,
        scoreBooking: false,
        scoreSpanish: true,
      },
      totalScore: 6,
      priority: 'P1',
      followUpCount: 1,
      contactNotes: ['Envío del diagnóstico realizado por WhatsApp. Interesados en menú bilingüe.'],
      lastContactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead_midland_roofing_03',
      batchNumber: 1,
      businessName: 'Permian Basin Roofing Pros',
      ownerName: 'Carlos Dávila',
      phone: '(432) 555-0211',
      address: 'Midland, TX 79705',
      city: 'Midland',
      category: 'Contratista / Roofing',
      stage: 'CONTACTED',
      source: 'BARBARA',
      signals: {
        scoreReviews: true,
        scoreWebsite: false,
        scorePhotos: true,
        scoreHours: true,
        scoreDescription: true,
        scoreReviewResponse: false,
        scoreBooking: false,
        scoreSpanish: true,
      },
      totalScore: 5,
      priority: 'P1',
      followUpCount: 2,
      contactNotes: ['Interesados en Paquete Premium para cotizaciones de techos de granizo.'],
      lastContactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead_odessa_autodetail_04',
      batchNumber: 1,
      businessName: 'VIP Mobile Auto Detailing',
      ownerName: 'Gabriel Solís',
      phone: '(432) 555-0319',
      address: 'Odessa, TX 79761',
      city: 'Odessa',
      category: 'Lavado y Detallado Automotriz',
      stage: 'LISTED',
      source: 'BARBARA',
      signals: {
        scoreReviews: false,
        scoreWebsite: true,
        scorePhotos: true,
        scoreHours: true,
        scoreDescription: false,
        scoreReviewResponse: true,
        scoreBooking: true,
        scoreSpanish: true,
      },
      totalScore: 6,
      priority: 'P1',
      followUpCount: 0,
      contactNotes: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead_midland_bakery_05',
      batchNumber: 1,
      businessName: 'Panadería San Juan',
      ownerName: 'Carmen Morales',
      phone: '(432) 555-0428',
      address: '900 S Big Spring St',
      city: 'Midland',
      category: 'Panadería y Pastelería',
      stage: 'FOLLOW_UP',
      source: 'LUIS',
      signals: {
        scoreReviews: false,
        scoreWebsite: true,
        scorePhotos: false,
        scoreHours: true,
        scoreDescription: false,
        scoreReviewResponse: false,
        scoreBooking: false,
        scoreSpanish: true,
      },
      totalScore: 3,
      priority: 'P2',
      followUpCount: 3, // Límite estricto TCPA
      contactNotes: ['Seguimiento 3 final enviado. No insistir.'],
      lastContactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'lead_odessa_plumbing_06',
      batchNumber: 1,
      businessName: 'Plomería Hermanos Vega',
      ownerName: 'Raúl Vega',
      phone: '(432) 555-0555',
      address: 'Odessa, TX',
      city: 'Odessa',
      category: 'Plomería Residencial',
      stage: 'CLOSED',
      source: 'REFERRAL',
      signals: {
        scoreReviews: true,
        scoreWebsite: true,
        scorePhotos: true,
        scoreHours: false,
        scoreDescription: true,
        scoreReviewResponse: true,
        scoreBooking: false,
        scoreSpanish: true,
      },
      totalScore: 6,
      priority: 'P1',
      followUpCount: 1,
      contactNotes: ['Contrato firmado en Sprint 3. Anticipo 50% depositado.'],
      lastContactedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];
}

// Demo cadence anchors for the seed data, relative to server start.
{
  const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const anchors: Record<string, Partial<ProspectItem>> = {
    lead_midland_barber_01: { createdAt: ago(240), contactedAt: ago(200), diagnosedAt: ago(190), metAt: ago(3), lastContactedAt: ago(3) },
    lead_odessa_taqueria_02: { createdAt: ago(120), contactedAt: ago(100), diagnosedAt: ago(50), lastContactedAt: ago(50) },
    lead_midland_roofing_03: { createdAt: ago(30), contactedAt: ago(20), lastContactedAt: ago(20) },
    lead_odessa_autodetail_04: { createdAt: ago(5) },
    lead_midland_bakery_05: { createdAt: ago(400), contactedAt: ago(380), diagnosedAt: ago(370), lastContactedAt: ago(200) },
    lead_odessa_plumbing_06: { createdAt: ago(500), contactedAt: ago(480), diagnosedAt: ago(470), metAt: ago(400), closedAt: ago(390), lastContactedAt: ago(390) },
  };
  for (const p of globalCrm.__lumo_prospects!) if (anchors[p.id] && !p.contactedAt && !p.closedAt) Object.assign(p, anchors[p.id]);
}

/** Fields the team may edit by hand. Score, priority, id, follow-up count and timestamps are server-owned. */
const EDITABLE = ['businessName', 'ownerName', 'phone', 'address', 'city', 'googleMapsUrl', 'category', 'source', 'batchNumber', 'preferredChannel', 'questionSource', 'questionMissedCalls'] as const;

const STAGE_STAMP: Partial<Record<ProspectItem['stage'], 'contactedAt' | 'diagnosedAt' | 'metAt' | 'closedAt'>> = {
  CONTACTED: 'contactedAt', DIAGNOSED: 'diagnosedAt', MET: 'metAt', CLOSED: 'closedAt',
};

export const crmStore = {
  getAll(): ProspectItem[] {
    return globalCrm.__lumo_prospects || [];
  },

  getById(id: string): ProspectItem | undefined {
    return (globalCrm.__lumo_prospects || []).find((p) => p.id === id);
  },

  create(prospect: Omit<ProspectItem, 'id' | 'totalScore' | 'priority' | 'createdAt'>): ProspectItem {
    const { score, priority } = calculateProspectSignals(prospect.signals);
    const item: ProspectItem = {
      ...prospect,
      id: `lead_${Date.now().toString(36)}_${globalThis.crypto.randomUUID().slice(0, 8)}`,
      totalScore: score,
      priority,
      createdAt: new Date().toISOString(),
    };
    globalCrm.__lumo_prospects!.unshift(item);
    return item;
  },

  updateStage(id: string, stage: ProspectItem['stage']): boolean {
    const item = this.getById(id);
    if (!item) return false;
    const now = new Date().toISOString();
    item.stage = stage;
    // stamp the cadence anchor the first time the business reaches this stage
    const stamp = STAGE_STAMP[stage];
    if (stamp && !item[stamp]) item[stamp] = now;
    if (stage !== 'LISTED') item.lastContactedAt = now;
    return true;
  },

  setOptOut(id: string, optedOut: boolean): ProspectItem | null {
    const item = this.getById(id);
    if (!item) return null;
    item.optedOut = optedOut;
    item.optedOutAt = optedOut ? new Date().toISOString() : undefined;
    return item;
  },

  /** Bulk import: skips numbers already in the CRM and refuses to grow a batch past 30. */
  importMany(rows: Omit<ProspectItem, 'id' | 'totalScore' | 'priority' | 'createdAt' | 'stage' | 'signals' | 'followUpCount'>[]): { created: ProspectItem[]; skipped: { businessName: string; reason: string }[] } {
    const digits = (s: string) => s.replace(/\D/g, '').slice(-10);
    const known = new Set(this.getAll().map((p) => digits(p.phone)));
    const created: ProspectItem[] = [];
    const skipped: { businessName: string; reason: string }[] = [];
    for (const r of rows) {
      const d = digits(r.phone);
      if (known.has(d)) { skipped.push({ businessName: r.businessName, reason: 'Ya está en el CRM (mismo teléfono).' }); continue; }
      if (this.getAll().filter((p) => p.batchNumber === r.batchNumber).length >= 30) {
        skipped.push({ businessName: r.businessName, reason: `El lote ${r.batchNumber} ya tiene 30 negocios.` }); continue;
      }
      known.add(d);
      created.push(this.create({
        ...r, stage: 'LISTED', followUpCount: 0, contactNotes: [],
        signals: { scoreReviews: false, scoreWebsite: false, scorePhotos: false, scoreHours: false, scoreDescription: false, scoreReviewResponse: false, scoreBooking: false, scoreSpanish: false },
      }));
    }
    return { created, skipped };
  },

  incrementFollowUp(id: string, note?: string): { success: boolean; error?: string; count: number } {
    const item = this.getById(id);
    if (!item) return { success: false, error: 'Prospecto no encontrado', count: 0 };

    if (item.optedOut) {
      return { success: false, error: 'El negocio pidió no recibir mensajes (TCPA).', count: item.followUpCount };
    }
    if (item.followUpCount >= 3) {
      return {
        success: false,
        error: 'Límite TCPA alcanzado: Está prohibido enviar más de 3 seguimientos a un prospecto no respondido.',
        count: item.followUpCount,
      };
    }

    item.followUpCount++;
    item.lastContactedAt = new Date().toISOString();
    if (note) {
      if (!item.contactNotes) item.contactNotes = [];
      item.contactNotes.unshift(`[${new Date().toLocaleDateString('es-US')}] ${note}`);
    }
    return { success: true, count: item.followUpCount };
  },

  updateSignals(id: string, signals: ProspectItem['signals']): ProspectItem | null {
    const item = this.getById(id);
    if (!item) return null;
    item.signals = signals;
    const { score, priority } = calculateProspectSignals(signals);
    item.totalScore = score;
    item.priority = priority;
    return item;
  },

  updateDetails(id: string, details: Partial<ProspectItem>): ProspectItem | null {
    const item = this.getById(id);
    if (!item) return null;
    // Whitelist only: a request can never set the score, the priority, the id or the follow-up count.
    const target = item as unknown as Record<string, unknown>;
    for (const k of EDITABLE) if (k in details) target[k] = (details as Record<string, unknown>)[k];
    return item;
  },
};

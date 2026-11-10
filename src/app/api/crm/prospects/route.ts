import { NextRequest, NextResponse } from 'next/server';
import { crmStore, calculateProspectSignals } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rate-limit';
import { STAFF_ROLES } from '@/lib/auth';
import { requireSession, isGuardResponse } from '@/lib/security/guard';

export async function GET(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  const prospects = crmStore.getAll();
  return NextResponse.json({ success: true, prospects });
}

export async function POST(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  try {
    const clientIp = g.ip;
    const rateLimit = checkRateLimit(`crm-create:${clientIp}`, 20, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
    }

    const body = await req.json();
    if (!body.businessName || !body.phone) {
      return NextResponse.json(
        { error: 'El nombre del negocio y el teléfono son obligatorios.' },
        { status: 400 }
      );
    }

    const item = crmStore.create({
      batchNumber: body.batchNumber || 1,
      businessName: body.businessName,
      ownerName: body.ownerName,
      phone: body.phone,
      address: body.address,
      city: body.city || 'Midland',
      category: body.category || 'Servicios Locales',
      stage: body.stage || 'LISTED',
      source: body.source || 'BARBARA',
      signals: body.signals || {
        unclaimedGoogleProfile: false,
        lowOrFewReviews: false,
        noOrBrokenWebsite: false,
        notMobileResponsive: false,
        incompleteHours: false,
        oldOrNoPhotos: false,
        noDirectContactButtons: false,
        slowLoadingSpeed: false,
      },
      followUpCount: 0,
      contactNotes: body.contactNotes || [],
    });

    return NextResponse.json({ success: true, prospect: item }, { status: 201 });
  } catch (error) {
    console.error('CRM create error:', error);
    return NextResponse.json({ error: 'Error interno en CRM' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const g = requireSession(req, STAFF_ROLES);
  if (isGuardResponse(g)) return g;
  try {
    const body = await req.json();
    const { id, action, stage, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de prospecto requerido' }, { status: 400 });
    }

    if (action === 'update_stage' && stage) {
      const ok = crmStore.updateStage(id, stage);
      if (!ok) return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
      return NextResponse.json({ success: true, prospect: crmStore.getById(id) });
    }

    if (action === 'follow_up') {
      const res = crmStore.incrementFollowUp(id, note);
      if (!res.success) {
        return NextResponse.json({ error: res.error, count: res.count }, { status: 400 });
      }
      return NextResponse.json({ success: true, prospect: crmStore.getById(id) });
    }

    if (action === 'update_signals' && body.signals) {
      const updated = crmStore.updateSignals(id, body.signals);
      if (!updated) return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
      return NextResponse.json({ success: true, prospect: updated });
    }

    if (action === 'update_details' && body.details) {
      const updated = crmStore.updateDetails(id, body.details);
      if (!updated) return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
      return NextResponse.json({ success: true, prospect: updated });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (error) {
    console.error('CRM patch error:', error);
    return NextResponse.json({ error: 'Error interno en CRM' }, { status: 500 });
  }
}


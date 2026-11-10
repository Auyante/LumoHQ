import { NextRequest, NextResponse } from 'next/server';
import { clientProjectStore } from '@/lib/client-portal';
import { requireClientKey } from '@/lib/security/guard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, updates, key } = body;
    const denied = requireClientKey(req, clientId, key);
    if (denied) return denied;

    if (!clientId) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 });
    }

    // Only the yes/no items can be set from the browser. The photo count comes from real uploads
    // (/api/client/photos) and isComplete is computed on the server.
    const ALLOWED = ['napVerified', 'hoursSet', 'servicesMenuSet', 'serviceAreaSet', 'copyrightConfirmed'] as const;
    const clean: Record<string, boolean> = {};
    for (const k of ALLOWED) if (updates && typeof updates[k] === 'boolean') clean[k] = updates[k];

    const updated = clientProjectStore.updateDay1Checklist(clientId, clean);
    if (!updated) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project: updated,
      clockStatus: updated.clock.status,
      isPaused: updated.clock.isPaused,
      pauseReason: updated.clock.pauseReason,
    });
  } catch (error) {
    console.error('Checklist update error:', error);
    return NextResponse.json({ error: 'Error interno al actualizar checklist' }, { status: 500 });
  }
}


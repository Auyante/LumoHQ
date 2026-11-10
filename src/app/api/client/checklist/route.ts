import { NextRequest, NextResponse } from 'next/server';
import { clientProjectStore } from '@/lib/client-portal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, updates } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 });
    }

    const updated = clientProjectStore.updateDay1Checklist(clientId, updates || {});
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


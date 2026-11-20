import { NextResponse } from 'next/server';
import { getEventBus, listServices, serviceHealth } from '@/microservices';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/health — estado del ecosistema de microservicios (público, sin sesión).
 * Expone el registro de servicios y la salud del EventBus para los contenedores del compose.
 */
export async function GET() {
  const bus = getEventBus();
  return NextResponse.json(
    {
      ok: true,
      gateway: 'Lumo HQ API Gateway',
      version: 'v1',
      services: serviceHealth(),
      registry: listServices().map((s) => ({ name: s.name, description: s.description, subscribesTo: s.subscribesTo, emits: s.emits })),
      eventBus: { traceSize: bus.trace().length, breakers: bus.breakerStats() },
      timestampUtc: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}

import { SERVICE_NAMES, type ServiceName } from './events';

/**
 * Registro de microservicios. Cada facada se auto-registra al importarse; el gateway y el endpoint
 * /api/v1/health leen este registro para reportar el estado del ecosistema desacoplado.
 */

export interface ServiceDescriptor {
  name: ServiceName;
  description: string;
  /** Each service declares the events it listens to, for the health screen and tests. */
  subscribesTo: string[];
  /** Each service declares the events it emits. */
  emits: string[];
}

const registry = new Map<ServiceName, ServiceDescriptor>();

export function registerService(descriptor: ServiceDescriptor): void {
  registry.set(descriptor.name, descriptor);
}

export function listServices(): ServiceDescriptor[] {
  return SERVICE_NAMES.map((name) => registry.get(name)).filter((s): s is ServiceDescriptor => Boolean(s));
}

export function serviceHealth(): Record<ServiceName, { ready: boolean; description: string; subscribesTo: string[]; emits: string[] }> {
  const out = {} as Record<ServiceName, { ready: boolean; description: string; subscribesTo: string[]; emits: string[] }>;
  for (const name of SERVICE_NAMES) {
    const s = registry.get(name);
    out[name] = s
      ? { ready: true, description: s.description, subscribesTo: s.subscribesTo, emits: s.emits }
      : { ready: false, description: 'no registrado', subscribesTo: [], emits: [] };
  }
  return out;
}

/** Error de dominio con código HTTP, para que el gateway lo traduzca sin filtrar detalles. */
export class ServiceError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type Ok<T> = { ok: true; value: T };
export type Fail = { ok: false; status: number; error: string };
export type Result<T> = Ok<T> | Fail;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

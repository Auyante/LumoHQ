/**
 * LUMO HP — Arquitectura de microservicios desacoplados (punto de entrada público).
 * src/microservices/* expone el EventBus tipado, los seis servicios y el gateway de composición.
 */

export * from './events';
export * from './event-bus';
export {
  ServiceError,
  fail,
  listServices,
  ok,
  registerService,
  serviceHealth,
  type Fail,
  type Ok,
  type Result,
  type ServiceDescriptor,
} from './service';
export { microservices } from './gateway';

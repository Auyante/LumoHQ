import { biService } from './erp-bi';
import { billingService } from './erp-billing';
import { financeService } from './erp-finance';
import { opsService } from './erp-ops';
import { crmSalesService } from './crm-sales';
import { iamGatewayService } from './iam-gateway';
import { listServices, serviceHealth } from './service';

/**
 * API Gateway / composición del ecosistema de microservicios. Importar este módulo registra los
 * seis servicios y cablea sus suscripciones al EventBus. Es la única pieza que "conoce" a todos.
 */

export const microservices = {
  iam: iamGatewayService,
  crm: crmSalesService,
  billing: billingService,
  finance: financeService,
  ops: opsService,
  bi: biService,
};

export { listServices, serviceHealth };

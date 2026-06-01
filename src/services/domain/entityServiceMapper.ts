/**
 * Mapper para mapear nombres de entidades a servicios de dominio
 *
 * Este mapper permite que los componentes genéricos (EntityClient, CreateEntityForm, EditEntityForm)
 * usen servicios de dominio sin conocer sus nombres exactos.
 *
 * El mapper toma el nombre de entidad del config (ej: 'raw-material-receptions') y
 * lo mapea al service de dominio correspondiente (ej: rawMaterialReceptionService).
 */

interface DomainService {
  list?(filters?: unknown, pagination?: unknown): Promise<unknown>;
  getById?(id: number | string): Promise<unknown>;
  create?(data: Record<string, unknown>): Promise<unknown>;
  update?(id: number | string, data: Record<string, unknown>): Promise<unknown>;
  delete?(id: number | string): Promise<unknown>;
  getOptions?(): Promise<unknown>;
  [key: string]: unknown;
}

// Importar todos los servicios de dominio
import { supplierService } from './suppliers/supplierService';
import { paymentTermService } from './payment-terms/paymentTermService';
import { prospectCategoryService } from './prospect-categories/prospectCategoryService';
import { countryService } from './countries/countryService';
import { roleService } from './roles/roleService';
import { sessionService } from './sessions/sessionService';
import { userService } from './users/userService';
import { customerService } from './customers/customerService';
import { incotermService } from './incoterms/incotermService';
import { salespersonService } from './salespeople/salespersonService';
import { transportService } from './transports/transportService';
import { fieldOperatorAdminService } from './field-operators/fieldOperatorService';
// TODO: migrate to .ts
import { captureZoneService } from './capture-zones/captureZoneService';
// TODO: migrate to .ts
import { fishingGearService } from './fishing-gears/fishingGearService';
// TODO: migrate to .ts
import { ceboDispatchService } from './cebo-dispatches/ceboDispatchService';
// TODO: migrate to .ts
import { activityLogService } from './activity-logs/activityLogService';
// TODO: migrate to .ts
import { productCategoryService } from './product-categories/productCategoryService';
// TODO: migrate to .ts
import { productFamilyService } from './product-families/productFamilyService';
// TODO: migrate to .ts
import { speciesService } from './species/speciesService';
// TODO: migrate to .ts
import { taxService } from './taxes/taxService';
// TODO: migrate to .ts
import { employeeService } from './employees/employeeService';
// TODO: migrate to .ts
import { rawMaterialReceptionService } from './raw-material-receptions/rawMaterialReceptionService';
// TODO: migrate to .ts
import { orderService } from './orders/orderService';
// TODO: migrate to .ts
import { boxService } from './boxes/boxService';
// TODO: migrate to .ts
import { palletService } from './pallets/palletService';
// TODO: migrate to .ts
import { storeService } from './stores/storeService';
// TODO: migrate to .ts
import { productService } from './products/productService';
// TODO: migrate to .ts
import { productionService } from './productions/productionService';
// TODO: migrate to .ts
import { punchService } from './punches/punchService';
// TODO: migrate to .ts
import { externalUserService } from './external-users/externalUserService';

/**
 * Mapa de nombres de entidades a servicios de dominio
 *
 * Clave: nombre de entidad del config (ej: 'raw-material-receptions')
 * Valor: objeto service de dominio
 */
const entityServiceMap: Record<string, DomainService> = {
  suppliers: supplierService,
  'capture-zones': captureZoneService,
  'fishing-gears': fishingGearService,
  'cebo-dispatches': ceboDispatchService,
  'activity-logs': activityLogService,
  'product-categories': productCategoryService,
  'product-families': productFamilyService,
  'payment-terms': paymentTermService,
  'prospect-categories': prospectCategoryService,
  species: speciesService,
  transports: transportService,
  taxes: taxService,
  incoterms: incotermService,
  salespeople: salespersonService,
  products: productService,
  employees: employeeService,
  customers: customerService,
  stores: storeService,
  'raw-material-receptions': rawMaterialReceptionService,
  orders: orderService,
  boxes: boxService,
  countries: countryService,
  pallets: palletService,
  productions: productionService,
  punches: punchService,
  roles: roleService,
  sessions: sessionService,
  users: userService,
  'external-users': externalUserService,
  'field-operators': fieldOperatorAdminService,
};

/**
 * Obtiene el servicio de dominio para una entidad
 *
 * @param entityName - Nombre de la entidad del config (ej: 'raw-material-receptions')
 * @returns Service de dominio o null si no existe
 *
 * @example
 * const service = getEntityService('suppliers');
 * const result = await service.list({ search: 'ACME' }, { page: 1, perPage: 10 });
 */
export function getEntityService(entityName: string): DomainService | null {
  if (!entityName) {
    console.error('getEntityService: entityName is required');
    return null;
  }

  const service = entityServiceMap[entityName];

  if (!service) {
    console.warn(`getEntityService: No service found for entity "${entityName}"`);
    console.warn('Available entities:', Object.keys(entityServiceMap));
    return null;
  }

  return service;
}

/**
 * Verifica si existe un servicio de dominio para una entidad
 *
 * @param entityName - Nombre de la entidad del config
 * @returns True si existe el servicio, false en caso contrario
 */
export function hasEntityService(entityName: string): boolean {
  return Boolean(entityName && entityName in entityServiceMap);
}

/**
 * Obtiene la lista de entidades con servicios de dominio disponibles
 *
 * @returns Array de nombres de entidades
 */
export function getAvailableEntities(): string[] {
  return Object.keys(entityServiceMap);
}

export { entityServiceMap };

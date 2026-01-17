/**
 * Mapper para mapear nombres de entidades a servicios de dominio
 * 
 * Este mapper permite que los componentes genéricos (EntityClient, CreateEntityForm, EditEntityForm)
 * usen servicios de dominio sin conocer sus nombres exactos.
 * 
 * El mapper toma el nombre de entidad del config (ej: 'raw-material-receptions') y
 * lo mapea al service de dominio correspondiente (ej: rawMaterialReceptionService).
 */

// Importar todos los servicios de dominio
import { supplierService } from './suppliers/supplierService';
import { captureZoneService } from './capture-zones/captureZoneService';
import { fishingGearService } from './fishing-gears/fishingGearService';
import { ceboDispatchService } from './cebo-dispatches/ceboDispatchService';
import { activityLogService } from './activity-logs/activityLogService';
import { productCategoryService } from './product-categories/productCategoryService';
import { productFamilyService } from './product-families/productFamilyService';
import { paymentTermService } from './payment-terms/paymentTermService';
import { speciesService } from './species/speciesService';
import { transportService } from './transports/transportService';
import { taxService } from './taxes/taxService';
import { incotermService } from './incoterms/incotermService';
import { salespersonService } from './salespeople/salespersonService';
import { productService } from './products/productService';
import { employeeService } from './employees/employeeService';
import { customerService } from './customers/customerService';
import { storeService } from './stores/storeService';
import { rawMaterialReceptionService } from './raw-material-receptions/rawMaterialReceptionService';
import { orderService } from './orders/orderService';
import { boxService } from './boxes/boxService';
import { countryService } from './countries/countryService';
import { palletService } from './pallets/palletService';
import { productionService } from './productions/productionService';
import { punchService } from './punches/punchService';
import { roleService } from './roles/roleService';
import { sessionService } from './sessions/sessionService';
import { userService } from './users/userService';

/**
 * Mapa de nombres de entidades a servicios de dominio
 * 
 * Clave: nombre de entidad del config (ej: 'raw-material-receptions')
 * Valor: objeto service de dominio
 */
const entityServiceMap = {
    'suppliers': supplierService,
    'capture-zones': captureZoneService,
    'fishing-gears': fishingGearService,
    'cebo-dispatches': ceboDispatchService,
    'activity-logs': activityLogService,
    'product-categories': productCategoryService,
    'product-families': productFamilyService,
    'payment-terms': paymentTermService,
    'species': speciesService,
    'transports': transportService,
    'taxes': taxService,
    'incoterms': incotermService,
    'salespeople': salespersonService,
    'products': productService,
    'employees': employeeService,
    'customers': customerService,
    'stores': storeService,
    'raw-material-receptions': rawMaterialReceptionService,
    'orders': orderService,
    'boxes': boxService,
    'countries': countryService,
    'pallets': palletService,
    'productions': productionService,
    'punches': punchService,
    'roles': roleService,
    'sessions': sessionService,
    'users': userService,
};

/**
 * Obtiene el servicio de dominio para una entidad
 * 
 * @param {string} entityName - Nombre de la entidad del config (ej: 'raw-material-receptions')
 * @returns {Object|null} Service de dominio o null si no existe
 * 
 * @example
 * const service = getEntityService('suppliers');
 * const result = await service.list({ search: 'ACME' }, { page: 1, perPage: 10 });
 */
export function getEntityService(entityName) {
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
 * @param {string} entityName - Nombre de la entidad del config
 * @returns {boolean} True si existe el servicio, false en caso contrario
 */
export function hasEntityService(entityName) {
    return entityName && entityName in entityServiceMap;
}

/**
 * Obtiene la lista de entidades con servicios de dominio disponibles
 * 
 * @returns {Array<string>} Array de nombres de entidades
 */
export function getAvailableEntities() {
    return Object.keys(entityServiceMap);
}

/**
 * Exportar el mapa completo (útil para debugging)
 */
export { entityServiceMap };


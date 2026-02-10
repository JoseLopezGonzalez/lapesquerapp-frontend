/**
 * Tools genéricas para operaciones CRUD en entidades del ERP
 * 
 * Estas tools actúan como puente entre el AI Chat y los servicios de dominio.
 * Usan el entityServiceMapper para obtener el servicio correcto dinámicamente.
 * 
 * El AI Chat nunca conoce URLs, endpoints ni detalles técnicos.
 * Solo trabaja con semántica de negocio (entidades, filtros, paginación).
 */

import { getEntityService, getAvailableEntities } from '@/services/domain/entityServiceMapper';
import { z } from 'zod';

/**
 * Lista de entidades disponibles para el AI
 * Array literal para usar en z.enum()
 */
const AVAILABLE_ENTITIES = [
  'suppliers', 'capture-zones', 'fishing-gears', 'cebo-dispatches',
  'activity-logs', 'product-categories', 'product-families', 'payment-terms',
  'species', 'transports', 'taxes', 'incoterms', 'salespeople', 'products',
  'employees', 'customers', 'stores', 'raw-material-receptions', 'orders',
  'boxes', 'countries', 'pallets', 'productions', 'punches',
  'sessions', 'users'
];

/**
 * Tools genéricas para entidades
 */
export const entityTools = {
  /**
   * Lista entidades de un tipo específico con filtros opcionales
   */
  listEntities: {
    description: `Lista entidades de un tipo específico con filtros opcionales. 
    
Entidades disponibles: ${AVAILABLE_ENTITIES.join(', ')}.

Ejemplos de uso:
- "Lista los proveedores"
- "Muéstrame los pedidos activos"
- "Busca clientes cuyo nombre contenga 'Pesca'"`,
    
    // ⚠️ CRÍTICO: OpenAI Responses API (GPT-5) es muy estricto con JSON Schema
    // Objetos anidados opcionales pueden causar type: "None"
    // Simplificamos el schema: en lugar de objetos opcionales, todos los campos son opcionales en el nivel raíz
    parameters: z.object({
      entityType: z.enum(AVAILABLE_ENTITIES),
      // Campos de filtros como propiedades opcionales directas (no objeto anidado)
      search: z.string().optional(),
      ids: z.array(z.number()).optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      // Campos de paginación como propiedades opcionales directas
      page: z.number().optional(),
      perPage: z.number().optional(),
    }),

    execute: async ({ entityType, search, ids, status, dateFrom, dateTo, page, perPage }) => {
      const service = getEntityService(entityType);
      if (!service) {
        throw new Error(`No se encontró servicio para la entidad: ${entityType}`);
      }

      // Reconstruir filtros desde propiedades individuales
      const filters = {};
      if (search) filters.search = search;
      if (ids) filters.ids = ids;
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      
      // Adaptar filtros si es necesario (algunos servicios esperan formatos específicos)
      const adaptedFilters = { ...filters };
      
      // Si hay dates, algunas entidades las esperan en formato dates.start/dates.end
      if (dateFrom || dateTo) {
        adaptedFilters.dates = {
          start: dateFrom,
          end: dateTo,
        };
        delete adaptedFilters.dateFrom;
        delete adaptedFilters.dateTo;
      }

      // ✅ Aplicar defaults en execute (no en el schema)
      const pagination = {
        page: page ?? 1,
        perPage: perPage ?? 12,
      };

      const result = await service.list(adaptedFilters, pagination);
      
      // Devolver en formato estructurado
      return {
        success: true,
        data: result.data || [],
        meta: result.meta || {},
        entityType,
      };
    },
  },

  /**
   * Obtiene una entidad específica por ID
   */
  getEntity: {
    description: `Obtiene una entidad específica por su ID.

Ejemplos de uso:
- "Muéstrame el pedido con ID 123"
- "Dame los detalles del proveedor número 45"
- "Consulta el cliente con ID 67"`,

    parameters: z.object({
      entityType: z.enum(AVAILABLE_ENTITIES),
      id: z.number().int().positive(),
    }),

    execute: async ({ entityType, id }) => {
      const service = getEntityService(entityType);
      if (!service) {
        throw new Error(`No se encontró servicio para la entidad: ${entityType}`);
      }

      const result = await service.getById(id);
      
      return {
        success: true,
        data: result,
        entityType,
        id,
      };
    },
  },

  /**
   * Obtiene opciones de autocompletado para una entidad
   */
  getEntityOptions: {
    description: `Obtiene opciones de autocompletado para una entidad (útil para dropdowns y búsquedas).

Útil cuando el usuario pregunta sobre opciones disponibles o necesita seleccionar algo.`,

    parameters: z.object({
      entityType: z.enum(AVAILABLE_ENTITIES),
    }),

    execute: async ({ entityType }) => {
      const service = getEntityService(entityType);
      if (!service || !service.getOptions) {
        throw new Error(`La entidad ${entityType} no soporta obtener opciones`);
      }

      const options = await service.getOptions();
      
      return {
        success: true,
        options: options || [],
        entityType,
      };
    },
  },
};


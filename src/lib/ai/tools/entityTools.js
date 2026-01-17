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
 */
const AVAILABLE_ENTITIES = getAvailableEntities();

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
    
    parameters: z.object({
      entityType: z.enum(AVAILABLE_ENTITIES, {
        description: 'Tipo de entidad a listar',
      }),
      filters: z.object({
        search: z.string().optional().describe('Texto de búsqueda general'),
        ids: z.array(z.number()).optional().describe('Array de IDs específicos a buscar'),
        // Filtros comunes que muchas entidades soportan
        status: z.string().optional().describe('Estado o filtro de estado (ej: "pending", "finished")'),
        dateFrom: z.string().optional().describe('Fecha inicio en formato YYYY-MM-DD'),
        dateTo: z.string().optional().describe('Fecha fin en formato YYYY-MM-DD'),
      }).optional().describe('Filtros de búsqueda'),
      pagination: z.object({
        page: z.number().optional().default(1).describe('Número de página'),
        perPage: z.number().optional().default(12).describe('Elementos por página'),
      }).optional().describe('Opciones de paginación'),
    }),

    execute: async ({ entityType, filters = {}, pagination = {} }) => {
      const service = getEntityService(entityType);
      if (!service) {
        throw new Error(`No se encontró servicio para la entidad: ${entityType}`);
      }

      // Adaptar filtros si es necesario (algunos servicios esperan formatos específicos)
      const adaptedFilters = { ...filters };
      
      // Si hay dates, algunas entidades las esperan en formato dates.start/dates.end
      if (filters.dateFrom || filters.dateTo) {
        adaptedFilters.dates = {
          start: filters.dateFrom,
          end: filters.dateTo,
        };
        delete adaptedFilters.dateFrom;
        delete adaptedFilters.dateTo;
      }

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
      entityType: z.enum(AVAILABLE_ENTITIES, {
        description: 'Tipo de entidad',
      }),
      id: z.number().int().positive().describe('ID de la entidad'),
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
      entityType: z.enum(AVAILABLE_ENTITIES, {
        description: 'Tipo de entidad',
      }),
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


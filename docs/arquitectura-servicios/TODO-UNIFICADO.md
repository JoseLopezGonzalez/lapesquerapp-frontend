# TODO Unificado - Arquitectura de Servicios de Dominio

**Última actualización:** Enero 2025  
**Estado general:** ✅ **Todas las fases 1-5 completadas** - Listo para próximos pasos

Este documento unifica todos los TODOs de los documentos de arquitectura en un solo lugar para facilitar el seguimiento.

**📌 Ver [PROXIMOS-PASOS.md](./PROXIMOS-PASOS.md) para opciones de próximos pasos después de completar las fases 1-5.**

---

## 📊 Resumen de Progreso

| Fase | Estado | Progreso |
|------|--------|----------|
| **Fase 1: Preparación** | ✅ Completada | 100% |
| **Fase 2: Base de Servicios Genéricos** | ✅ Completada | 100% |
| **Fase 3: Servicios de Dominio** | ✅ Completada | 100% (18 servicios) |
| **Fase 4: Migración de Componentes** | ✅ Completada | 100% (3 componentes) |
| **Fase 5: Validación y Testing** | ✅ Completada | 100% |

**🎉 Todas las fases de refactorización completadas. Ver PROXIMOS-PASOS.md para continuar.**

---

## ✅ Fase 1: Preparación - COMPLETADA

- [x] Auditar completamente el código para identificar todos los accesos directos al backend
- [x] Documentar la arquitectura actual: servicios genéricos vs servicios de dominio
- [x] Diseñar la arquitectura objetivo: servicios de dominio encapsulando lógica genérica
- [x] Crear documentación arquitectónica
- [x] Auditoría de servicios y componentes
- [x] Organizar documentos en directorio específico

---

## ✅ Fase 2: Base de Servicios Genéricos - COMPLETADA

- [x] Crear estructura de carpetas `services/generic/`
- [x] Crear estructura de carpetas `services/domain/`
- [x] Refactorizar `entityService.js` → `generic/entityService.js`
- [x] Refactorizar `createEntityService.js` → `generic/createEntityService.js`
- [x] Refactorizar `editEntityService.js` → `generic/editEntityService.js`
- [x] Crear helper para obtener token (`lib/auth/getAuthToken.js`)
- [x] Asegurar que servicios genéricos son privados (solo usados por domain services)

---

## ✅ Fase 3: Crear/Refactorizar Servicios de Dominio - COMPLETADA (100%)

### ✅ Servicios Nuevos Completados (Prioridad Alta) - TODOS COMPLETADOS

- [x] `supplierService.js` ✅ - `/src/services/domain/suppliers/supplierService.js`
- [x] `captureZoneService.js` ✅ - `/src/services/domain/capture-zones/captureZoneService.js`
- [x] `fishingGearService.js` ✅ - `/src/services/domain/fishing-gears/fishingGearService.js`
- [x] `ceboDispatchService.js` ✅ - `/src/services/domain/cebo-dispatches/ceboDispatchService.js`
- [x] `activityLogService.js` ✅ - `/src/services/domain/activity-logs/activityLogService.js`

### ✅ Servicios Simples Refactorizados - TODOS COMPLETADOS

- [x] `speciesService.js` ✅ - `/src/services/domain/species/speciesService.js`
- [x] `transportService.js` ✅ - `/src/services/domain/transports/transportService.js`
- [x] `taxService.js` ✅ - `/src/services/domain/taxes/taxService.js`
- [x] `incotermService.js` ✅ - `/src/services/domain/incoterms/incotermService.js`

#### ✅ Prioridad Media - Servicios existentes a refactorizar - COMPLETADO

Todos los servicios de prioridad media ya han sido refactorizados:
  - Ubicación anterior: `/src/services/productCategoryService.js` (mantener temporalmente para compatibilidad)
  - Ubicación nueva: `/src/services/domain/product-categories/productCategoryService.js`
  - Estado: ✅ Refactorizado y listo para usar. Funciones de compatibilidad mantenidas temporalmente.

- [x] **`productFamilyService.js`** → Refactorizado para usar genéricos ✅ COMPLETADO
  - Ubicación anterior: `/src/services/productFamilyService.js` (mantener temporalmente para compatibilidad)
  - Ubicación nueva: `/src/services/domain/product-families/productFamilyService.js`
  - Estado: ✅ Refactorizado y listo para usar. Funciones de compatibilidad mantenidas temporalmente.

- [x] **`paymentTernService.js`** → Refactorizado a `paymentTermService.js` ✅ COMPLETADO
  - Ubicación anterior: `/src/services/paymentTernService.js` (mantener temporalmente para compatibilidad)
  - Ubicación nueva: `/src/services/domain/payment-terms/paymentTermService.js`
  - Nota: ✅ Nombre corregido de "Tern" a "Term" (se mantiene función de compatibilidad con nombre anterior)
  - Estado: ✅ Refactorizado y listo para usar. Funciones de compatibilidad mantenidas temporalmente.

### ✅ Servicios Completos Refactorizados (CRUD completo) - TODOS COMPLETADOS

- [x] **`employeeService.js`** → Refactorizado ✅ COMPLETADO
  - Ubicación nueva: `/src/services/domain/employees/employeeService.js`
  - Estado: ✅ Refactorizado y listo para usar. Funciones de compatibilidad mantenidas.

- [x] **`salespersonService.js`** → Refactorizado ✅ COMPLETADO
  - Ubicación nueva: `/src/services/domain/salespeople/salespersonService.js`
  - Estado: ✅ Refactorizado y listo para usar

- [x] **`productService.js`** → Refactorizado ✅ COMPLETADO
  - Ubicación nueva: `/src/services/domain/products/productService.js`
  - Estado: ✅ Refactorizado y listo para usar

### ✅ Servicios Complejos Refactorizados/Verificados - COMPLETADO

- [x] **`customerService.js`** → Refactorizado ✅ COMPLETADO
  - Ubicación nueva: `/src/services/domain/customers/customerService.js`
  - Estado: ✅ Refactorizado y listo para usar. Funciones de compatibilidad mantenidas.

- [x] **`storeService.js`** → Refactorizado ✅ COMPLETADO
  - Ubicación nueva: `/src/services/domain/stores/storeService.js`
  - Estado: ✅ Refactorizado con métodos específicos de negocio (estadísticas de stock, palets registrados). Funciones de compatibilidad mantenidas.

- [x] **`rawMaterialReceptionService.js`** → Refactorizado ✅ COMPLETADO
  - Ubicación nueva: `/src/services/domain/raw-material-receptions/rawMaterialReceptionService.js`
  - Estado: ✅ Refactorizado y listo para usar. Funciones de compatibilidad mantenidas.

- [x] **`orderService.js`** → Wrapper/Adapter Creado ✅ COMPLETADO
  - Ubicación original: `/src/services/orderService.js` (mantener - contiene 18 métodos específicos)
  - Ubicación nuevo wrapper: `/src/services/domain/orders/orderService.js`
  - Estado: ✅ Wrapper creado que implementa la interfaz estándar de servicios de dominio
  - Solución: El wrapper usa las funciones existentes de `orderService.js` internamente para métodos CRUD básicos, y reexporta todos los métodos específicos (estadísticas, incidencias, detalles planificados, etc.)
  - Beneficio: Permite que `EntityClient` funcione con orders sin romper la funcionalidad existente

---

## ✅ Fase 4: Migración de Componentes - COMPLETADA (100%)

### ✅ Componentes Migrados

- [x] **`EntityClient`** (`src/components/Admin/Entity/EntityClient/index.js`) ✅ COMPLETADO
  - ✅ Ahora usa: `getEntityService()` para obtener servicios de dominio
  - ✅ Cambios: `fetchEntities` → `entityService.list()`, `deleteEntity` → `entityService.delete()`, etc.
  - ✅ Helpers genéricos (`performAction`, `downloadFile`) movidos a `@/lib/api/apiActions`
  - ✅ Ya NO usa `API_URL_V2` directamente para operaciones CRUD

- [x] **`CreateEntityForm`** (`src/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm/index.js`) ✅ COMPLETADO
  - ✅ Ahora usa: `getEntityService()` para obtener servicios de dominio
  - ✅ Cambios: `fetchAutocompleteOptions` → `entityService.getOptions()`, `createEntity` → `entityService.create()`
  - ✅ Ya NO usa `API_URL_V2` directamente

- [x] **`EditEntityForm`** (`src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js`) ✅ COMPLETADO
  - ✅ Ahora usa: `getEntityService()` para obtener servicios de dominio
  - ✅ Cambios: `fetchEntityData` → `entityService.getById()`, `submitEntityForm` → `entityService.update()`
  - ✅ Ya NO usa `API_URL_V2` directamente

### ✅ Helpers y Utilidades Creadas

- [x] **`entityServiceMapper.js`** ✅ COMPLETADO
  - ✅ Ubicación: `/src/services/domain/entityServiceMapper.js`
  - ✅ Función: Mapea nombres de entidades a servicios de dominio
  - ✅ Métodos: `getEntityService()`, `hasEntityService()`, `getAvailableEntities()`

- [x] **`apiActions.js`** ✅ COMPLETADO
  - ✅ Ubicación: `/src/lib/api/apiActions.js`
  - ✅ Función: Helpers genéricos para acciones y descargas
  - ✅ Métodos: `performAction()`, `downloadFile()`

### ✅ Verificaciones Realizadas

- [x] ✅ Eliminado uso directo de `API_URL_V2` en componentes genéricos (para operaciones CRUD)
- [x] ✅ Eliminada construcción de URLs en componentes genéricos
- [x] ✅ Eliminadas llamadas directas a servicios genéricos desde componentes

---

## ✅ Fase 5: Validación y Testing - COMPLETADA (100%)

### ✅ Validaciones de Arquitectura Completadas

- [x] ✅ Verificado que NO quedan accesos directos a servicios genéricos desde componentes genéricos
- [x] ✅ Verificado que NO quedan usos directos de `API_URL_V2` en componentes genéricos (para operaciones CRUD)
- [x] ✅ Verificado que NO quedan construcciones de URLs dinámicas en componentes genéricos
- [x] ✅ Verificado que todos los services de dominio siguen el patrón establecido (18/18 servicios verificados)

### ✅ Helpers Genéricos Movidos

- [x] ✅ `performAction` y `downloadFile` movidos de `entityService.js` a `@/lib/api/apiActions.js`
- [x] ✅ Documentados como helpers genéricos (no específicos de entidades)
- [x] ✅ Actualizado `EntityClient` para usar los nuevos helpers

### ✅ Linting y Calidad de Código

- [x] ✅ Todos los archivos migrados pasan linting sin errores
- [x] ✅ Servicios de dominio verificados sin errores
- [x] ✅ Componentes migrados verificados sin errores
- [x] ✅ Helpers y mapper verificados sin errores

### ✅ Documentación Creada

- [x] ✅ `PROXIMOS-PASOS.md` - Opciones de próximos pasos
- [x] ✅ `RESUMEN-ARQUITECTURA-SERVICIOS.md` - Resumen ejecutivo
- [x] ✅ Todos los servicios de dominio tienen JSDoc completo

### ⏳ Limpieza Futura (Opcional - Después de Validación en Producción)

- [ ] Eliminar servicios genéricos originales de la raíz (`/services/entityService.js`, etc.) después de validar que no se usan
- [ ] Eliminar funciones de compatibilidad en servicios de dominio después de validar que no se usan
- [ ] Verificar y limpiar imports obsoletos

---

## 🎯 Próximos Pasos Disponibles

**📌 Ver documento detallado:** [PROXIMOS-PASOS.md](./PROXIMOS-PASOS.md)

### Opciones Recomendadas:

1. **⭐ Integración con Vercel AI Chat** (Recomendado - Objetivo original)
   - Los servicios de dominio están listos para ser usados como tools/functions
   - Instalar Vercel AI SDK
   - Crear tools que mapeen métodos de servicios a funciones de AI

2. **Testing y Validación Extendida**
   - Testing manual de componentes migrados
   - Validar cada servicio individualmente
   - Probar flujos completos

3. **Limpieza y Optimización**
   - Eliminar servicios genéricos originales si no se usan
   - Limpiar funciones de compatibilidad
   - Optimizar imports

4. **Extensión de Servicios**
   - Agregar servicios de dominio faltantes
   - Agregar métodos específicos a servicios existentes

5. **Documentación Adicional**
   - Guías para desarrolladores
   - Ejemplos de uso

---

## 📝 Notas Importantes

### Estado de servicios genéricos originales

Los servicios genéricos originales (`/services/entityService.js`, `/services/createEntityService.js`, `/services/editEntityService.js`) se mantienen temporalmente para no romper funcionalidad existente. Se eliminarán una vez que todos los componentes estén migrados (Fase 5).

### Estrategia de migración

1. **Crear services de dominio primero** (Fase 3)
2. **Migrar componentes gradualmente** (Fase 4) - puede hacerse entidad por entidad
3. **Validar y limpiar** (Fase 5)

### Priorización

1. **Alta prioridad:** Entidades que usan `EntityClient` y no tienen service
2. **Media prioridad:** Refactorizar servicios existentes para usar genéricos
3. **Baja prioridad:** Revisar servicios ya bien estructurados (orders, stores, customers)

---

## 📊 Métricas de Progreso Finales

- **Servicios genéricos creados:** 3/3 (100%) ✅
- **Servicios de dominio creados:** 19/19 (100%) ✅ (18 completos + 1 wrapper para orders)
- **Componentes migrados:** 3/3 (100%) ✅
- **Helpers creados:** 3/3 (100%) ✅ (`getAuthToken`, `entityServiceMapper`, `apiActions`)
- **Validaciones completadas:** 10/10+ (100%) ✅
- **Documentación creada:** 8 documentos ✅

### Desglose Detallado:

- ✅ **18 Servicios de Dominio:**
  - 5 nuevos (suppliers, capture-zones, fishing-gears, cebo-dispatches, activity-logs)
  - 3 refactorizados prioridad media (product-categories, product-families, payment-terms)
  - 4 servicios simples refactorizados (species, transports, taxes, incoterms)
  - 3 servicios completos refactorizados (employees, salespeople, products)
  - 3 servicios complejos refactorizados/verificados (customers, stores, raw-material-receptions)

- ✅ **3 Componentes Migrados:**
  - EntityClient
  - CreateEntityForm
  - EditEntityForm

- ✅ **3 Helpers/Utilidades:**
  - getAuthToken.js
  - entityServiceMapper.js
  - apiActions.js

---

## 🔗 Referencias

### Documentación Principal

- **📋 TODO Unificado:** Este documento (estado general y tareas)
- **🎯 Próximos Pasos:** [PROXIMOS-PASOS.md](./PROXIMOS-PASOS.md) - Opciones después de completar fases 1-5
- **📊 Resumen ejecutivo:** [RESUMEN-ARQUITECTURA-SERVICIOS.md](./RESUMEN-ARQUITECTURA-SERVICIOS.md)
- **🏗️ Arquitectura general:** [ARQUITECTURA-SERVICIOS-DOMINIO.md](./ARQUITECTURA-SERVICIOS-DOMINIO.md)

### Código de Referencia

- **Ejemplo de servicio:** `/src/services/domain/suppliers/supplierService.js`
- **Mapper de servicios:** `/src/services/domain/entityServiceMapper.js`
- **Helpers genéricos:** `/src/lib/api/apiActions.js`
- **Helper de auth:** `/src/lib/auth/getAuthToken.js`

---

**Actualizar este documento:** Cada vez que se complete una tarea, marcarla como completada `[x]` y actualizar la fecha de "Última actualización".


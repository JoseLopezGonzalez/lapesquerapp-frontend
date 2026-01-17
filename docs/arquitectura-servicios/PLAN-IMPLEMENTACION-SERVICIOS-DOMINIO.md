# Plan de Implementación - Servicios de Dominio

**Estado:** En progreso  
**Última actualización:** Diciembre 2024

---

## 📋 Resumen Ejecutivo

Este documento detalla el plan paso a paso para refactorizar la arquitectura de servicios, encapsulando la lógica genérica detrás de servicios de dominio semánticos.

---

## 🔍 Auditoría Inicial

### Entidades que usan EntityClient (genérico)

1. `raw-material-receptions` - ✅ Tiene `rawMaterialReceptionService.js`
2. `capture-zones` - ❌ Necesita service
3. `fishing-gears` - ❌ Necesita service  
4. `payment-terms` - ✅ Tiene `paymentTernService.js`
5. `cebo-dispatches` - ❌ Necesita service
6. `activity-logs` - ❌ Necesita service
7. `product-categories` - ✅ Tiene `productCategoryService.js`
8. `product-families` - ✅ Tiene `productFamilyService.js`

### Servicios Genéricos Actuales

- ✅ `entityService.js` - `fetchEntities`, `deleteEntity`, `performAction`, `downloadFile`
- ✅ `createEntityService.js` - `createEntity`, `fetchAutocompleteOptions`
- ✅ `editEntityService.js` - `fetchEntityData`, `fetchAutocompleteOptions`, `submitEntityForm`

### Componentes que usan servicios genéricos directamente

- ❌ `EntityClient` (línea 15: `import { fetchEntities, deleteEntity, performAction, downloadFile }`)
- ❌ `CreateEntityForm` (línea 27: `import { fetchAutocompleteOptions, createEntity }`)
- ❌ `EditEntityForm` (línea 27: `import { fetchEntityData, fetchAutocompleteOptions, submitEntityForm }`)

---

## 🎯 Objetivos por Fase

### Fase 1: Preparación ✅ EN PROGRESO
- [x] Crear documentación arquitectónica
- [x] Auditoría de servicios y componentes
- [ ] Crear estructura de carpetas `services/generic/`
- [ ] Mover servicios genéricos a `services/generic/`

### Fase 2: Crear Base de Servicios Genéricos
- [ ] Refactorizar `entityService.js` → `generic/entityService.js`
- [ ] Refactorizar `createEntityService.js` → `generic/createEntityService.js`
- [ ] Refactorizar `editEntityService.js` → `generic/editEntityService.js`
- [ ] Crear helper para obtener token (`lib/auth/getAuthToken.js`)

### Fase 3: Crear/Refactorizar Servicios de Dominio
- [ ] Crear `supplierService.js` (para suppliers)
- [ ] Crear `captureZoneService.js` (para capture-zones)
- [ ] Crear `fishingGearService.js` (para fishing-gears)
- [ ] Crear `ceboDispatchService.js` (para cebo-dispatches)
- [ ] Crear `activityLogService.js` (para activity-logs)
- [ ] Refactorizar `productCategoryService.js` para usar genéricos
- [ ] Refactorizar `productFamilyService.js` para usar genéricos
- [ ] Refactorizar `paymentTernService.js` para usar genéricos

### Fase 4: Migración de Componentes
- [ ] Crear adapter/wrapper en `EntityClient` para usar services de dominio
- [ ] Migrar `CreateEntityForm` para usar services de dominio
- [ ] Migrar `EditEntityForm` para usar services de dominio
- [ ] Eliminar importaciones directas de servicios genéricos

### Fase 5: Validación y Testing
- [ ] Verificar que no quedan accesos directos a servicios genéricos
- [ ] Verificar que no quedan usos directos de `API_URL_V2` en componentes
- [ ] Testear cada entidad migrada
- [ ] Documentar cambios

---

## 🏗️ Estructura de Archivos Objetivo

```
/src/services/
  ├── generic/                           # NEW: Servicios genéricos (privados)
  │   ├── entityService.js              # Mover desde raíz
  │   ├── createEntityService.js        # Mover desde raíz
  │   └── editEntityService.js          # Mover desde raíz
  │
  ├── domain/                           # NEW: Servicios de dominio (públicos)
  │   ├── suppliers/
  │   │   └── supplierService.js        # NEW
  │   ├── capture-zones/
  │   │   └── captureZoneService.js     # NEW
  │   └── ...                           # Otros domains
  │
  ├── [existing services]               # Mantener, pero refactorizar para usar genéricos
  │   ├── productCategoryService.js     # Refactorizar
  │   ├── productFamilyService.js       # Refactorizar
  │   └── ...
```

---

## 📝 Notas de Implementación

### Patrón para Crear Service de Dominio

```javascript
// /src/services/domain/[entity]/[entity]Service.js
import { getAuthToken } from '@/lib/auth';
import { fetchEntitiesGeneric, deleteEntityGeneric, ... } from '@/services/generic/entityService';

const ENDPOINT = '[entity-endpoint]';

export const [entity]Service = {
  async list(filters = {}, pagination = {}) {
    const token = await getAuthToken();
    return fetchEntitiesGeneric(ENDPOINT, filters, pagination, token);
  },
  
  async getById(id) {
    // ...
  },
  
  async create(data) {
    // ...
  },
  
  // ... otros métodos
};
```

### Migración de Componente

**Antes:**
```javascript
import { fetchEntities } from '@/services/entityService';
import { API_URL_V2 } from '@/configs/config';

const url = `${API_URL_V2}${config.endpoint}`;
const result = await fetchEntities(url);
```

**Después:**
```javascript
import { [entity]Service } from '@/services/domain/[entity]/[entity]Service';

const result = await [entity]Service.list(filters, pagination);
```

---

## ⚠️ Consideraciones Importantes

1. **No romper funcionalidad existente**: Migrar gradualmente
2. **Mantener compatibilidad**: Los servicios genéricos deben seguir funcionando durante la transición
3. **Testing continuo**: Validar cada cambio antes de continuar
4. **Documentación**: Actualizar docs con cada servicio creado

---

## 🚀 Próximos Pasos Inmediatos

1. Crear carpeta `services/generic/`
2. Mover servicios genéricos a `services/generic/`
3. Crear helper `lib/auth/getAuthToken.js`
4. Crear primer service de dominio de ejemplo (suppliers)
5. Migrar un componente de prueba (EntityClient para suppliers)

---

**Estado actual:** Preparación y auditoría completadas. Listo para comenzar Fase 2.

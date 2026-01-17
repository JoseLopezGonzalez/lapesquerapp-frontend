# Arquitectura de Servicios de Dominio - Preparación para AI Chat

**Fecha:** Diciembre 2024  
**Objetivo:** Establecer una arquitectura de servicios de dominio que encapsule la lógica genérica y proporcione una base estable para la integración de Vercel AI Chat.

---

## 📋 Principios Arquitectónicos

### 1. **Capa de Servicios Semántica**
- Cada dominio funcional (orders, customers, stores, products, etc.) debe exponer su propio service
- Los services deben usar métodos con semántica de negocio, no técnica
- Los services ocultan detalles técnicos (URLs, endpoints, configuración dinámica)

### 2. **Encapsulación de Lógica Genérica**
- La lógica genérica (`entityService`, `createEntityService`, `editEntityService`) NO se elimina
- Se encapsula DENTRO de los services de dominio
- Los components y hooks NUNCA acceden directamente a servicios genéricos

### 3. **Contratos Estables**
- Los services deben tener contratos predecibles y estables
- Basados en la documentación "API References" pero sin exponerla
- Cambios internos en la lógica genérica no deben afectar los contratos públicos

### 4. **Consumo Dual**
- Los services deben funcionar tanto para componentes UI tradicionales
- Como para un asistente AI que funcionará mediante tools/functions
- El AI Chat nunca debe conocer URLs, endpoints ni lógica genérica

---

## 🏗️ Estructura Propuesta

```
/src/services/
  ├── domain/                    # Services de dominio (públicos)
  │   ├── orders/
  │   │   └── orderService.js    # Ya existe, bien estructurado ✅
  │   ├── customers/
  │   │   └── customerService.js # Ya existe, bien estructurado ✅
  │   ├── stores/
  │   │   └── storeService.js    # Ya existe, bien estructurado ✅
  │   ├── products/
  │   │   └── productService.js  # Ya existe, pero revisar
  │   ├── suppliers/
  │   │   └── supplierService.js # Crear si no existe
  │   └── ...
  │
  ├── generic/                   # Lógica genérica (privada, encapsulada)
  │   ├── entityService.js       # Renombrar/encapsular
  │   ├── createEntityService.js # Renombrar/encapsular
  │   └── editEntityService.js   # Renombrar/encapsular
  │
  └── [existing services]        # Mantener servicios específicos existentes
```

---

## 📐 Patrón de Service de Dominio

### Estructura Base

```javascript
// /src/services/domain/[domain]/[domain]Service.js

import { getAuthToken } from '@/lib/auth';
import { 
  fetchEntitiesGeneric,      // Privado
  createEntityGeneric,       // Privado
  editEntityGeneric,         // Privado
  deleteEntityGeneric        // Privado
} from '@/services/generic';

/**
 * Service de dominio para [Dominio]
 * Expone métodos semánticos de negocio
 * Oculta detalles técnicos de la API
 */
class DomainService {
  constructor() {
    this.endpoint = '[domain]/endpoint'; // Configuración privada
  }

  /**
   * Lista todas las entidades del dominio con filtros opcionales
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<Object>} Datos paginados
   */
  async list(filters = {}, pagination = {}) {
    const token = await getAuthToken();
    // Usa lógica genérica internamente
    return fetchEntitiesGeneric(this.endpoint, filters, pagination, token);
  }

  /**
   * Obtiene una entidad por ID
   * @param {string|number} id - ID de la entidad
   * @returns {Promise<Object>} Datos de la entidad
   */
  async getById(id) {
    const token = await getAuthToken();
    return editEntityGeneric(`${this.endpoint}/${id}`, token);
  }

  /**
   * Crea una nueva entidad
   * @param {Object} data - Datos de la entidad
   * @returns {Promise<Object>} Entidad creada
   */
  async create(data) {
    const token = await getAuthToken();
    return createEntityGeneric(this.endpoint, data, token);
  }

  /**
   * Actualiza una entidad existente
   * @param {string|number} id - ID de la entidad
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Entidad actualizada
   */
  async update(id, data) {
    const token = await getAuthToken();
    return editEntityGeneric(`${this.endpoint}/${id}`, data, 'PUT', token);
  }

  /**
   * Elimina una entidad
   * @param {string|number} id - ID de la entidad
   * @returns {Promise<void>}
   */
  async delete(id) {
    const token = await getAuthToken();
    return deleteEntityGeneric(`${this.endpoint}/${id}`, token);
  }

  /**
   * Obtiene opciones para autocompletado
   * @returns {Promise<Array<{value: any, label: string}>>}
   */
  async getOptions() {
    const token = await getAuthToken();
    return fetchAutocompleteGeneric(`${this.endpoint}/options`, token);
  }
}

// Exportar instancia singleton o funciones individuales
export const domainService = new DomainService();
// O exportar funciones individuales para mejor tree-shaking
export const {
  list: listDomainItems,
  getById: getDomainItem,
  create: createDomainItem,
  update: updateDomainItem,
  delete: deleteDomainItem,
  getOptions: getDomainOptions,
} = domainService;
```

---

## 🔄 Migración de Componentes

### Antes (❌ Incorrecto)

```javascript
// Componente usando servicios genéricos directamente
import { fetchEntities, deleteEntity } from '@/services/entityService';
import { API_URL_V2 } from '@/configs/config';

const url = `${API_URL_V2}${config.endpoint}`;
const result = await fetchEntities(url);
```

### Después (✅ Correcto)

```javascript
// Componente usando service de dominio
import { supplierService } from '@/services/domain/suppliers/supplierService';

const result = await supplierService.list(filters, pagination);
```

---

## 📝 Mapeo de Entidades a Services

### Entidades que necesitan services de dominio

| Entidad (entitiesConfig) | Service Existente | Acción Requerida |
|-------------------------|-------------------|------------------|
| `customers` | ✅ `customerService.js` | Revisar y asegurar que encapsula lógica genérica |
| `suppliers` | ❌ No existe | **Crear** `supplierService.js` |
| `products` | ✅ `productService.js` | Revisar y refactorizar si usa genéricos directamente |
| `species` | ✅ `speciesService.js` | Revisar y refactorizar |
| `transports` | ✅ `transportService.js` | Revisar y refactorizar |
| `taxes` | ✅ `taxService.js` | Revisar y refactorizar |
| `product-categories` | ✅ `productCategoryService.js` | Revisar y refactorizar |
| `product-families` | ✅ `productFamilyService.js` | Revisar y refactorizar |
| `employees` | ✅ `employeeService.js` | Revisar y refactorizar |
| `salespeople` | ✅ `salespersonService.js` | Revisar y refactorizar |
| `payment-terms` | ✅ `paymentTernService.js` | Revisar y refactorizar |
| `incoterms` | ✅ `incotermService.js` | Revisar y refactorizar |
| `raw-material-receptions` | ✅ `rawMaterialReceptionService.js` | Revisar estructura |

---

## 🎯 Plan de Implementación

### Fase 1: Auditoría y Análisis
- [x] Identificar todos los servicios existentes
- [x] Mapear entidades de `entitiesConfig` a services
- [ ] Identificar todos los componentes que usan servicios genéricos directamente
- [ ] Documentar contratos de API References

### Fase 2: Refactorización de Servicios Genéricos
- [ ] Mover `entityService.js` → `generic/entityService.js`
- [ ] Mover `createEntityService.js` → `generic/createEntityService.js`
- [ ] Mover `editEntityService.js` → `generic/editEntityService.js`
- [ ] Asegurar que son privados (no exportar desde `/services/index.js`)

### Fase 3: Creación/Refactorización de Services de Dominio
- [ ] Crear services faltantes (ej: `supplierService.js`)
- [ ] Refactorizar services existentes para encapsular lógica genérica
- [ ] Asegurar que todos exponen métodos semánticos de negocio

### Fase 4: Migración de Componentes
- [ ] Migrar `EntityClient` para usar services de dominio
- [ ] Migrar `CreateEntityForm` para usar services de dominio
- [ ] Migrar `EditEntityForm` para usar services de dominio
- [ ] Eliminar uso directo de `API_URL_V2` en componentes

### Fase 5: Validación y Testing
- [ ] Verificar que no quedan accesos directos a servicios genéricos
- [ ] Verificar que no quedan usos directos de `API_URL_V2` en componentes
- [ ] Validar que todos los services cumplen con API References
- [ ] Documentar cambios y migraciones

---

## 🔒 Restricciones Estrictas

### ❌ NO Permitido

1. **Acceso directo a servicios genéricos desde componentes**
   ```javascript
   // ❌ NO HACER
   import { fetchEntities } from '@/services/entityService';
   ```

2. **Construcción de URLs en componentes**
   ```javascript
   // ❌ NO HACER
   const url = `${API_URL_V2}${config.endpoint}`;
   ```

3. **Llamadas directas a `fetchWithTenant` desde componentes**
   ```javascript
   // ❌ NO HACER (excepto en services)
   import { fetchWithTenant } from '@/lib/fetchWithTenant';
   const response = await fetchWithTenant(url, options);
   ```

### ✅ Permitido

1. **Uso de services de dominio desde componentes**
   ```javascript
   // ✅ CORRECTO
   import { supplierService } from '@/services/domain/suppliers/supplierService';
   const suppliers = await supplierService.list();
   ```

2. **Services genéricos solo dentro de services de dominio**
   ```javascript
   // ✅ CORRECTO (dentro de domain service)
   import { fetchEntitiesGeneric } from '@/services/generic/entityService';
   ```

---

## 📚 Documentación de Servicios

Cada service de dominio debe documentar:

1. **Métodos públicos** con JSDoc
2. **Parámetros** esperados
3. **Retornos** prometidos
4. **Errores** que puede lanzar
5. **Ejemplos** de uso

---

## 🚀 Preparación para AI Chat

Una vez completada esta arquitectura:

- ✅ Los services de dominio pueden ser usados directamente por AI Chat tools
- ✅ No es necesario conocer URLs ni endpoints
- ✅ La semántica de negocio es clara y predecible
- ✅ Los cambios internos en la lógica genérica no afectan los contratos públicos
- ✅ La integración con Vercel AI SDK será directa y limpia

---

## 📌 Notas Importantes

1. **No eliminar la lógica genérica**: Debe mantenerse pero encapsulada
2. **Migración gradual**: No romper funcionalidad existente
3. **Testing continuo**: Validar cada cambio
4. **Documentación**: Actualizar docs con cada cambio

---

**Próximos Pasos:** Comenzar con la auditoría completa y luego implementar la Fase 2 (Refactorización de Servicios Genéricos).

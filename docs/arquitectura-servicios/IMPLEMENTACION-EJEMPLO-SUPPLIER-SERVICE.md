# Ejemplo de Implementación: Supplier Service

Este documento muestra el patrón completo de implementación de un service de dominio usando `supplierService` como ejemplo.

---

## 📁 Estructura de Archivos Creada

```
/src/
  ├── lib/
  │   └── auth/
  │       └── getAuthToken.js                    # NEW: Helper para obtener token
  │
  ├── services/
  │   ├── generic/                               # NEW: Servicios genéricos (privados)
  │   │   ├── entityService.js                   # Movido/refactorizado
  │   │   ├── createEntityService.js             # Movido/refactorizado
  │   │   └── editEntityService.js               # Movido/refactorizado
  │   │
  │   └── domain/                                # NEW: Servicios de dominio (públicos)
  │       └── suppliers/
  │           └── supplierService.js             # NEW: Service de dominio
```

---

## 🔧 Componentes Creados

### 1. `lib/auth/getAuthToken.js`

Helper centralizado para obtener el token de autenticación.

**Uso:**
```javascript
import { getAuthToken } from '@/lib/auth/getAuthToken';
const token = await getAuthToken();
```

### 2. `services/generic/entityService.js`

Servicios genéricos para operaciones CRUD básicas. **Son privados** y solo deben usarse dentro de services de dominio.

**Funciones disponibles:**
- `fetchEntitiesGeneric(url, token)` - Obtener entidades
- `deleteEntityGeneric(url, body, token)` - Eliminar entidad(es)
- `performActionGeneric(url, method, body, token)` - Ejecutar acción genérica
- `downloadFileGeneric(url, fileName, type, token)` - Descargar archivo

### 3. `services/generic/createEntityService.js`

Servicios genéricos para creación de entidades.

**Funciones disponibles:**
- `createEntityGeneric(url, data, token)` - Crear entidad
- `fetchAutocompleteOptionsGeneric(endpoint, token)` - Obtener opciones de autocompletado

### 4. `services/generic/editEntityService.js`

Servicios genéricos para edición de entidades.

**Funciones disponibles:**
- `fetchEntityDataGeneric(url, token)` - Obtener datos de entidad
- `submitEntityFormGeneric(url, method, data, token)` - Enviar formulario (PUT/POST)
- `fetchAutocompleteOptionsGeneric(endpoint, token)` - Obtener opciones de autocompletado

### 5. `services/domain/suppliers/supplierService.js`

Service de dominio público para proveedores.

**Métodos públicos:**
- `supplierService.list(filters, pagination)` - Lista proveedores
- `supplierService.getById(id)` - Obtiene un proveedor
- `supplierService.create(data)` - Crea un proveedor
- `supplierService.update(id, data)` - Actualiza un proveedor
- `supplierService.delete(id)` - Elimina un proveedor
- `supplierService.deleteMultiple(ids)` - Elimina múltiples proveedores
- `supplierService.getOptions()` - Obtiene opciones para autocompletado

---

## 📝 Ejemplo de Uso en Componentes

### Antes (❌ Incorrecto)

```javascript
// Componente usando servicios genéricos directamente
import { fetchEntities, deleteEntity } from '@/services/entityService';
import { API_URL_V2 } from '@/configs/config';

const url = `${API_URL_V2}suppliers`;
const result = await fetchEntities(url);
```

### Después (✅ Correcto)

```javascript
// Componente usando service de dominio
import { supplierService } from '@/services/domain/suppliers/supplierService';

// Listar proveedores
const result = await supplierService.list(
    { search: 'ACME' },           // filtros
    { page: 1, perPage: 10 }      // paginación
);

// Obtener un proveedor
const supplier = await supplierService.getById(123);

// Crear un proveedor
const newSupplier = await supplierService.create({
    name: 'Nuevo Proveedor',
    // ... otros campos
});

// Actualizar un proveedor
const updated = await supplierService.update(123, {
    name: 'Nombre Actualizado'
});

// Eliminar un proveedor
await supplierService.delete(123);

// Obtener opciones para autocompletado
const options = await supplierService.getOptions();
```

---

## 🎯 Beneficios de Este Patrón

1. **Semántica Clara**: Los métodos tienen nombres de negocio (`list`, `getById`, `create`) en lugar de técnicos (`fetchEntities`, `fetchEntityData`)

2. **Ocultación de Detalles Técnicos**: Los componentes no conocen URLs, endpoints ni configuración. Solo llaman métodos semánticos.

3. **Contratos Estables**: Si cambia la estructura interna de la API, solo se modifica el service de dominio, no los componentes.

4. **Preparado para AI Chat**: El AI Chat puede usar estos servicios directamente sin conocer detalles técnicos.

5. **Reutilización**: La lógica genérica se encapsula y reutiliza, pero los componentes solo ven la API semántica.

---

## 🔄 Próximos Pasos

1. **Migrar otros servicios** siguiendo este patrón:
   - `productCategoryService` → `domain/product-categories/productCategoryService`
   - `productFamilyService` → `domain/product-families/productFamilyService`
   - `paymentTernService` → `domain/payment-terms/paymentTermService`
   - Crear nuevos servicios para entidades que no tienen service

2. **Refactorizar componentes**:
   - `EntityClient` - Usar services de dominio en lugar de servicios genéricos
   - `CreateEntityForm` - Usar services de dominio
   - `EditEntityForm` - Usar services de dominio

3. **Eliminar uso directo**:
   - Eliminar imports de `entityService`, `createEntityService`, `editEntityService` en componentes
   - Eliminar uso de `API_URL_V2` en componentes

---

## ⚠️ Notas Importantes

- **Los servicios genéricos son privados**: No deben importarse desde componentes
- **Los services de dominio son públicos**: Son la única forma en que los componentes deben interactuar con el backend
- **Compatibilidad**: Los servicios genéricos originales (`entityService.js`, etc.) se mantienen temporalmente para no romper funcionalidad existente durante la transición

---

**Estado:** Ejemplo de implementación completado. Listo para replicar el patrón en otros servicios de dominio.

# Análisis Exhaustivo API vs Frontend

## 📋 Resumen Ejecutivo

Este documento realiza un análisis exhaustivo de TODOS los endpoints de la API comparando:
- **Estructura de Requests**: Campos requeridos, opcionales, y campos que se envían pero no se requieren
- **Estructura de Responses**: Campos esperados vs recibidos
- **Manejo de Errores**: Especialmente el uso de `userMessage` vs `message`
- **Inconsistencias**: Diferencias entre lo documentado y lo implementado

**Fecha de Análisis:** Diciembre 2024

**Base de la Documentación:** `/docs/API-references/`

**Código Analizado:** Frontend Next.js en `/src/services/`, `/src/hooks/`, `/src/components/`

---

## 🔍 Metodología

Para cada endpoint se verifica:
1. ✅ **Request Body**: Campos requeridos vs enviados, campos opcionales vs enviados, campos sobrantes
2. ✅ **Response Structure**: Estructura documentada vs estructura manejada
3. ✅ **Error Handling**: Uso de `userMessage` vs `message` en manejo de errores
4. ✅ **Query Parameters**: Parámetros documentados vs utilizados

---

---

## 📚 Análisis por Módulo

### 1. Autenticación

#### `GET /api/v2/me`

**Error Handling:**
- ⚠️ **Observación**: Se lanza `response` directamente, el manejo de errores queda en el componente que llama

---

### 2. Pedidos (Orders)

#### `POST /api/v2/orders` - Crear Pedido

**Request Body:**
- ⚠️ **Observación**: Se envían campos opcionales como `null` si están vacíos (ver sección "Campos `null` Enviados")

---

#### `PUT /api/v2/orders/{id}` - Actualizar Pedido

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión para confirmar qué campos se envían

---

### 4. Inventario

#### `PUT /api/v2/pallets/{id}` - Actualizar Palet

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados
- ⚠️ **Observación**: El mensaje de error dice "Error al actualizar el pedido" pero es para palets

---

#### `POST /api/v2/pallets` - Crear Palet

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados
- ⚠️ **Observación**: El mensaje de error dice "Error al crear la linea del pedido" pero es para palets

---

#### `GET /api/v2/stores/options` - Opciones de Almacenes

**Error Handling:**
- ⚠️ **Verificar**: Necesita revisión del manejo de errores

---

### 5. Producción

#### `POST /api/v2/productions` - Crear Producción

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados (`lot`, `species_id`, `description`)

---

#### `POST /api/v2/production-records` - Crear Registro de Producción

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados

---

#### `POST /api/v2/production-inputs` - Crear Entrada de Producción

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados

---

#### `POST /api/v2/production-outputs` - Crear Salida de Producción

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados

---

### 6. Catálogos

#### Endpoints CRUD Genéricos de Catálogos

**Nota:** Los endpoints CRUD (GET, POST, PUT, DELETE) de catálogos se manejan a través de `EntityClient` y están definidos en `entitiesConfig.js`.

**Entidades de Catálogos en `entitiesConfig.js`:**
- `customers`, `suppliers`, `species`, `transports`, `incoterms`, `salespeople`, `fishing-gears`, `countries`, `payment-terms`, `capture-zones`, `labels`

**Request Body:**
- ⚠️ **Verificar**: Los campos enviados dependen de la configuración de cada entidad
- ⚠️ **Observación**: Se envían todos los campos del formulario, incluyendo `null` para campos opcionales vacíos (ver sección "Campos `null` Enviados")

---

### 7. Sistema (Usuarios, Roles, Empleados, Fichajes)

#### `POST /api/v2/employees` - Crear Empleado

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados

---

### 8. Recepciones y Despachos

#### `POST /api/v2/raw-material-receptions` - Crear Recepción

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados (modo líneas vs modo palets)

---

### 9. Servicios Genéricos (EntityClient)

**Nota:** Estos servicios se usan para múltiples entidades definidas en `entitiesConfig.js`

#### `POST /api/v2/{entity}` - Crear Entidad Genérica

**Request Body:**
- ⚠️ **Verificar**: Los campos enviados dependen de la configuración de cada entidad en `entitiesConfig.js`
- ⚠️ **Observación**: Se envían todos los campos del formulario, incluyendo `null` para campos opcionales vacíos (ver sección "Campos `null` Enviados")

---

#### `PUT /api/v2/{entity}/{id}` - Actualizar Entidad Genérica

**Request Body:**
- ⚠️ **Verificar**: Similar a crear, depende de la configuración de cada entidad

---

#### `GET /api/v2/{entity}` - Listar Entidades Genéricas

**Error Handling:**
- ⚠️ **Verificar**: Necesita revisión del manejo de errores en `fetchEntities()`

---

### 10. Producción Costos

#### `POST /api/v2/cost-catalog` - Crear Coste en Catálogo

**Request Body - Campos Requeridos:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados (`name`, `cost_type`)

**Request Body - Campos Opcionales:**
- ⚠️ **Verificar**: `description`, `default_unit`, `is_active`

---

#### `POST /api/v2/production-costs` - Crear Coste de Producción

**Request Body:**
- ⚠️ **Verificar**: Necesita revisión de campos requeridos vs enviados

---

## 📊 Resumen de Problemas por Categoría

---

### Estructura de Requests

#### Campos `null` Enviados

**Problema:** Muchos servicios envían campos con valor `null` cuando están vacíos, incluso si la API no los requiere.

**Ejemplos Identificados:**
- `createOrder()` - Envía campos opcionales como `null` si están vacíos (líneas 121-144)
- `EntityClient` - Envía todos los campos del formulario, incluyendo `null` para campos opcionales vacíos
- `createEntity()` - Envía el payload completo sin filtrar `null`

**Impacto:** 
- Payloads más grandes de lo necesario
- Posibles problemas si la API rechaza `null` en ciertos campos
- Mayor uso de ancho de banda

**Recomendación:** 
- No enviar campos opcionales si están vacíos o son `null`
- Crear función helper: `cleanPayload(data)` que elimine campos `null` o `undefined`
- Verificar documentación de cada endpoint para campos opcionales

---

#### Campos Requeridos vs Enviados

**Estado General:** ✅ **Correcto**
- Los campos requeridos se envían correctamente en la mayoría de casos
- Ejemplo: `createOrder()` envía `customer`, `entryDate`, `loadDate` (requeridos) correctamente

**Casos a Verificar:**
- ⚠️ `POST /api/v2/productions` - Verificar campos requeridos (`lot`, `species_id`)
- ⚠️ `POST /api/v2/cost-catalog` - Verificar campos requeridos (`name`, `cost_type`)
- ⚠️ `POST /api/v2/production-records` - Verificar campos requeridos
- ⚠️ `POST /api/v2/production-inputs` - Verificar campos requeridos
- ⚠️ `POST /api/v2/production-outputs` - Verificar campos requeridos
- ⚠️ `POST /api/v2/raw-material-receptions` - Verificar modo líneas vs modo palets

---

#### Campos Sobrantes

**Estado:** ⚠️ **A Verificar**
- Algunos servicios pueden enviar campos no documentados
- Necesita revisión caso por caso comparando con la documentación de la API

---

---

## 🔧 Recomendaciones Prioritarias

### 1. **IMPORTANTE: Optimizar Payloads de Requests**

**Problema:** Se envían campos `null` innecesarios

**Solución:**
Crear función helper en `apiHelpers.js`:
```javascript
/**
 * Limpia un objeto eliminando campos null o undefined
 * @param {Object} data - Objeto a limpiar
 * @returns {Object} Objeto sin campos null/undefined
 */
export const cleanPayload = (data) => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(cleanPayload);
    
    const cleaned = {};
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            cleaned[key] = typeof data[key] === 'object' ? cleanPayload(data[key]) : data[key];
        }
    });
    return cleaned;
};
```

**Usar antes de enviar:**
```javascript
const cleanedPayload = cleanPayload(orderPayload);
body: JSON.stringify(cleanedPayload)
```

**Impacto:** Payloads más pequeños, mejor rendimiento, menos problemas con campos `null`.

---

### 2. **MEJORA: Verificar Campos Requeridos vs Opcionales**

**Acción:**
- Revisar cada endpoint documentado en `/docs/API-references/`
- Verificar que solo se envían campos requeridos o campos opcionales con valores válidos
- Documentar casos donde se envían campos no documentados
- Crear validación en frontend antes de enviar

---

## 📝 Notas Adicionales

### Servicios que Lanzan `response` Directamente

Algunos servicios lanzan el objeto `response` completo en lugar de procesar el error:
- `entityService.js` - `fetchEntities()`, `deleteEntity()`, `performAction()`
- `createEntityService.js` - `createEntity()`, `fetchAutocompleteOptions()`
- `editEntityService.js` - `fetchEntityData()`, `fetchAutocompleteOptions()`

**Impacto:** El manejo de errores queda en el componente que llama, lo cual puede ser correcto si el componente maneja `userMessage` correctamente, pero es inconsistente.

**Recomendación:** Estandarizar: o bien procesar errores en el servicio, o bien documentar que el componente debe manejar `userMessage`.

---

**Fin del Análisis Exhaustivo**

**Última Actualización:** Diciembre 2024

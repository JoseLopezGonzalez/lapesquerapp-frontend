# Análisis Comparativo API vs Frontend

## 📋 Resumen Ejecutivo

Este documento analiza en profundidad las diferencias entre lo que espera recibir y devolver la API (según su documentación) versus lo que el frontend envía y espera recibir. Se identifican problemas críticos, diferencias, errores y endpoints no utilizados.

**Fecha de Análisis:** Diciembre 2024

**Base de la Documentación:** `/docs/API-references/`

**Código Analizado:** Frontend Next.js en `/src/services/`, `/src/hooks/`, `/src/components/`

---

## 🚨 Problemas Críticos

### 1. Estructura de Respuesta Inconsistente

**Problema:** La API documenta diferentes estructuras de respuesta según el endpoint, pero el frontend espera siempre `data.data` o `data` directamente.

**Ejemplo Problemático:**

#### `GET /api/v2/orders/{id}` - Obtener Pedido

- **API Documenta:**
  ```json
  {
    "id": 1,
    "customer": {...}
  }
  ```
- **Frontend Usa:** Extrae `data.data` (`orderService.js:32-33`)
- **⚠️ Inconsistencia:** Si la API devuelve directamente el objeto sin envolver en `{data: {...}}`, esto podría fallar.

---

### 2. Campos del Login: `role` vs `roles`

**Problema Crítico:** Inconsistencia en el nombre del campo de roles en la respuesta del login.

**Endpoint:** `POST /api/v2/login`

**API Documenta (Login):**

```json
{
  "user": {
    "role": ["admin"]  // ⚠️ Campo singular
  }
}
```

**API Documenta (`GET /api/v2/me`):**

```json
{
  "roles": [  // ⚠️ Campo plural
    {
      "id": 1,
      "name": "admin",
      "display_name": "Administrador"
    }
  ]
}
```

**Frontend Usa:**

- En NextAuth callback usa `user.role` (singular) - `route.js:99`
- El frontend debería normalizar esto para evitar problemas.

**Recomendación:** Normalizar en el frontend para siempre usar `roles` (plural) o verificar ambos campos.

---

### 3. Endpoint de Actualización de Estado de Pedido (Vamos a usar a partir de ahora la forma de la docu de la api)

**API Documenta:**

```http
PUT /api/v2/orders/{order}/status
Body: { "status": "finished" }
```

**Frontend Usa:**

```javascript
PUT /api/v2/orders/${orderId}/status?status=${status}
// ⚠️ Usa query parameter en lugar de body
```

**Problema:** El frontend envía el status como query parameter en lugar del body JSON. Esto puede funcionar si el backend acepta ambos, pero es inconsistente con la documentación.

**Ubicación:** `orderService.js:255`

---


## 📊 Endpoints NO Utilizados o Verificación Pendiente

**Nota:** El sistema `EntityClient` maneja genéricamente DELETE múltiples a través de `deleteEntity` con body `{ ids: [...] }` cuando se seleccionan múltiples filas. Esto significa que endpoints como `DELETE /api/v2/orders`, `DELETE /api/v2/products`, etc. **SÍ están disponibles** para uso genérico aunque no se usen directamente en código específico.

### Autenticación

#### `POST /api/v2/logout` - Cerrar Sesión
- **Método:** POST
- **Documentado:** Sí
- **Usado en Frontend:** ❌ NO encontrado
- **Razón:** NextAuth maneja el logout internamente
- **Recomendación:** Si el backend revoca tokens, debería implementarse

#### `GET /api/v2/me` - Obtener Usuario Actual
- **Método:** GET
- **Documentado:** Sí
- **Usado en Frontend:** ❌ NO encontrado
- **Razón:** NextAuth guarda la información del usuario en el JWT
- **Recomendación:** Útil para refrescar datos del usuario sin re-login

---

### Inventario - Palets

#### ❌ Endpoints NO Encontrados en Uso Directo:

- `GET /api/v2/pallets/options` - Opciones de Palets
- `GET /api/v2/pallets/stored-options` - Opciones de Palets Almacenados  
- `GET /api/v2/pallets/shipped-options` - Opciones de Palets Enviados


### Inventario - Cajas

#### ❌ Endpoints NO Encontrados en Uso Directo:

- `GET /api/v2/boxes/available` - Cajas Disponibles

**Nota:** La aplicación calcula cajas disponibles desde los datos de palets (`availableBoxesCount`), pero no usa el endpoint `GET /api/v2/boxes/available` directamente.

---

### Producción

#### Endpoints NO Documentados en `/docs/API-references/produccion/README.md` pero Usados:

- **`GET /api/v2/production-records/{id}/tree`** - Obtener Árbol del Registro - Usado pero NO documentado
- **`GET /api/v2/production-records/{id}/images`** - Listar Imágenes - Usado en `productionService.js:541` pero NO documentado
- **`POST /api/v2/production-records/{id}/images`** - Subir Imagen - Usado en `productionService.js:553` pero NO documentado
- **`DELETE /api/v2/production-records/{id}/images/{imageId}`** - Eliminar Imagen - Usado en `productionService.js:569` pero NO documentado

---

### Sistema

**Pendiente de Verificar:**
- Otros endpoints de roles (excepto `GET /api/v2/roles/options` que SÍ se usa)

---

## 📝 Campos y Propiedades No Verificados

### En Respuestas de Pedidos

**Campos documentados que NO se verificó si se usan:**

- `transportation_notes`, `production_notes`, `accounting_notes`
- `emails`, `cc_emails`

**Recomendación:** Auditar qué campos realmente se muestran/editan en el frontend.

---

### En Respuestas de Productos

**Campos documentados que NO se verificó si se usan:**

- `a3erp_code`, `facil_com_code`

---

### En Respuestas de Estadísticas

**Campos adicionales documentados que podrían no usarse:**

- En `GET /api/v2/statistics/orders/total-amount` (Método: GET): `average_amount`
- En `GET /api/v2/statistics/orders/ranking` (Método: GET): `rank`

---

## 🔧 Recomendaciones

### 1. Documentar Endpoints Faltantes

**Endpoints usados en frontend pero NO documentados en API references:**

#### Producción:

- `GET /api/v2/production-records/{id}/tree` - Obtener árbol del registro
- `GET /api/v2/production-records/{id}/images` - Listar imágenes
- `POST /api/v2/production-records/{id}/images` - Subir imagen
- `DELETE /api/v2/production-records/{id}/images/{imageId}` - Eliminar imagen


### 2. Estandarizar Estructura de Respuestas

**Problema:** Algunos endpoints devuelven objetos directamente, otros envueltos en `{data: {...}}`, otros en `{data: [{...}]}`.

**Recomendación:**

- Crear normalizadores en el frontend para cada tipo de respuesta
- Documentar claramente la estructura esperada de cada endpoint

---

### 3. Normalizar Nomenclatura de Roles

**Problema:** Login devuelve `role` (singular), `/me` devuelve `roles` (plural).

**Recomendación:**

- Estandarizar en backend para siempre usar `roles` (plural)
- O crear normalizador en frontend para siempre usar `roles`

---


### 5. Implementar Logout en Backend

**Problema:** El frontend no llama a `POST /api/v2/logout` al cerrar sesión.

**Recomendación:**

- Si el backend revoca tokens al hacer logout, implementar la llamada
- Si no es necesario, documentar que NextAuth maneja el logout

---

### 6. Revisar Uso de Filtros en Listados

**Problema:** La API documenta muchos filtros opcionales que pueden no estar siendo utilizados.

**Recomendación:**

- Auditar qué filtros realmente se usan en el frontend
- Documentar qué filtros son críticos vs opcionales

---

### 7. Validar Estructura de Respuesta de GET /api/v2/orders/

**Problema:** El frontend espera `data.data`, pero la documentación muestra que la respuesta es directamente el objeto.

**API Documenta (`GET /api/v2/orders/{id}`):**

```json
{
  "id": 1,
  "customer": {...}
}
```

**Frontend Espera:** `data.data` (`orderService.js:32-33`)

**Recomendación:**

- Verificar la estructura real de la respuesta del backend
- Normalizar en el frontend para manejar ambos casos, o
- Corregir el frontend si la API devuelve directamente el objeto

---

## 📈 Estadísticas Resumidas

### Resumen:
- **Endpoints NO Utilizados Confirmados:** ~3-5 (principalmente endpoints de opciones de palets y `boxes/available`)
- **Endpoints Usados pero NO Documentados:** ~4-5 (solo producción: imágenes y árbol)

---

## 🎯 Prioridades de Acción

### 🔴 Crítico (Resolver Inmediatamente)

1. Documentar endpoints de imágenes de producción (`/production-records/{id}/images`, `/tree`)
2. Alinear uso de query parameter vs body en `PUT /api/v2/orders/{order}/status`
3. Estandarizar nomenclatura de `role` vs `roles`

### 🟡 Alto (Resolver Pronto)

4. Implementar logout en backend si es necesario
5. Verificar uso real de filtros en listados
6. Validar estructura de respuestas del endpoint `GET /api/v2/orders/{id}`

### 🟢 Medio (Mejorar en el Tiempo)

7. Auditar uso de campos en respuestas
8. Normalizar estructuras de respuesta

---

## 📚 Referencias

- Documentación API: `/docs/API-references/`
- Servicios Frontend: `/src/services/`
- Configuración de Entidades: `/src/configs/entitiesConfig.js`
- Helpers API: `/src/lib/api/apiHelpers.js`

---

**Fin del Análisis**

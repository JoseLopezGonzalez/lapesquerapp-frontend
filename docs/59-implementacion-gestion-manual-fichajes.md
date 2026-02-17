# Implementación: Gestión Manual de Fichajes

## 1. Descripción General

Este documento describe la implementación de un módulo para la gestión manual de entradas y salidas de trabajadores desde la administración. El módulo permitirá:

- **Registro Individual**: Crear fichajes manuales uno por uno con fecha/hora personalizada
- **Registro Masivo**: Importar múltiples fichajes desde un archivo CSV o mediante formulario masivo

## 2. Ubicación en la Aplicación

### 2.1 Navegación
El nuevo módulo se añadirá dentro de la sección **"Gestión Horaria"** en el menú de administración:

```
Gestión Horaria
├── Empleados (/admin/employees)
├── Eventos de Fichaje (/admin/punches)
└── Gestión Manual de Fichajes (/admin/manual-punches) ← NUEVO
```

### 2.2 Estructura de Archivos

```
src/
├── app/
│   └── admin/
│       └── manual-punches/
│           └── page.js                    # Página principal
├── components/
│   └── Admin/
│       └── ManualPunches/
│           ├── index.jsx                   # Componente principal
│           ├── IndividualPunchForm.jsx     # Formulario individual
│           ├── BulkPunchForm.jsx           # Formulario masivo
│           ├── BulkPunchCSVUpload.jsx      # Carga desde CSV
│           └── PunchPreviewTable.jsx      # Vista previa de fichajes
└── services/
    └── punchService.js                     # Actualizar con nuevos métodos
```

## 3. Funcionalidades

### 3.1 Registro Individual

**Características:**
- Formulario con campos:
  - **Empleado** (Autocomplete/Select)
  - **Tipo de Evento** (Entrada/Salida)
  - **Fecha y Hora** (DateTime picker)
  - **Dispositivo** (Opcional, por defecto: "manual-admin")
- Validaciones:
  - Empleado obligatorio
  - Tipo de evento obligatorio
  - Fecha/hora válida y no futura (opcional, según requisitos)
- Feedback visual:
  - Confirmación de éxito
  - Mensajes de error claros
  - Actualización automática de la lista

### 3.2 Registro Masivo

**Opciones de carga:**

#### Opción A: Formulario Masivo
- Tabla editable donde se pueden añadir múltiples filas
- Cada fila contiene: Empleado, Tipo, Fecha/Hora
- Validación en tiempo real
- Vista previa antes de guardar
- Botón para añadir/eliminar filas

#### Opción B: Carga desde CSV
- Botón para seleccionar archivo CSV
- Validación del formato:
  ```
  employee_id,event_type,timestamp
  1,IN,2024-01-15 08:30:00
  2,OUT,2024-01-15 17:00:00
  ```
- Vista previa de datos antes de importar
- Reporte de errores (filas con problemas)
- Confirmación de éxito con resumen

**Características comunes:**
- Validación de datos antes de enviar
- Procesamiento en lote (bulk)
- Manejo de errores parciales (algunos registros fallan)
- Reporte de resultados (éxitos/errores)

## 4. Endpoints del Backend Requeridos

### 4.1 Crear Fichaje Individual con Timestamp Manual

**Endpoint:** `POST /api/v2/punches`

**Cambio necesario:** El endpoint actual `createPunch` genera el timestamp automáticamente. Se necesita modificar para aceptar timestamp manual cuando se proporciona.

**Request Body:**
```json
{
  "employee_id": 1,
  "event_type": "IN",  // "IN" o "OUT"
  "timestamp": "2024-01-15T08:30:00",  // ISO 8601 format
  "device_id": "manual-admin"  // Opcional
}
```

**Response:**
```json
{
  "data": {
    "id": 123,
    "employee_id": 1,
    "employee": {
      "id": 1,
      "name": "Juan Pérez"
    },
    "event_type": "IN",
    "timestamp": "2024-01-15T08:30:00",
    "device_id": "manual-admin",
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
}
```

**Validaciones Backend:**
- `employee_id` debe existir
- `event_type` debe ser "IN" o "OUT"
- `timestamp` debe ser una fecha válida
- `timestamp` no debe ser futura (opcional, según requisitos)
- Validar coherencia de secuencia (no dos entradas seguidas, etc.)

---

### 4.2 Crear Fichajes Masivos (Bulk)

**Endpoint:** `POST /api/v2/punches/bulk`

**Request Body:**
```json
{
  "punches": [
    {
      "employee_id": 1,
      "event_type": "IN",
      "timestamp": "2024-01-15T08:30:00",
      "device_id": "manual-admin"
    },
    {
      "employee_id": 2,
      "event_type": "OUT",
      "timestamp": "2024-01-15T17:00:00",
      "device_id": "manual-admin"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "created": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "punch": {
          "id": 123,
          "employee_id": 1,
          "event_type": "IN",
          "timestamp": "2024-01-15T08:30:00"
        }
      },
      {
        "index": 1,
        "success": true,
        "punch": {
          "id": 124,
          "employee_id": 2,
          "event_type": "OUT",
          "timestamp": "2024-01-15T17:00:00"
        }
      }
    ],
    "errors": []
  }
}
```

**En caso de errores parciales:**
```json
{
  "data": {
    "created": 1,
    "failed": 1,
    "results": [
      {
        "index": 0,
        "success": true,
        "punch": { ... }
      },
      {
        "index": 1,
        "success": false,
        "error": "El empleado con ID 999 no existe"
      }
    ],
    "errors": [
      {
        "index": 1,
        "message": "El empleado con ID 999 no existe",
        "data": {
          "employee_id": 999,
          "event_type": "IN",
          "timestamp": "2024-01-15T08:30:00"
        }
      }
    ]
  }
}
```

**Validaciones Backend:**
- Validar cada registro individualmente
- Continuar procesando aunque algunos fallen
- Retornar detalles de errores para cada registro fallido
- Límite máximo de registros por request (ej: 1000)

---

### 4.3 Validar Fichajes Masivos (Pre-validación)

**Endpoint:** `POST /api/v2/punches/bulk/validate`

**Propósito:** Validar datos antes de crear los fichajes. Útil para mostrar errores en la vista previa.

**Request Body:** (Igual que bulk)
```json
{
  "punches": [ ... ]
}
```

**Response:**
```json
{
  "data": {
    "valid": 2,
    "invalid": 0,
    "validation_results": [
      {
        "index": 0,
        "valid": true,
        "errors": []
      },
      {
        "index": 1,
        "valid": true,
        "errors": []
      }
    ]
  }
}
```

**Con errores:**
```json
{
  "data": {
    "valid": 1,
    "invalid": 1,
    "validation_results": [
      {
        "index": 0,
        "valid": true,
        "errors": []
      },
      {
        "index": 1,
        "valid": false,
        "errors": [
          "El empleado con ID 999 no existe",
          "El timestamp no puede ser una fecha futura"
        ]
      }
    ]
  }
}
```

---

### 4.4 Obtener Plantilla CSV

**Endpoint:** `GET /api/v2/punches/bulk/template`

**Response:** Archivo CSV de ejemplo
```
employee_id,event_type,timestamp
1,IN,2024-01-15 08:30:00
2,OUT,2024-01-15 17:00:00
```

O respuesta JSON con la estructura:
```json
{
  "data": {
    "headers": ["employee_id", "event_type", "timestamp"],
    "example_rows": [
      [1, "IN", "2024-01-15 08:30:00"],
      [2, "OUT", "2024-01-15 17:00:00"]
    ],
    "format_description": "CSV con encabezados. Fecha en formato YYYY-MM-DD HH:mm:ss"
  }
}
```

---

## 5. Estructura de Datos

### 5.1 Modelo de Fichaje (Punch)

```typescript
interface Punch {
  id: number;
  employee_id: number;
  employee?: {
    id: number;
    name: string;
  };
  event_type: "IN" | "OUT";
  timestamp: string;  // ISO 8601
  device_id?: string;
  created_at: string;
  updated_at: string;
}
```

### 5.2 Formulario Individual

```typescript
interface IndividualPunchFormData {
  employee_id: number;
  event_type: "IN" | "OUT";
  timestamp: string;  // ISO 8601 o formato datetime-local
  device_id?: string;
}
```

### 5.3 Formulario Masivo

```typescript
interface BulkPunchFormData {
  punches: Array<{
    employee_id: number;
    event_type: "IN" | "OUT";
    timestamp: string;
    device_id?: string;
  }>;
}
```

### 5.4 CSV Format

```csv
employee_id,event_type,timestamp
1,IN,2024-01-15 08:30:00
2,OUT,2024-01-15 17:00:00
3,IN,2024-01-15 09:00:00
```

**Variantes aceptadas:**
- Separador: coma (`,`) o punto y coma (`;`)
- Timestamp: `YYYY-MM-DD HH:mm:ss` o `YYYY-MM-DDTHH:mm:ss`
- Headers opcionales (si no hay, usar orden: employee_id, event_type, timestamp)

## 6. Implementación Frontend

### 6.1 Componente Principal

```jsx
// src/components/Admin/ManualPunches/index.jsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IndividualPunchForm from './IndividualPunchForm';
import BulkPunchForm from './BulkPunchForm';
import BulkPunchCSVUpload from './BulkPunchCSVUpload';

export default function ManualPunchesManager() {
  const [activeTab, setActiveTab] = useState('individual');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Gestión Manual de Fichajes</h2>
        <p className="text-sm text-muted-foreground">
          Registra entradas y salidas de trabajadores de forma manual
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="bulk-form">Masivo (Formulario)</TabsTrigger>
          <TabsTrigger value="bulk-csv">Masivo (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <IndividualPunchForm />
        </TabsContent>

        <TabsContent value="bulk-form">
          <BulkPunchForm />
        </TabsContent>

        <TabsContent value="bulk-csv">
          <BulkPunchCSVUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 6.2 Servicio Actualizado

```javascript
// src/services/punchService.js

/**
 * Crear fichaje individual con timestamp manual
 * @param {object} punchData - { employee_id, event_type, timestamp, device_id? }
 * @param {string} token - Token JWT
 * @returns {Promise<Object>}
 */
export async function createManualPunch(punchData, token) {
  return fetchWithTenant(`${API_URL_V2}punches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify(punchData),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Error al crear fichaje');
      }
      return response.json();
    })
    .then((data) => data.data || data);
}

/**
 * Crear fichajes masivos
 * @param {Array} punches - Array de objetos { employee_id, event_type, timestamp, device_id? }
 * @param {string} token - Token JWT
 * @returns {Promise<Object>}
 */
export async function createBulkPunches(punches, token) {
  return fetchWithTenant(`${API_URL_V2}punches/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({ punches }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Error al crear fichajes masivos');
      }
      return response.json();
    })
    .then((data) => data.data || data);
}

/**
 * Validar fichajes masivos antes de crear
 * @param {Array} punches - Array de objetos
 * @param {string} token - Token JWT
 * @returns {Promise<Object>}
 */
export async function validateBulkPunches(punches, token) {
  return fetchWithTenant(`${API_URL_V2}punches/bulk/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
    body: JSON.stringify({ punches }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Error al validar fichajes');
      }
      return response.json();
    })
    .then((data) => data.data || data);
}

/**
 * Obtener plantilla CSV
 * @param {string} token - Token JWT
 * @returns {Promise<Object>}
 */
export async function getPunchCSVTemplate(token) {
  return fetchWithTenant(`${API_URL_V2}punches/bulk/template`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': getUserAgent(),
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Error al obtener plantilla');
      }
      return response.json();
    })
    .then((data) => data.data || data);
}
```

### 6.3 Actualización de Navegación

```javascript
// src/configs/navgationConfig.js

{
  name: 'Gestión Horaria',
  icon: Clock,
  allowedRoles: ["admin", "manager", "superuser"],
  childrens: [
    {
      name: 'Empleados',
      href: '/admin/employees',
      allowedRoles: ["admin", "manager", "superuser"],
    },
    {
      name: 'Eventos de Fichaje',
      href: '/admin/punches',
      allowedRoles: ["admin", "manager", "superuser"],
    },
    {
      name: 'Gestión Manual de Fichajes',  // ← NUEVO
      href: '/admin/manual-punches',
      allowedRoles: ["admin", "manager", "superuser"],
    },
  ],
}
```

## 7. Validaciones Frontend

### 7.1 Validaciones Individuales

- Empleado: Obligatorio, debe existir
- Tipo de evento: Obligatorio, solo "IN" o "OUT"
- Timestamp: Obligatorio, formato válido, no futuro (opcional)
- Device ID: Opcional, string

### 7.2 Validaciones Masivas

- Mínimo 1 registro
- Máximo 1000 registros por lote
- Cada registro debe cumplir validaciones individuales
- No duplicados exactos (mismo empleado, tipo, timestamp)
- Secuencia lógica (no dos entradas seguidas del mismo empleado)

## 8. Flujo de Usuario

### 8.1 Registro Individual

1. Usuario accede a `/admin/manual-punches`
2. Selecciona pestaña "Individual"
3. Completa formulario:
   - Selecciona empleado
   - Selecciona tipo (Entrada/Salida)
   - Selecciona fecha/hora
4. Hace clic en "Registrar"
5. Sistema valida datos
6. Si válido: muestra confirmación y actualiza lista
7. Si inválido: muestra errores específicos

### 8.2 Registro Masivo (Formulario)

1. Usuario accede a pestaña "Masivo (Formulario)"
2. Ve tabla vacía con botón "Añadir Fila"
3. Añade filas y completa datos
4. Hace clic en "Validar" (opcional)
5. Sistema muestra vista previa con errores (si hay)
6. Usuario corrige errores
7. Hace clic en "Registrar Todos"
8. Sistema procesa en lote
9. Muestra resumen: X creados, Y fallidos
10. Muestra detalles de errores (si hay)

### 8.3 Registro Masivo (CSV)

1. Usuario accede a pestaña "Masivo (CSV)"
2. Hace clic en "Descargar Plantilla" (opcional)
3. Completa archivo CSV con datos
4. Hace clic en "Seleccionar Archivo"
5. Sistema parsea CSV
6. Muestra vista previa con datos parseados
7. Sistema valida datos (opcional, botón "Validar")
8. Muestra errores de validación (si hay)
9. Usuario corrige CSV o datos directamente
10. Hace clic en "Importar"
11. Sistema procesa en lote
12. Muestra resumen y errores (si hay)

## 9. Consideraciones Técnicas

### 9.1 Manejo de Errores

- Errores de red: Reintento automático (opcional)
- Errores de validación: Mostrar mensajes claros
- Errores parciales en bulk: Mostrar qué registros fallaron y por qué
- Timeout: Para lotes grandes, considerar procesamiento asíncrono

### 9.2 Performance

- Validación en tiempo real (debounce)
- Límite de registros por lote (1000)
- Para lotes grandes, considerar:
  - Procesamiento asíncrono
  - Barra de progreso
  - Notificación cuando termine

### 9.3 UX/UI

- Feedback visual inmediato
- Confirmaciones antes de acciones destructivas
- Vista previa antes de guardar
- Mensajes de éxito/error claros
- Loading states durante procesamiento

## 10. Testing

### 10.1 Casos de Prueba Individual

- Crear fichaje válido
- Validar campos obligatorios
- Validar formato de fecha
- Validar empleado inexistente
- Validar tipo de evento inválido

### 10.2 Casos de Prueba Masivo

- Importar CSV válido
- Importar CSV con errores
- Importar CSV con formato incorrecto
- Validar límite de registros
- Validar duplicados
- Validar secuencia lógica

## 11. Resumen de Endpoints Requeridos

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| POST | `/api/v2/punches` | Crear fichaje individual (aceptar timestamp manual) | **MODIFICAR** |
| POST | `/api/v2/punches/bulk` | Crear fichajes masivos | **NUEVO** |
| POST | `/api/v2/punches/bulk/validate` | Validar fichajes masivos | **NUEVO** |
| GET | `/api/v2/punches/bulk/template` | Obtener plantilla CSV | **NUEVO** |

## 12. Próximos Pasos

1. **Backend:**
   - Modificar `POST /api/v2/punches` para aceptar timestamp manual
   - Implementar `POST /api/v2/punches/bulk`
   - Implementar `POST /api/v2/punches/bulk/validate`
   - Implementar `GET /api/v2/punches/bulk/template`

2. **Frontend:**
   - Crear estructura de carpetas
   - Implementar componente principal
   - Implementar formulario individual
   - Implementar formulario masivo
   - Implementar carga CSV
   - Actualizar servicios
   - Actualizar navegación
   - Añadir tests

3. **Documentación:**
   - Documentar API en Swagger/OpenAPI
   - Actualizar guía de usuario

---

**Fecha de creación:** 2024-01-XX  
**Versión:** 1.0  
**Autor:** Sistema de Documentación


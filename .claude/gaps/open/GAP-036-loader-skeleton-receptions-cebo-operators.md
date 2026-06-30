# GAP-036 — Loader → Skeleton en Recepciones, Cebo y FieldOperators

## Metadata

- **Tipo:** Refactor
- **Módulo:** Maquiladores / Repartidores
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Cinco componentes de los módulos de recepciones de materia prima, salidas de cebo y operadores de campo usan `<Loader>` como estado de carga primario de datos. Según el design system, `<Loader>` es exclusivo para gates de sesión/auth.

**Nota importante sobre FieldOperatorsPageClient.jsx:** Este archivo tiene DOS usos de `<Loader>`:
- Líneas 21–27: `status === 'loading'` (gate de sesión NextAuth) → **uso válido, NO tocar**
- Líneas 42–48: `isLoading` (carga de datos de operadores) → **debe reemplazarse por Skeleton**

**Archivos afectados:**

| Archivo | Línea | Contexto |
|---|---|---|
| `CreateReceptionForm/index.js` | 115 | Carga inicial de opciones del formulario |
| `EditReceptionForm/index.js` | 1179 | Carga de datos de la recepción a editar |
| `CreateCeboForm/index.js` | 75 | Carga inicial de opciones del formulario |
| `EditCeboForm/index.js` | 77, 85 | Carga de datos del cebo a editar |
| `FieldOperatorsPageClient.jsx` | 42–48 | Carga de lista de operadores (isLoading) |
| `FieldOperatorDetailPageClient.jsx` | 18, 39 | Carga de detalle de operador |

---

## Solución acordada

Reemplazar cada `<Loader>` de carga de datos por `<Skeleton>` que replique la silueta del contenido:
- Formularios (Create/Edit): Skeleton de formulario con labels + inputs
- Lista de operadores: Skeleton de tabla o lista de tarjetas
- Detalle de operador: Skeleton de vista de detalle

El uso válido de `<Loader>` en `FieldOperatorsPageClient.jsx` líneas 21–27 (`status === 'loading'`) se mantiene intacto.

## UI Brief

- **Vista de referencia:** `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js` — patrón Skeleton canónico
- **Tipo de layout:** Skeleton de formulario (recepciones/cebo) y Skeleton de lista/detalle (operadores)
- **Componentes clave:** `<Skeleton>` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton) / loaded (contenido real)
- **Mobile:** no aplica — vistas de admin

---

## Criterios de aceptación

- [ ] `CreateReceptionForm/index.js`: no renderiza `<Loader>` para estado de carga de datos
- [ ] `EditReceptionForm/index.js`: no renderiza `<Loader>` para estado de carga de datos
- [ ] `CreateCeboForm/index.js`: no renderiza `<Loader>` para estado de carga de datos
- [ ] `EditCeboForm/index.js`: no renderiza `<Loader>` para estado de carga de datos
- [ ] `FieldOperatorsPageClient.jsx` líneas 42–48 (`isLoading`): reemplazado por Skeleton de lista
- [ ] `FieldOperatorsPageClient.jsx` líneas 21–27 (`status === 'loading'`): **sin cambios** (gate de sesión válido)
- [ ] `FieldOperatorDetailPageClient.jsx`: no renderiza `<Loader>` para estado de carga de datos
- [ ] Los Skeletons muestran silueta reconocible del contenido

## Archivos a crear o modificar

- `src/components/Admin/RawMaterialReceptions/CreateReceptionForm/index.js`
- `src/components/Admin/RawMaterialReceptions/EditReceptionForm/index.js`
- `src/components/Admin/CeboDispatches/CreateCeboForm/index.js`
- `src/components/Admin/CeboDispatches/EditCeboForm/index.js`
- `src/components/Admin/FieldOperators/FieldOperatorsPageClient.jsx`
- `src/components/Admin/FieldOperators/FieldOperatorDetailPageClient.jsx`

## Restricciones

- No modificar la lógica de negocio ni los handlers de ningún formulario
- Preservar el gate de sesión (`status === 'loading'`) en `FieldOperatorsPageClient.jsx`
- No tocar archivos de hooks ni services
- Este GAP NO aborda el token-as-parameter en `EditReceptionForm` (ver GAP-043)

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

### Estado final de la implementación

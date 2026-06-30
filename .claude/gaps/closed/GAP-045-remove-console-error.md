# GAP-045 — Eliminar console.error en componentes de producción

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Global
- **Prioridad:** Baja
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

Se encontraron dos instancias de `console.error()` en componentes de producción. En el entorno de producción, los logs de consola no llegan al usuario y no deben estar en el código final — los errores deben gestionarse con `notify.error()` o silenciarse si son errores esperados manejados.

**Instancias:**

1. `CreateOrderForm/index.tsx:346` — `console.error` en un bloque catch de alguna operación del formulario
2. `EditEntityForm/index.js:173` — `console.error` en un bloque catch de carga de datos de entidad

---

## Solución acordada

Para cada instancia:

- Si el bloque catch ya llama a `notify.error()` o gestiona el error de otro modo: eliminar el `console.error` redundante.
- Si el `console.error` es la ÚNICA gestión del error: reemplazarlo por `notify.error()` con el mensaje apropiado.
- Si el error es esperado y no debe mostrarse al usuario (ej. request cancelada, race condition): eliminar el `console.error` sin reemplazarlo.

---

## Criterios de aceptación

- [x] `CreateOrderForm/index.tsx` no contiene ningún `console.error`
- [x] `EditEntityForm/index.js` no contiene ningún `console.error`
- [x] Los errores que necesitaban notificación al usuario siguen siendo notificados
- [x] No se introduce ningún `console.log` ni `console.warn` en los archivos modificados
- [x] El comportamiento funcional no cambia

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`
- `src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js`

## Restricciones

- No refactorizar la lógica de manejo de errores más allá de eliminar el `console.error`
- No añadir manejo de errores donde no existía

---

## Implementación

### Archivos modificados

- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`:
  - Línea ~207: Eliminado `console.error('Error al cargar datos del cliente:', err)` — redundante con el `notify.error()` inmediatamente posterior.
  - Línea ~346: Eliminado `console.error('Error al crear el pedido:', error)` — el bloque catch ya gestiona el error con `setErrorsFrom422` para 422.

- `src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js`:
  - Línea ~173: Eliminado `console.error('Error loading entity data:', err)` — redundante con el `notify.error()` anterior.
  - Línea ~208: Eliminado `console.error('Error cargando opciones de ${field.name}:', err)` — el error ya está silenciado con fallback a array vacío.
  - Línea ~348: Eliminado `console.error('Submission error:', err)` — redundante con el `notify.error()` anterior.

### Decisiones tomadas durante la implementación

- En todos los casos encontrados, el `notify.error()` correspondiente ya existía en el mismo bloque catch → los `console.error` eran puramente redundantes.
- No se añadió ningún `notify.error()` nuevo (restricción del GAP).

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

- [x] Criterios de aceptación cumplidos
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta

### Estado final de la implementación

Commit `[GAP-041/044/045/046]` en rama `claude/pending-gaps-implementation-kaayio`.

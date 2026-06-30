# GAP-045 — Eliminar console.error en componentes de producción

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas / Global
- **Prioridad:** Baja
- **Estado:** open
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

El implementador debe leer el contexto de cada `console.error` antes de decidir qué hacer.

---

## Criterios de aceptación

- [ ] `CreateOrderForm/index.tsx` no contiene ningún `console.error`
- [ ] `EditEntityForm/index.js` no contiene ningún `console.error`
- [ ] Los errores que necesitaban notificación al usuario siguen siendo notificados
- [ ] No se introduce ningún `console.log` ni `console.warn` en los archivos modificados
- [ ] El comportamiento funcional no cambia

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/CreateOrderForm/index.tsx`
- `src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js`

## Restricciones

- No refactorizar la lógica de manejo de errores más allá de eliminar el `console.error`
- No añadir manejo de errores donde no existía

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

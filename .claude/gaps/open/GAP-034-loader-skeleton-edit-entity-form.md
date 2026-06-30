# GAP-034 — Loader → Skeleton en EditEntityForm

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global (Admin)
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

`EditEntityForm/index.js` es el componente compartido que alimenta TODOS los formularios de edición de entidades en el panel de administración: clientes, especies, zonas de captura, artes de pesca, países, impuestos, transportes, y cualquier entidad del catálogo que use `EntityClient`. Actualmente muestra `<Loader>` (líneas 453–457) mientras carga los datos del registro a editar.

Según el design system, `<Loader>` es exclusivo para gates de sesión/auth. Para carga de datos del servidor → `<Skeleton>`. Al ser un componente compartido, un único cambio aquí mejora la experiencia en todas las vistas de edición del admin.

---

## Solución acordada

Reemplazar el `<Loader>` de `EditEntityForm/index.js` por un `<Skeleton>` que reproduzca la forma de un formulario de edición genérico (campos con labels + inputs).

## UI Brief

- **Vista de referencia:** `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js` — patrón Skeleton canónico
- **Tipo de layout:** Skeleton de formulario — grid de campos con label + input placeholder
- **Componentes clave:** `<Skeleton>` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton de formulario) / loaded (formulario real con datos)
- **Mobile:** no aplica — formulario de edición es solo admin desktop

---

## Criterios de aceptación

- [ ] `EditEntityForm/index.js` no renderiza `<Loader>` en ninguna condición
- [ ] El estado de carga muestra Skeleton con silueta de formulario (labels + inputs)
- [ ] El import de `<Loader>` se elimina si no se usa en otro lugar del archivo
- [ ] El comportamiento funcional del formulario no cambia (carga de datos, validación, submit)
- [ ] No se introducen archivos .js nuevos
- [ ] El componente sigue siendo genérico (no asume campos concretos de ninguna entidad)

## Archivos a crear o modificar

- `src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js`

## Restricciones

- No modificar la interfaz de props del componente
- No refactorizar la lógica de carga de datos ni los handlers de formulario
- No tocar otros componentes de `EntityClient` fuera del alcance

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

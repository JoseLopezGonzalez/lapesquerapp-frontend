# GAP-034 — Loader → Skeleton en EditEntityForm

## Metadata

- **Tipo:** Refactor
- **Módulo:** Global (Admin)
- **Prioridad:** Alta
- **Estado:** closed
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

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm/index.js` — import `Loader` → `Skeleton`; early return con Skeleton de 5 campos (label + input) genérico que aplica a todas las entidades del EntityClient.

### Decisiones tomadas durante la implementación

- 5 filas de label+input es suficiente para dar la silueta de un formulario de edición; el formulario real varía en número de campos pero el skeleton es siempre genérico.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: [10/10]

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

### Observaciones para Jose

Un único cambio mejora la experiencia de carga en todos los formularios de edición del admin (clientes, especies, países, impuestos, transportes…).

### Estado final de la implementación

Implementado y cerrado en el mismo commit que el código.

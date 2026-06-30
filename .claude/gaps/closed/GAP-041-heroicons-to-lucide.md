# GAP-041 — Heroicons → Lucide y hardcoded color en LabelEditor

## Metadata

- **Tipo:** Refactor
- **Módulo:** Etiquetas / Ventas
- **Prioridad:** Media
- **Estado:** closed
- **Fecha:** 2026-06-30
- **Autor:** Jose

---

## Contexto y problema

El proyecto usa **Lucide** como librería de iconos estándar. Se encontraron imports de `@heroicons/react` en dos archivos:

1. `LabelEditor/index.js:74` — `BoldIcon` de `@heroicons/react/20/solid`
2. `OrdersManager/OrdersList/index.js:2` — `InboxIcon` de `@heroicons/react/24/outline` (import muerto — el icono no se usa en el render)

Adicionalmente, `LabelEditorToolbar.jsx:109` usa color hardcodeado `bg-lime-500 hover:bg-lime-400` que no corresponde a un token semántico del design system.

---

## Solución acordada

1. **LabelEditor/index.js**: Reemplazar `BoldIcon` de Heroicons por el equivalente de Lucide. El icono más cercano en Lucide es `Bold` (existe en Lucide desde v0.263+). Si no existiera equivalente exacto, usar `Type` o `Baseline` como alternativa razonable.

2. **OrdersList/index.js**: Eliminar el import muerto de `InboxIcon` de `@heroicons/react/24/outline`.

3. **LabelEditorToolbar.jsx**: Reemplazar `bg-lime-500 hover:bg-lime-400` por colores semánticos. Opciones:
   - Si el botón representa una acción de "nuevo/crear": usar `bg-primary hover:bg-primary/90`
   - Si representa una acción secundaria de confirmación: usar `bg-green-600/90 hover:bg-green-600` (verde semántico)
   - El auditor verificará cuál es el botón y qué acción representa para validar la elección

---

## Criterios de aceptación

- [x] `LabelEditor/index.js` no importa ningún módulo de `@heroicons/react`
- [x] `BoldIcon` era import muerto — eliminado sin necesidad de sustitución
- [x] `OrdersManager/OrdersList/index.js` no importa `InboxIcon` ni ningún otro símbolo de `@heroicons/react`
- [x] `LabelEditorToolbar.jsx` no usa `bg-lime-500` ni `hover:bg-lime-400` ni ningún color Tailwind arbitrario
- [x] El color de reemplazo en el toolbar usa tokens semánticos (`bg-primary hover:bg-primary/90`)
- [x] TypeScript compila sin errores
- [x] La funcionalidad de los botones no cambia

## Archivos a crear o modificar

- `src/components/Admin/LabelEditor/index.js`
- `src/components/Admin/LabelEditor/LabelEditorToolbar.jsx`
- `src/components/Admin/OrdersManager/OrdersList/index.js`

## Restricciones

- No modificar la lógica de negocio ni los handlers
- No instalar nuevas dependencias — Lucide ya está instalado
- No refactorizar los componentes más allá de los cambios de icono y color

---

## Implementación

### Archivos modificados

- `src/components/Admin/LabelEditor/index.js` — Eliminado import muerto `BoldIcon` de `@heroicons/react/20/solid` (línea 74). El icono no se usaba en el render.
- `src/components/Admin/OrdersManager/OrdersList/index.js` — Eliminado import muerto `InboxIcon` de `@heroicons/react/24/outline` (línea 2).
- `src/components/Admin/LabelEditor/LabelEditorToolbar.jsx` — Reemplazado `bg-lime-500 hover:bg-lime-400` por `bg-primary hover:bg-primary/90` en el botón Guardar.

### Decisiones tomadas durante la implementación

- `BoldIcon` en `LabelEditor/index.js` era un import muerto (no se usaba en el render) → eliminado directamente sin sustitución.
- El botón con `bg-lime-500` es el botón "Guardar" (acción primaria) → `bg-primary hover:bg-primary/90` es el token correcto.

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

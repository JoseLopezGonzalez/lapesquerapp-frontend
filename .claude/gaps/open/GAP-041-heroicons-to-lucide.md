# GAP-041 — Heroicons → Lucide y hardcoded color en LabelEditor

## Metadata

- **Tipo:** Refactor
- **Módulo:** Etiquetas / Ventas
- **Prioridad:** Media
- **Estado:** open
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

- [ ] `LabelEditor/index.js` no importa ningún módulo de `@heroicons/react`
- [ ] `BoldIcon` es reemplazado por el equivalente de Lucide y el render es visualmente equivalente
- [ ] `OrdersManager/OrdersList/index.js` no importa `InboxIcon` ni ningún otro símbolo de `@heroicons/react`
- [ ] `LabelEditorToolbar.jsx` no usa `bg-lime-500` ni `hover:bg-lime-400` ni ningún color Tailwind arbitrario
- [ ] El color de reemplazo en el toolbar usa tokens semánticos o variables CSS del design system
- [ ] TypeScript compila sin errores en los archivos modificados (si son .tsx)
- [ ] La funcionalidad de los botones no cambia

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

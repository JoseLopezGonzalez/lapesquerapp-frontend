# GAP-075 — Heroicons → Lucide en LabelEditorPropertyPanel

## Metadata

- **Tipo:** Refactor
- **Módulo:** Etiquetas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

GAP-041 cerró imports de `@heroicons/react` en `LabelEditor/index.js` y `OrdersList`, pero la
auditoría quality pallet+editor (2026-07-01) detectó un caso residual:

`src/components/Admin/LabelEditor/LabelEditorPropertyPanel.jsx:46`:
```js
import { BoldIcon } from '@heroicons/react/20/solid';
```

Uso en línea 944: `<BoldIcon className="h-4 w-4" />` (botón negrita del panel de propiedades).

PL-015: la librería estándar es **Lucide**. Equivalente: `Bold` de `lucide-react` (ya importado
en el mismo archivo para otros iconos).

---

## Solución acordada

1. Eliminar import de `@heroicons/react/20/solid`
2. Añadir `Bold` al import existente de `lucide-react`
3. Reemplazar `<BoldIcon />` por `<Bold />` en el botón de negrita

Sin cambios de lógica ni estilos del botón.

## UI Brief

- **Alcance visual:** Solo sustitución de icono — mismo tamaño `h-4 w-4`, mismo botón toggle
- **Sin cambios de layout** en el panel de propiedades

## Criterios de aceptación

- [ ] `LabelEditorPropertyPanel.jsx` no importa `@heroicons/react`
- [ ] El botón de negrita muestra icono Lucide `Bold` con apariencia equivalente
- [ ] Toggle negrita/normal sigue funcionando
- [ ] ESLint sin warnings nuevos en el archivo

## Archivos a crear o modificar

- `src/components/Admin/LabelEditor/LabelEditorPropertyPanel.jsx`

## Restricciones

- No instalar dependencias
- No refactorizar el panel completo ni migrar a `.tsx` en este GAP
- No tocar otros archivos de LabelEditor salvo este import/uso

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/LabelEditor/LabelEditorPropertyPanel.jsx` — quitado `import { BoldIcon } from '@heroicons/react/20/solid'`; añadido `Bold` al import existente de `lucide-react`; `<BoldIcon />` → `<Bold />` en el botón de negrita (línea ~944)

### Decisiones tomadas durante la implementación

- Ninguna — sustitución 1:1 exacta según el GAP.

### Desviaciones del plan (si las hay)

Ninguna.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10 — sustitución exacta, sin residuos de heroicons, lint limpio

### Checklist

- [x] Criterios de aceptación cumplidos (sin import de `@heroicons/react`; icono Lucide `Bold` con `h-4 w-4`; toggle sin tocar; `npx eslint` sin warnings en el archivo)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (PL-015 — Lucide como librería estándar)
- [x] Nomenclatura correcta

### Observaciones para Jose

Ninguna. Cambio mínimo y verificado con grep (`heroicons`/`BoldIcon` sin resultados) y
`npx eslint` sobre el archivo.

### Estado final de la implementación

El botón de negrita del panel de propiedades usa el icono `Bold` de `lucide-react`, mismo
tamaño y comportamiento que antes.

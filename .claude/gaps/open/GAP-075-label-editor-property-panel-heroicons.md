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

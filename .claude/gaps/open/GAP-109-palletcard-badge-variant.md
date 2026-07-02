# GAP-109 — Migrar Badge hardcodeado a variant="info" en PalletCard

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock (Almacén / Pallets)
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-02
- **Autor:** Jose (vía /audit-design consistency — familia `tablas`)

---

## Contexto y problema

`src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.tsx:237`
sobreescribe un `<Badge>` con className hardcoded:

```tsx
<Badge className="... border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 ...">
```

`design-context.md` § VISUAL checklist ("Native shadcn feel") y `project-learnings.md`
PL-006 establecen que un className override no es aceptable cuando el mismo efecto
visual ya es alcanzable con una variante existente del propio componente. `Badge`
(`src/components/ui/badge.jsx`) ya define una variante `info`:

```
info: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 ..."
```

Semánticamente equivalente (azul/info) al override manual, y con soporte de dark mode
que el override actual no tiene.

## Solución acordada

Sustituir el className hardcoded por `variant="info"` en el `Badge` de la línea ~237.
Revisar también el otro `<Badge>` del mismo archivo (línea ~251/366) por si tiene el
mismo problema de override y aplicar el mismo fix si corresponde.

## Criterios de aceptación

- [ ] El `Badge` de la línea ~237 usa `variant="info"` en vez de className con
      colores hardcodeados
- [ ] Se revisó el/los otro(s) `Badge` del archivo; si tenían el mismo problema, se
      corrigieron con la variante correspondiente (`info`, `success`, `warning`, etc.
      según el significado semántico real)
- [ ] Resultado visual equivalente en modo claro; mejora en modo oscuro (antes no
      tenía soporte dark, ahora sí vía la variante)
- [ ] `npm run type-check` limpio

## Archivos a crear o modificar

- `src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.tsx`

## Restricciones

- No tocar la lógica de qué condición determina cuándo se muestra cada Badge, solo el
  mecanismo de estilo
- No modificar otros componentes de `PositionSlideover/`

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

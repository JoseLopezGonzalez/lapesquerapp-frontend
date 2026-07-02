# GAP-109 — Migrar Badge hardcodeado a variant="info" en PalletCard

## Metadata

- **Tipo:** Refactor
- **Módulo:** Stock (Almacén / Pallets)
- **Prioridad:** Baja
- **Estado:** closed
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

Implementado por Codex el 2026-07-02.

### Archivos creados

- Ninguno.

### Archivos modificados

- `src/components/Admin/Stores/StoresManager/Store/PositionSlideover/PalletCard/index.tsx`
- `.claude/gaps/in-progress/GAP-109-palletcard-badge-variant.md`

### Decisiones tomadas durante la implementación

- El badge de recepción usa ahora `variant={isRelevant ? 'outline' : 'info'}`.
- Se conservó el override blanco solo para el estado `isRelevant`, porque el badge vive sobre cabecera verde y necesita contraste específico.
- Se revisaron los otros badges del archivo: el badge de pedido usa tokens `muted`, y el de lotes usa tokens `accent`; no tenían el mismo problema de color azul hardcodeado.
- Se ejecutaron `npx eslint` sobre el archivo modificado y `npm run type-check`.

### Desviaciones del plan (si las hay)

- No hubo desviaciones.

---

## Auditoría

> Auditoría ligera ejecutada por Codex el 2026-07-02.

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos según revisión documental y comprobaciones puntuales
- [x] Sin fetch() directo nuevo detectado en el alcance del GAP
- [x] Sin hardcode de tenant detectado
- [x] Sin archivos .js nuevos creados por el GAP
- [x] Sin any sin justificación detectado en la revisión ligera
- [x] Hooks gigantes no tocados fuera del alcance aprobado
- [x] entitiesConfig.js no tocado fuera del alcance aprobado
- [x] Patrones del workflow de GAP respetados
- [x] Nomenclatura correcta

### Observaciones para Jose

- `npm run type-check` pasa limpio en el estado actual del repositorio.
- Auditoría intencionadamente ligera: se revisaron criterios, implementación documentada y búsquedas puntuales de regresión; no se ejecutó smoke test visual/manual completo con backend real.
- Las observaciones o warnings preexistentes documentados en la implementación quedan fuera de alcance y no bloquean el cierre.

### Estado final de la implementación

GAP aprobado con observaciones y listo para cierre.

# GAP-084 — OrderAuxiliaryLines: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Varios hallazgos menores en
`src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx` (737 líneas),
detectados en modo heurístico:

1. **`CardTitle` en `text-lg font-medium`** (línea 535) en vez del `text-xl font-medium`
   documentado para títulos de sección — patrón que se repite también en `OrderCostAnalysis`
   y `OrderProduction` (ver nota cruzada abajo).
2. **Altura fija con `min-h-[200px]`** (línea 547) en el wrapper del empty state — valor en
   píxeles hardcodeado en vez de utilidad/token, en un archivo que por lo demás usa
   dimensionado basado en flex.
3. **Overrides de altura `!h-9`** en los inputs de edición de la tarjeta móvil (líneas
   362,378,390,403,414) — verificar si el componente `Input`/`Select` ya expone un prop de
   tamaño antes de mantener el override forzado.

Nota cruzada: el `CardTitle` a `text-lg font-medium` aparece de forma consistente en 3
archivos del módulo (este, `OrderCostAnalysis`, `OrderProduction`), lo que sugiere que es una
sub-escala deliberada para títulos de tarjeta dentro de un tab (un escalón por debajo del
título de página) más que un bug aislado — **decisión pendiente:** o se documenta esta
sub-escala en `design-context.md`, o se normalizan los 3 archivos a `text-xl font-medium`. Este
GAP solo cubre `OrderAuxiliaryLines`; los otros 2 se cubren en GAP-086 y GAP-087
respectivamente — mantener el mismo criterio en los 3.

## Solución acordada

- Mantener `text-lg font-medium` en los `CardTitle` de tab **si** Jose confirma la sub-escala
  como intencional (a decidir junto con GAP-086/087, mismo criterio en los 3 archivos); si no,
  subir a `text-xl font-medium`.
- Sustituir `min-h-[200px]` por una clase de altura basada en el mismo sistema de flex ya
  usado en el resto del archivo, o documentar por qué el valor fijo es necesario.
- Verificar el API de `Input`/`Select` para un prop de tamaño antes de mantener `!h-9`.

## Referencias e inspiración

- `.claude/design-context.md` § Typography — escala documentada de `CardTitle`/títulos.

## Criterios de aceptación

- [ ] El tratamiento de `CardTitle` es consistente con el criterio acordado para
      `OrderCostAnalysis`/`OrderProduction` (mismo tamaño en los 3).
- [ ] `min-h-[200px]` se sustituye por una solución basada en flex, o queda justificado con un
      comentario breve si no es posible.
- [ ] El override `!h-9` se justifica o se sustituye por un prop de tamaño existente.
- [ ] Ningún comportamiento de edición/creación de líneas auxiliares cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`

## Restricciones

- No mezclar con la extracción del diálogo de totales (GAP-085) en el mismo commit.

---

## Implementación

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

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

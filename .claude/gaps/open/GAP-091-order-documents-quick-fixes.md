# GAP-091 — OrderDocuments: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Hallazgos en `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx` (691
líneas), detectados en modo heurístico:

1. **Override de className que pelea con la variante** — `getBadgeClass` (línea ~315)
   devuelve `'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'`
   concatenado sobre un Badge `variant="outline"` (líneas 477-493) — el override contradice la
   variante ya aplicada en vez de añadir una variante CVA nueva (p.ej. "selected").
2. **Dos tratamientos distintos para el mismo concepto de "seleccionado"** — chips de
   documento usan `bg-primary` sólido (líneas 480-483) mientras botones de destinatario usan
   `bg-primary/20` translúcido (líneas 574-578) — mismo estado, dos pesos visuales distintos.
3. **Colores amber hardcodeados** (no semánticos) para el banner de aviso de maquilador —
   líneas 371, 409, 655 (`border-amber-200`, `bg-amber-50`, `text-amber-500` etc.) — funciona,
   pero no usa variables semánticas (`--warning`).
4. **`CardTitle` con override a `text-base`** en tarjetas de destinatario anidadas (línea 442)
   — crea un segundo nivel de tamaño de título no documentado.
5. **Anidamiento de 3 niveles de Card** (líneas 429, 439, 618-621, 644) — probablemente
   correcto visualmente (bordes sin elevación), pero merece una revisión visual real cuando
   haya sesión/Chromium disponibles.

## Solución acordada

- Añadir una variante CVA "selected" al Badge (o usar `variant="default"` si ya cubre el
  mismo efecto) en vez de concatenar clases que contradicen `outline`.
- Unificar el tratamiento visual de "seleccionado" entre chips de documento y botones de
  destinatario — mismo peso (`bg-primary` sólido o `bg-primary/20`, elegir uno y aplicarlo a
  ambos).
- Sustituir los colores `amber-*` hardcodeados por las variables semánticas `--warning`
  correspondientes, si el resultado visual se mantiene equivalente.
- Mantener el `CardTitle` a `text-base` en las tarjetas anidadas de destinatario **solo si**
  se documenta como un nivel válido para "card-en-card"; si no, evaluar quitar el anidamiento
  en vez de introducir un tercer nivel de tamaño.
- El anidamiento de Cards (punto 5) se deja como nota para revisión visual futura (no
  accionable en modo heurístico) — no hacer cambios estructurales sin confirmación visual.

## Referencias e inspiración

- `.claude/rules/components.md` § Cuándo crear componente/variante nueva.

## Criterios de aceptación

- [ ] El Badge "seleccionado" usa una variante propia del componente, no un className que
      contradice `outline`.
- [ ] Chips de documento y botones de destinatario usan el mismo tratamiento visual para
      "seleccionado".
- [ ] Los colores del banner de aviso de maquilador usan variables semánticas en vez de
      utilidades Tailwind de color crudo, si es viable sin cambiar el resultado visual.
- [ ] Ningún flujo de envío/selección de documentos cambia de comportamiento.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx`
- `src/components/ui/badge.tsx` (solo si se añade variante CVA nueva)

## Restricciones

- No reestructurar el anidamiento de Cards en este GAP (punto 5) — requiere revisión visual
  real primero.
- No cambiar la lógica de envío de documentos ni destinatarios.

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

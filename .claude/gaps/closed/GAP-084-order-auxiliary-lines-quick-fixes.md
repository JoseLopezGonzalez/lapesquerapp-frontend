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

- Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`
- `.claude/design-context.md` — nueva regla de sub-escala de `CardTitle` en § Typography.

### Decisiones tomadas durante la implementación

1. **`CardTitle` en `text-lg font-medium` (línea ~541-543):** Jose ya había confirmado la
   sub-escala como intencional (decisión no reabierta). Se dejó el tamaño sin cambios y se
   añadió un comentario JSX breve remitiendo a `design-context.md § Typography`. La regla
   completa quedó documentada en `design-context.md` con ejemplo de código, para que
   GAP-086 (`OrderCostAnalysis`) y GAP-087 (`OrderProduction`) apliquen exactamente el mismo
   criterio sin tener que redecidirlo.
2. **`min-h-[200px]` (línea ~553, ahora eliminado):** sustituido por una solución 100% flex.
   Se cambió `CardContent` de `min-h-0 flex-1 space-y-6 overflow-y-auto` a
   `flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto` (le faltaba `flex flex-col` para
   que un hijo con `flex-1` pudiera expandirse verticalmente), y el wrapper del empty state
   pasó de `flex min-h-[200px] flex-1 items-center justify-center` a
   `flex flex-1 items-center justify-center`. El resultado es idéntico visualmente (el
   `Card` padre ya fuerza la altura del tab vía `flex min-h-0 flex-1 flex-col`), sin ningún
   valor en píxeles hardcodeado. La rama con tabla (`rows.length > 0`) no se ve afectada:
   sigue siendo un bloque de altura natural dentro del nuevo contenedor flex-column.
3. **Overrides `!h-9` (líneas ~362,378,390,403,414,418,350):** se verificó el código fuente
   de `Input` (`src/components/ui/input.jsx`) y `Select`/`SelectTrigger`
   (`src/components/ui/select.jsx`). Ninguno de los dos expone un prop de tamaño que alcance
   `h-9`: `Input` es fijo en `h-8` (sin prop `size`), y `SelectTrigger` solo ofrece
   `size="default"` (`h-8`) y `size="sm"` (`h-7`) — no existe una variante que dé `h-9`. El
   mismo patrón `!h-9` ya existe de forma consistente en el archivo hermano
   `OrderPlannedProductDetails/index.tsx` (mismo módulo, mismo caso de tarjeta móvil
   editable), lo que confirma que es un override deliberado para un target táctil algo mayor
   en edición móvil, no un descuido aislado. Se mantuvo el override y se añadió un único
   comentario justificativo antes del bloque de edición de la tarjeta móvil (evita repetir
   el mismo comentario 6 veces).

### Desviaciones del plan (si las hay)

Ninguna. Los 3 fixes se aplicaron tal como los describía el GAP.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

Criterios de aceptación del GAP:
- [x] `CardTitle` consistente con criterio acordado (sub-escala `text-lg` intencional, decisión de Jose no reabierta) — CUMPLIDO. Comentario JSX añadido remitiendo a design-context.md.
- [x] `min-h-[200px]` sustituido por solución 100% flex — CUMPLIDO. `CardContent` pasó a `flex ... flex-col` para que el wrapper del empty state (`flex flex-1 items-center justify-center`) se expanda correctamente sin valor en px. Verificado que la rama con tabla no se ve afectada.
- [x] Override `!h-9` justificado — CUMPLIDO. Se verificó el código fuente de `Input` (fijo `h-8`, sin prop `size`) y `SelectTrigger` (`size="default"`→`h-8`, `size="sm"`→`h-7`, sin variante `h-9`). No existe prop de tamaño alternativo; se documentó con un único comentario que cubre los 6 usos del bloque de edición móvil, y se señaló la consistencia con `OrderPlannedProductDetails` (mismo patrón en archivo hermano).
- [x] Ningún comportamiento de edición/creación de líneas auxiliares cambia — CUMPLIDO. Revisado el diff completo: `handleInputChange`, `handleOnClickSaveLine`, `handleOnClickDeleteLine`, `handleOnClickCloseLine`, `handleConfirmDeleteLine` y todo el estado (`rows`, `temporaryRows`, `editIndex`, `deleteConfirmRow`) quedan intactos. Solo se tocaron clases CSS y comentarios.

Checklist técnico del proyecto:
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso (no se tocó ningún hook)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados
- [x] Nomenclatura correcta
- [x] `npm run type-check` limpio (0 errores)
- [x] `npm run lint` sin errores nuevos ni warnings nuevos en el archivo (269 warnings preexistentes en el repo, ninguno en `OrderAuxiliaryLines/index.tsx`)

### Revisión Visual

- [x] Color: sin valores hardcodeados nuevos
- [x] Tipografía: `text-lg font-medium` documentado ahora en design-context.md como sub-escala válida
- [x] Layout: cambio de `min-h-[200px]` a flex puro, sin regresión visual (Card padre ya fuerza altura del tab)
- [x] Componentes: mismos componentes (`Input`, `Select`, `Combobox`, `CardTitle`) — sin sustituciones
- [x] Sin inline styles añadidos
- [x] Sin colores hardcodeados

**Veredicto visual:** ✅ APROBADO

### Revisión UX — LIGHT

GAP: GAP-084 — OrderAuxiliaryLines quick fixes
Mode: Light (cambios puramente visuales/estructurales, sin flujo nuevo)

- [x] El cambio es autoexplicativo — no hay cambio visible para el usuario final (el empty state se ve igual, el override táctil se mantiene)
- [x] No introduce decisión nueva del usuario
- [x] Consistente con la UI circundante — sigue el patrón ya usado en `OrderPlannedProductDetails`
- [x] N/A hover/focus/active — no se tocaron estados interactivos
- [x] N/A texto — no se cambió copy

**VERDICT: ✅ APROBADO**

### System Learner check

No se invoca. Los 3 hallazgos ya quedan cubiertos por la nueva regla en `design-context.md` (sub-escala de `CardTitle`) y por comentarios inline justificativos en el propio código — no hay patrón nuevo no cubierto por checklists existentes que amerite una entrada separada en `project-learnings.md`.

### Observaciones para Jose

Implementación limpia y quirúrgica. Los 3 fixes son exactamente los que pedía el GAP, sin
tocar nada de lógica de negocio. Un detalle a vigilar en GAP-086/087: al replicar la regla de
`CardTitle`, revisad también si esos archivos tienen el mismo problema de `CardContent` sin
`flex flex-col` — si usan `min-h-[Npx]` de forma similar, el fix de aquí (añadir `flex flex-col`
al `CardContent` antes de poder quitar el min-h del hijo) es el patrón a reutilizar, no solo el
resultado final.

### Estado final de la implementación

`OrderAuxiliaryLines/index.tsx`: `CardTitle` documentado con comentario + regla en
design-context.md; empty state desktop 100% flex sin píxeles hardcodeados; overrides `!h-9`
justificados con comentario único. `design-context.md § Typography` ahora contiene la regla
de sub-escala completa, con ejemplo de código, lista para ser referenciada sin reinterpretación
en GAP-086 (`OrderCostAnalysis`) y GAP-087 (`OrderProduction`).

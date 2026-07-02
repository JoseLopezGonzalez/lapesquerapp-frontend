# GAP-085 — Extraer componente compartido para el diálogo "Totales" móvil

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Tres tabs del editor de pedidos reimplementan de forma casi verbatim el mismo patrón visual
de "diálogo de totales" en móvil: filas de estadística con label
`text-xs uppercase tracking-wide` + valor `text-xl font-medium` + separador `border-t pt-4`:

- `OrderPlannedProductDetails/index.js:620-651`
- `OrderProductDetails/index.js:160-219` (aprox., bloque equivalente)
- `OrderAuxiliaryLines/index.tsx:482-529` (diálogo de totales móvil)

Cada archivo mantiene su propia copia de ~30-50 líneas de JSX estructuralmente idéntico, lo
que aumenta el riesgo de que una futura corrección de estilo solo se aplique en una de las
tres copias.

## Solución acordada

Extraer un componente compartido (p.ej. `OrderTotalsSummaryDialog` o similar, ubicado junto a
las secciones que lo usan o en `src/components/Admin/OrdersManager/Order/components/`) que
reciba una lista de `{ label, value }` (o similar) y renderice el patrón de filas +
separador, reutilizándolo en los 3 archivos.

## Referencias e inspiración

- `.claude/rules/components.md` § "Cuándo crear un componente nuevo" — regla de 3+ repeticiones
  con la misma lógica ya se cumple aquí.
- Bloques JSX actuales en los 3 archivos referenciados arriba como base del diseño de props.

## Criterios de aceptación

- [ ] Existe un único componente compartido para el patrón "diálogo de totales".
- [ ] Los 3 archivos lo usan en vez de su copia local del JSX.
- [ ] El contenido y comportamiento visual de cada diálogo de totales no cambia respecto al
      actual (mismos labels, mismos valores, mismo orden).

## Archivos a crear o modificar

- Nuevo: `src/components/Admin/OrdersManager/Order/components/OrderTotalsSummaryDialog.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`

## Restricciones

- El nuevo componente debe ser `.tsx` (regla de oro 3 — nunca crear `.js` nuevos), aunque dos
  de los tres consumidores actuales sean `.js`.
- No cambiar qué datos se muestran en cada diálogo — solo extraer el shell visual compartido.

---

## Implementación

### Archivos creados

- `src/components/Admin/OrdersManager/Order/components/OrderTotalsSummaryDialog.tsx` —
  componente compartido que envuelve `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/
  `DialogDescription` y renderiza una lista de filas `{ key, label, value }` con el patrón
  visual `text-xs uppercase tracking-wide` (label) + `text-xl font-medium` (valor), separadas
  por `border-t pt-4` (excepto la primera fila). Recibe `open`, `onOpenChange`, `title`,
  `description`, `items` e `isMobile` para reproducir exactamente el layout fullscreen en
  mobile / centrado en desktop que ya tenían los 3 usos originales.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx` — sustituido
  el bloque `<Dialog>` de totales (Cajas, Cantidad, Precio promedio) por
  `<OrderTotalsSummaryDialog>`; eliminado el import de `Dialog/DialogContent/DialogDescription/
  DialogHeader/DialogTitle` (ya no se usa directamente, `AlertDialog` se mantiene para el
  diálogo de confirmación de borrado, que no forma parte de este GAP).
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx` — sustituido el
  bloque `<Dialog>` de totales (Cajas, Cantidad, Precio promedio, Subtotal, Total) por
  `<OrderTotalsSummaryDialog>`; eliminado el import de `Dialog` completo (este archivo no usa
  `AlertDialog`).
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx` — sustituido el
  bloque `<Dialog>` de totales (Subtotal, Total con IVA) por `<OrderTotalsSummaryDialog>`;
  eliminado el import de `Dialog/DialogContent/DialogDescription/DialogHeader/DialogTitle`
  (`AlertDialog` se mantiene, fuera de scope de este GAP).

### Decisiones tomadas durante la implementación

- Los 3 archivos referenciados en el GAP ya estaban en `.tsx` al momento de implementar
  (migrados en GAP-082/083/084, no `.js` como indicaba la lista original de "Archivos a crear
  o modificar" del GAP). Se localizaron los bloques por el patrón visual
  (`uppercase tracking-wide` / `border-t pt-4` / `text-xl font-medium`), no por los números de
  línea del documento original, que ya no coincidían.
- El componente compartido encapsula también el `Dialog`/`DialogContent`/`DialogHeader` (no
  solo las filas internas), porque las 3 copias eran idénticas también en ese shell —
  encapsularlo evita que el componente sea solo una lista de `<p>` y de verdad reduce la
  duplicación real: JSX de dialog + wrapper responsive mobile/desktop.
- Prop `items: { key, label, value }[]`: `key` como identificador estable de React (no se
  reutiliza `label` porque en teoría podría repetirse), `value` recibido ya formateado como
  `string` — cada consumidor sigue llamando a su propio formatter (`formatInteger`,
  `formatDecimalWeight`, `formatDecimalCurrency`) antes de pasarlo, así el componente
  compartido no necesita conocer qué tipo de dato es cada total. Esto cubre sin hacks las 3
  variantes reales: 3 filas (previsión), 5 filas (detalle de productos) y 2 filas (líneas
  auxiliares), cada una con su propio `title`/`description`.
- El separador `border-t pt-4` se aplica condicionalmente por índice (`index > 0`) en vez de
  hardcodear una clase distinta en la primera fila del array de `items`, preservando el mismo
  resultado visual con una sola fuente de verdad.

### Desviaciones del plan (si las hay)

- Los 3 archivos a modificar eran `.tsx` en vez de `.js`/`.tsx` mixto como decía el GAP
  original — no afecta al resultado, solo corrige la premisa inicial (ya migrados por GAPs
  anteriores). No se tocó ningún archivo fuera de los 4 listados (1 creado + 3 modificados).

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

### Revisión Visual

- [x] Color: solo tokens semánticos (`text-muted-foreground`, `text-foreground`) — sin hex/rgb
- [x] Tipografía: `text-xs uppercase tracking-wide` (label) y `text-xl font-medium` (valor)
      idénticos a las 3 copias originales; `DialogTitle`/`DialogDescription` sin tocar,
      vienen del primitivo shadcn
- [x] Layout: mismo wrapper responsive mobile-fullscreen / desktop-centrado que las 3 copias
- [x] Componentes: reutiliza `Dialog` de shadcn nativamente, sin reescritura de internals
- [x] Paridad con referencia: los 3 diálogos renderizan mismos labels, mismos valores, mismo
      orden y mismo separador que antes de la extracción
- [x] Sin inline styles, sin colores hardcodeados

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

Refactor interno puro (extracción de shell visual), sin cambio de comportamiento ni de
contenido visible para el usuario. No introduce flujo nuevo ni decisión de usuario nueva —
corresponde Light Review, no requiere `ux-reviewer`.

```
[x] El cambio es autoexplicativo — no hay cambio de comportamiento visible
[x] No introduce decisión nueva del usuario
[x] Consistente con la UI circundante — output visual idéntico al anterior
[x] Interactivo: hereda hover/focus/active de los primitivos Dialog/Button sin tocar
[x] Sin cambios de copy
```

**VERDICT:** ✅ APROBADO

### Observaciones para Jose

Implementación limpia y fiel al GAP. Un par de notas menores, ninguna bloqueante:

1. El componente encapsula el `Dialog` completo (no solo las filas), decisión razonable
   porque el shell `DialogContent`/mobile-fullscreen también era 100% idéntico en los 3 casos
   — reduce más duplicación real que limitarse a las filas internas.
2. `value` se recibe pre-formateado como `string` en vez de pasar el número crudo + un tipo de
   formato (`'currency' | 'integer' | 'weight'`) al componente compartido. Es la decisión
   correcta: mantiene el componente ciego al dominio (no necesita conocer
   `formatDecimalCurrency` vs `formatInteger`) y no hay lógica de negocio en un componente de
   presentación pura.
3. Verificado con `git diff` que en los 3 archivos modificados el único contenido tocado es el
   bloque de import de `Dialog` y el bloque JSX de totales — ninguna otra línea del componente
   fue rozada, cumpliendo la restricción del GAP.
4. `npm run type-check` limpio (0 errores) y `npm run lint` sin errores nuevos introducidos
   (269 warnings preexistentes en archivos no relacionados con este GAP, confirmado por grep
   dirigido a los 4 archivos tocados).

### Estado final de la implementación

`OrderTotalsSummaryDialog.tsx` es un componente de presentación puro: recibe `open`,
`onOpenChange`, `title`, `description`, `items: { key, label, value }[]` e `isMobile`, y
renderiza el `Dialog` shadcn con las filas de estadística. Los 3 archivos que antes duplicaban
~30-50 líneas de JSX casi idéntico ahora lo consumen con 6-20 líneas de invocación declarativa,
cada uno formateando sus propios valores antes de pasarlos. Sin cambios de comportamiento
visible para el usuario.

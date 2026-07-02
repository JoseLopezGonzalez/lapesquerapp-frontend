# GAP-083 — OrderProductDetails: quick fixes de diseño

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
`src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js` (291 líneas),
detectados en modo heurístico:

> **Nota de corrección:** igual que en GAP-082, el hallazgo original de "falta skeleton de
> carga inicial" se descartó — este componente solo lee `order` de `useOrderContext()`, ya
> gateado por el `Skeleton` de página completa en `Order/index.tsx:148-166`.

1. **Labels desalineados entre mobile y desktop** — labels en tarjetas móviles usan
   `text-xs font-medium tracking-wide uppercase` (líneas 92,98,106,114,120,128), mientras la
   tabla desktop para los mismos campos usa `TableHead` plano sin uppercase (líneas 245-251).
2. **Alineación numérica inconsistente entre tabs hermanas** — las columnas numéricas (Cajas,
   Cantidad, Precio, Subtotal, Total) no llevan `text-right` (líneas 246-251), a diferencia de
   la tabla desktop de `OrderPlannedProductDetails` que sí alinea a la derecha sus columnas
   numéricas equivalentes (líneas 691-696 de ese archivo).
3. **Falta `tabular-nums`** en ninguna celda numérica de tabla ni tarjeta móvil (líneas
   95-131, 261-266), pese a que la regla documentada lo pide para cantidades/IDs.

## Solución acordada

- Alinear el tratamiento de labels entre mobile y desktop: decidir un único patrón (sugerido:
  `text-xs text-muted-foreground` documentado, sin uppercase forzado) y aplicarlo en ambas
  variantes.
- Añadir `text-right` a las columnas numéricas de la tabla desktop, igualando el patrón ya
  usado en `OrderPlannedProductDetails`.
- Añadir `tabular-nums` a todos los valores numéricos (cantidades, precios, totales) tanto en
  la tabla desktop como en las tarjetas móviles.

## Referencias e inspiración

- `.claude/design-context.md` § Typography — `tabular-nums` en IDs/cantidades.
- `OrderPlannedProductDetails/index.js:691-696` — tabla hermana con alineación correcta, usar
  como referencia directa.

## Criterios de aceptación

- [x] Los labels de campo usan el mismo tratamiento tipográfico en mobile y desktop.
- [x] Las columnas numéricas de la tabla desktop están alineadas a la derecha
      (`text-right`).
- [x] Todos los valores numéricos (tabla y tarjetas) usan `tabular-nums`.
- [x] Ningún dato ni cálculo cambia.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx`

## Restricciones

- No añadir un skeleton de carga inicial (ya cubierto por el componente padre).
- No mezclar con la extracción del diálogo de totales (GAP-085) en el mismo commit.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx`
  - Labels de tarjetas móviles (Cajas, Cantidad, Precio, Impuesto, Subtotal, Total):
    quitado `font-medium tracking-wide uppercase`, quedando `text-muted-foreground text-xs`
    — mismo tratamiento que los `TableHead` de desktop.
  - `TableHead` de la tabla desktop (Cajas, Cantidad, Precio, Impuesto (%), Subtotal, Total):
    añadido `text-right`.
  - `TableCell` del body de la tabla (mismas columnas): añadido `text-right tabular-nums`.
  - `TableCell` del `TableFooter` (fila de totales, mismas columnas): añadido
    `text-right tabular-nums` para no romper la alineación vertical con el header/body de
    la misma tabla (mismas columnas listadas en el GAP, ninguna fuera de alcance).
  - Valores numéricos de las tarjetas móviles: añadido `tabular-nums` en el `<p>` de valor.

### Decisiones tomadas durante la implementación

- El archivo ya estaba en `.tsx` (migración previa no relacionada, ya presente en el working
  tree antes de empezar) — no fue necesaria la migración JS→TS prevista en el GAP. Se
  actualizó la ruta en "Archivos a crear o modificar" de `.js` a `.tsx` para reflejarlo.
- El patrón elegido para los labels es el sugerido en el GAP: `text-muted-foreground text-xs`
  sin uppercase forzado, igual al `TableHead` plano de desktop.
- Se alineó también la fila de `TableFooter` (totales) aunque el GAP cita explícitamente
  solo las líneas del header (245-251): son las mismas columnas de la misma tabla, y dejarla
  sin alinear habría creado una inconsistencia visual nueva dentro del propio componente.
- No se tocó el diálogo de Totales (mobile, líneas ~183-222) — pertenece a GAP-085 según la
  restricción explícita del GAP.

### Desviaciones del plan (si las hay)

- Ninguna relevante. La única diferencia es que no hizo falta migrar `.js`→`.tsx` porque el
  archivo ya estaba en `.tsx` por trabajo previo no relacionado con este GAP.

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

- [x] Color: solo tokens semánticos (`text-muted-foreground`, `text-foreground`) — sin hex/rgb/oklch hardcodeados.
- [x] Tipografía: `text-xs text-muted-foreground` para labels coincide exactamente con la fila "Column headers, field labels above inputs" de la escala documentada en design-context.md.
- [x] Layout: sin cambios estructurales, solo clases de alineación/tipografía.
- [x] Componentes: mismos componentes shadcn (`Table`, `TableHead`, `TableCell`, `Card`) — sin sustituciones.
- [x] Paridad con referencia: `text-right` en `TableHead`/`TableCell` replica exactamente el patrón de `OrderPlannedProductDetails/index.tsx:744-748`.
- [x] Estado loading/empty/error: sin cambios (fuera de alcance del GAP, correcto).
- [x] Mobile: `useIsMobileSafe` ya en uso (cambio preexistente no relacionado con este GAP).
- [x] Sin inline styles nuevos añadidos por este GAP.
- [x] Sin colores hardcodeados.
- [x] `TableHead` mantiene Title Case ("Artículo", "Cajas"...) — correcto, no se tocó.

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

```
[x] El cambio es autoexplicativo — alineación numérica y labels consistentes no requieren instrucción
[x] No introduce ninguna decisión nueva del usuario
[x] Consistente con la UI circundante — iguala el patrón ya usado en OrderPlannedProductDetails
[x] No interactivo (solo texto/tabla) — n/a hover/focus/active
[x] No hubo cambio de copy — mismos textos de labels y headers
```

**VERDICT:** ✅ APROBADO

### Observaciones para Jose

Implementación limpia y exactamente en el alcance del GAP. Dos notas:

1. El archivo ya estaba migrado a `.tsx` por trabajo previo no relacionado (working tree ya
   lo tenía modificado con `useIsMobileSafe`/`MOBILE_SAFE_AREAS` antes de empezar este GAP).
   No hizo falta ejecutar el protocolo de migración JS→TS previsto — se documentó la
   desviación y se corrigió la referencia de archivo en el propio GAP.
2. Se extendió el `text-right tabular-nums` también a la fila de `TableFooter` (totales),
   que el GAP no cita literalmente por número de línea pero son las mismas columnas de la
   misma tabla — dejarla sin alinear habría creado una inconsistencia vertical nueva entre
   header/body/footer de la propia tabla. Es una interpretación fiel del criterio de
   aceptación ("las columnas numéricas de la tabla desktop están alineadas a la derecha"),
   no un archivo ni componente fuera de alcance.

No se tocó el diálogo de Totales (mobile) — pertenece a GAP-085 según restricción explícita.
Ningún dato ni cálculo cambió: se verificó que todos los `formatXxx(...)` y los valores de
`totals`/`detail` pasados permanecen idénticos, solo cambiaron las clases CSS envolventes.

### Estado final de la implementación

`OrderProductDetails/index.tsx` ahora usa un único tratamiento tipográfico para labels de
campo (`text-muted-foreground text-xs`) tanto en tarjetas móviles como en la cabecera de
tabla desktop. La tabla desktop alinea a la derecha todas sus columnas numéricas (header,
body y footer) y aplica `tabular-nums` de forma consistente con las tarjetas móviles.
`npm run type-check` y `npx eslint` sobre el archivo no reportan errores.

# GAP-081 — OrderDetails: quick fixes de diseño

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose (vía /audit-design visual, hallazgo auditor)

---

## Contexto y problema

Varios hallazgos menores en `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
(628 líneas), detectados en modo heurístico (sin captura de pantalla):

1. **Duplicación de contenido** — "Coste total" y "Margen bruto" se muestran dos veces en la
   vista móvil: una vez bajo "Rentabilidad" (líneas 187-203) y otra vez, verbatim, bajo
   "Resumen" (líneas 244-253).
2. **Drift de peso de label entre mobile y desktop** — el label de un mismo dato usa
   `text-sm font-medium` en móvil (línea 110) pero `text-muted-foreground text-sm` (sin
   `font-medium`) en desktop (línea 362), para el mismo campo.
3. **Empty state informal** — la ausencia de dirección de envío para el mapa se muestra con un
   `<div>` con texto plano ("No hay dirección de envío", líneas 339, 617) en vez del patrón
   `EmptyState` documentado.
4. **Balance de la tarjeta "Envío"** — en desktop, la tarjeta "Envío" ocupa `md:col-span-2`
   mientras sus tarjetas hermanas ("Comercial"/"Rentabilidad"/"Resumen") ocupan
   `md:col-span-1` (línea 352, 505) — verificar visualmente si el resultado queda descompensado
   antes de decidir si amerita cambio.

Nota: el widget de matrícula de camión con `style={{ fontFamily: 'OCR A Std, monospace',
fontWeight: 600 }}` (líneas 572, 587) es un efecto visual deliberado (matrícula estilo
placa) — **no se toca en este GAP**, se documenta como excepción intencional.

## Solución acordada

- Eliminar la duplicación de "Coste total"/"Margen bruto", dejando el dato en una única
  sección ("Rentabilidad" o "Resumen", a decidir por cuál agrupa mejor el resto de su
  contexto).
- Igualar el peso del label entre mobile y desktop (usar `text-sm text-muted-foreground` sin
  `font-medium` en ambos, o `font-medium` en ambos — alinear al patrón que use el resto de la
  vista de detalles predominantemente).
- Sustituir el `<div>` de texto plano por el patrón `EmptyState` (o una versión ligera del
  mismo si el contexto de tarjeta de mapa es demasiado pequeño para el `EmptyState` completo —
  a criterio del implementador, manteniendo icono + texto como mínimo).
- Revisar visualmente el balance de la tarjeta "Envío" tras los cambios anteriores; solo
  ajustar el `col-span` si el resultado se ve claramente descompensado.

## Referencias e inspiración

- `.claude/design-context.md` § Empty States.
- Resto de tarjetas de la misma vista como referencia de peso de label.

## Criterios de aceptación

- [ ] "Coste total" y "Margen bruto" aparecen una única vez en la vista móvil.
- [ ] El peso del label es consistente entre la variante mobile y desktop para el mismo dato.
- [ ] La ausencia de dirección de envío usa un patrón de empty state con icono, no solo texto.
- [ ] Ningún dato ni cálculo cambia — solo presentación.

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`

## Restricciones

- No tocar el widget de matrícula (líneas 571-596) — es un efecto visual intencional.
- No modificar los cálculos de coste/margen/rentabilidad.

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`

### Decisiones tomadas durante la implementación

1. **Duplicación** — se eliminó el bloque duplicado de "Coste total"/"Margen bruto"/
   "Margen %" de la sección móvil "Resumen", dejándolo únicamente en "Rentabilidad".
   Criterio: la variante desktop ya no duplica estos 3 campos en su card "Resumen" (solo
   están en la card "Rentabilidad") — se alineó mobile a ese mismo patrón ya existente en
   desktop, en vez de decidir arbitrariamente.
2. **Peso de label** — se quitó `font-medium` de los 12 labels `text-sm` de la sección
   mobile (`text-muted-foreground text-sm font-medium` → `text-muted-foreground text-sm`),
   igualando el patrón ya usado en desktop (`text-muted-foreground text-sm`, sin peso extra)
   para el mismo dato. No se tocaron los labels `text-xs font-medium` ("Destino en sus
   docs"/"Lugar de carga") porque esos ya coinciden entre mobile y desktop — no forman
   parte del drift descrito en el GAP.
3. **Empty state del mapa** — sustituidos ambos `<div>` de texto plano ("No hay dirección de
   envío") por `<EmptyState>` con icono `MapPinOff` (lucide-react), título "Sin dirección de
   envío" y descripción "No hay dirección configurada para mostrar en el mapa.". Se pasó
   `className="bg-muted/30 h-[270px]"` (+ `rounded-lg` en mobile) porque `EmptyState` solo
   aplica su fondo `bg-muted/30 h-full` por defecto cuando NO se pasa `className` — al pasar
   una altura fija había que replicar el fondo manualmente para no perder el estilo visual
   original.
4. **Balance de la card "Envío"** — revisado el grid: `Comercial(1)+Rentabilidad(1)+Resumen(1)`
   llenan la primera fila de 3 columnas; `Envío(2)+Mapa(1)` llenan la segunda fila
   exactamente igual (2+1=3). El resultado ya está balanceado numéricamente sin necesidad de
   tocar `col-span` — no se hizo ningún cambio en este punto, tal como permitía el GAP ("solo
   ajustar si el resultado se ve claramente descompensado"). No se pudo verificar visualmente
   en navegador en esta sesión (ver Observaciones de auditoría).

### Desviaciones del plan (si las hay)

Ninguna funcional. El widget de matrícula (líneas ~574-596, `style={{ fontFamily: 'OCR A
Std, monospace' }}`) no se tocó, tal como pedía la restricción explícita del GAP.

---

## Auditoría

### Resultado: ⚠️ APROBADO CON OBSERVACIONES

### Puntuación: 8/10 — los 4 hallazgos resueltos siguiendo el patrón ya existente en el propio archivo (desktop como fuente de verdad), pero sin verificación visual real en navegador

### Checklist

- [x] Criterios de aceptación cumplidos (dedup, peso de label, empty state — verificados por lectura de código)
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (EmptyState, Lucide, `cn`/Tailwind tokens)
- [x] Nomenclatura correcta

### Revisión Visual

- [x] "Coste total"/"Margen bruto"/"Margen %" aparecen una única vez en mobile (verificado leyendo el JSX resultante)
- [x] Labels `text-sm` sin peso extra en mobile, consistentes con desktop
- [x] Empty state con icono (`MapPinOff`) + título + descripción, patrón estándar
- [x] Sin cambios de cálculo — solo se tocó JSX/clases, ninguna función `getNullable*` se modificó
- [ ] **No verificado en navegador real** — mismo motivo que GAP-080 (sin dev server activo en esta sesión)

**Veredicto visual:** ⚠️ APROBADO CON OBSERVACIONES — pendiente de confirmación visual manual, especialmente el balance de la card "Envío" en desktop.

### Revisión UX — Light

- [x] Autoexplicativo
- [x] No introduce decisión nueva de usuario
- [x] Consistente — mobile ahora sigue el mismo criterio que desktop en el mismo archivo
- [x] N/A hover/focus (sin nuevos elementos interactivos)
- [x] Tono del empty state coherente con el resto de la app

VERDICT: ✅ APROBADO

### Observaciones para Jose

Mismo aviso que en GAP-080: no se verificó visualmente en navegador por no tener el dev
server activo en esta sesión. Los cambios son mecánicos y de bajo riesgo (eliminar
duplicado, igualar una clase Tailwind, sustituir un `<div>` por `EmptyState`), pero te pido
una revisión visual rápida de `/admin/orders/[id]` → pestaña Información, en mobile y
desktop, antes de considerarlo cerrado en la práctica. Sobre el punto 4 (balance de "Envío"):
decidí no tocar el `col-span` porque la aritmética del grid ya cuadra (2+1=3 en la segunda
fila), pero como es un juicio visual, confírmalo tú si tienes duda.

### Estado final de la implementación

`OrderDetails/index.tsx`: mobile ya no duplica Coste total/Margen bruto/Margen % (solo en
"Rentabilidad"); los labels `text-sm` de mobile ya no llevan `font-medium` extra
(consistentes con desktop); ambos empty states del mapa (mobile y desktop) usan el patrón
`EmptyState` con icono `MapPinOff`. `col-span` de la card "Envío" sin cambios — ya está
balanceado.

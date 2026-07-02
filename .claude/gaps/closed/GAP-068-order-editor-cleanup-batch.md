# GAP-068 — Batch: estilo inline duplicado de safe-area, space-y en flex, img→next/image en el editor de pedidos

## Metadata

- **Tipo:** Mejora
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Batch de 3 findings de baja severidad detectados en `/audit-desktop order editor`
(2026-07-01) — ninguno rompe funcionalidad, pero los tres violan patrones explícitos de
`.claude/design-context.md`.

### FND-A — `style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}` duplicado en 6 archivos

Valor inline idéntico repetido literalmente en:
- `Order/OrderPallets/components/OrderPalletsToolbar.jsx:34`
- `Order/OrderPlannedProductDetails/index.js:575`
- `Order/OrderProduction/index.js:169`
- `Order/OrderIncident/index.js:230`
- `Order/OrderAuxiliaryLines/index.tsx:484`
- `Order/OrderProductDetails/index.js:146`

design-context.md § 7 prohíbe `style={{ }}` inline en componentes nuevos o modificados. Al
estar duplicado 6 veces de forma literal, cualquier ajuste futuro (p. ej. cambiar `0.75rem`)
requiere editar 6 sitios a mano — riesgo real de divergencia silenciosa.

### FND-B — `space-y-*` dentro de contenedores flex en vez de `gap-*`

design-context.md § 7: "Never use `space-y-*` in flex or grid layouts — use `gap-*`."
Encontrado en:
- `Order/components/OrderTabsDesktop.jsx:37` — `className="... flex ... flex-col space-y-4 py-3 sm:space-y-8"`
- `Order/index.tsx:71` (tabClass de la pestaña `details`) — `'space-y-4 w-full h-full overflow-y-auto'` dentro de un `TabsContent`
- `Order/OrderEditSheet/index.js:458` — wrapper del `OrderEditFormSkeleton` (`<div className="space-y-3">` dentro de un `grid gap-6`)

Visualmente funciona igual (space-y también apila verticalmente en flex-col), pero diverge
de la convención documentada del proyecto.

### FND-C — `<img>` nativo para la imagen de transporte en vez de `next/image`

`Order/components/OrderHeaderDesktop.jsx:170-174`:
```jsx
<img
  className="max-w-[240px]"
  src={transportImage}
  alt={`Transporte ${order.transport?.name || ''}`}
/>
```
design-context.md § 8: "Icons are Lucide-only, images are `next/image`." Sin `width`/`height`
tampoco, lo que puede causar layout shift. Los 6 assets de transporte en
`public/images/transports/*.png` tienen todos la misma proporción real (`trailer.png` =
1000×354 ≈ 2.82:1).

## Solución acordada

### FND-A

Añadir un token nuevo a `src/lib/design-tokens-mobile.ts`, siguiendo la convención existente
de `MOBILE_SAFE_AREAS` (que ya expone `BOTTOM_WITH_NAV` como clase `pb-20`):

```ts
export const MOBILE_SAFE_AREAS = {
  // ...existentes
  BOTTOM_INSET: 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
};
```

Reemplazar el `style={{ paddingBottom: ... }}` inline en los 6 archivos por
`className={MOBILE_SAFE_AREAS.BOTTOM_INSET}` (combinando con las demás clases existentes vía
`cn()` si el elemento ya tiene otras clases).

### FND-B

Reemplazar `space-y-N` por `gap-N` en los 3 sitios identificados. Sin cambio visual esperado
(flex-col con gap se comporta igual que space-y para este caso).

### FND-C

Migrar el `<img>` a `next/image`:
```jsx
import Image from 'next/image';

<Image
  src={transportImage}
  alt={`Transporte ${order.transport?.name || ''}`}
  width={240}
  height={85}
  className="h-auto w-full max-w-[240px]"
/>
```
(240×85 mantiene la proporción real de los assets — 1000×354 ≈ 2.82:1 — evitando layout shift.)

## Referencias e inspiración

- design-context.md § 3 Spacing & Layout, § 7 What NOT To Do, § 8 UX Principles
- `src/lib/design-tokens-mobile.ts` — convención `MOBILE_SAFE_AREAS` ya existente
- `src/components/Admin/OrdersManager/Order/utils/getTransportImage.js` — lista de assets afectados

## Criterios de aceptación

- [x] `MOBILE_SAFE_AREAS.BOTTOM_INSET` existe en `design-tokens-mobile.ts` con la clase `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`
- [x] Los 6 archivos de FND-A usan ese token en vez del `style={{ paddingBottom: ... }}` inline
- [x] Los 3 sitios de FND-B usan `gap-*` en vez de `space-y-*`
- [x] `OrderHeaderDesktop.jsx` usa `next/image` con `width={240} height={85}` en vez de `<img>`
- [x] El resultado visual (espaciado y tamaño de imagen) es idéntico al actual en desktop y mobile
- [x] `npm run type-check` pasa sin errores

## Archivos a crear o modificar

**Modificar:**
- `src/lib/design-tokens-mobile.ts` — añadir `MOBILE_SAFE_AREAS.BOTTOM_INSET`
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.jsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.js`
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.js`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.jsx`
- `src/components/Admin/OrdersManager/Order/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.jsx`

## Restricciones

- No tocar ningún otro `style={{ }}` fuera de los 6 sitios listados en FND-A (p. ej. no tocar `OrderMap`, `OrderDetails` iframes ni `ChartTooltip` — fuera de scope de este GAP)
- No renombrar ningún `.js`/`.jsx` a `.tsx` en este GAP (scope de GAP-061)
- No cambiar el valor de `0.75rem` — solo extraer a token, mismo valor exacto
- Verificar visualmente en un viewport móvil real (o simulado) que el padding inferior no cambia tras el refactor

---

## Implementación

### Archivos creados

Ninguno (renombrado, no creación: ver más abajo).

### Archivos modificados

- `src/lib/design-tokens-mobile.ts` — añadido `MOBILE_SAFE_AREAS.BOTTOM_INSET`; renombrado desde `design-tokens-mobile.js` (era legacy `.js`, migración obligatoria al tocarlo — regla de oro 3 / CLAUDE.md)
- `src/components/Admin/OrdersManager/Order/OrderPallets/components/OrderPalletsToolbar.tsx` (FND-A)
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx` (FND-A)
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx` (FND-A)
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx` (FND-A)
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx` (FND-A)
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx` (FND-A)
- `src/components/Admin/OrdersManager/Order/components/OrderTabsDesktop.tsx` (FND-B, 2 sitios)
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx` (FND-B, 1 sitio)
- `src/components/Admin/OrdersManager/Order/components/OrderHeaderDesktop.tsx` (FND-C)

### Decisiones tomadas durante la implementación

- Los 10 archivos listados en el GAP original ya estaban en `.tsx` en el momento de implementar (migrados por GAP-061/GAP-067 y otros en paralelo entre 2026-07-01 y hoy); localizados por ruta real de directorio, no por la extensión listada originalmente. `Order/index.tsx` en concreto ya no contiene el `tabClass` de FND-B — ese código vive ahora en `OrderTabsDesktop.tsx` (líneas 76-81), donde se aplicó el fix.
- `design-tokens-mobile.ts` en el GAP ya se listaba como `.ts`, pero el archivo real seguía siendo `design-tokens-mobile.js`. Se migró a `.ts` en este mismo commit (regla de oro 3), incluyendo tipado explícito del rest param de `combineMobileClasses` (antes implícito `any`, incompatible con `strict: true`).
- FND-B sitio 2 (`OrderTabsDesktop.tsx`, tabClass de `details` y su rama `else`): a diferencia del sitio 1 (ya `flex flex-col`) y el sitio 3, estos dos contenedores NO eran flex antes del cambio — `space-y-4` funcionaba ahí como spacing de bloque normal. Reemplazar `space-y-4` por `gap-4` sin más habría roto el espaciado (gap no funciona sin `display:flex`/`grid`). Se añadió `flex flex-col` junto con `gap-4` para preservar el resultado visual exacto, convergiendo con el patrón que la rama `compactTabs` ya usaba (`h-full min-h-0 flex flex-col`) para el resto de pestañas.
- FND-B sitio 3 (`OrderEditFormSkeleton` en `OrderEditSheet/index.tsx`): mismo razonamiento — el `<div className="space-y-3">` no era flex, así que se cambió a `flex flex-col gap-3` para mantener el mismo apilado vertical con `gap-*` en vez de `space-y-*`.
- FND-A: se usó `cn()` de `@/lib/utils` para combinar la clase estática existente con `MOBILE_SAFE_AREAS.BOTTOM_INSET`, siguiendo el precedente ya establecido en `StopDetailDrawer.jsx` (`cn(classes, MOBILE_SAFE_AREAS.BOTTOM)`).
- FND-C: `transportImage` es un `string` (ruta local bajo `public/images/transports/`, ver `getTransportImage.ts`), no un import estático — `next/image` acepta rutas locales por string sin configuración adicional en `next.config.mjs`.

### Desviaciones del plan (si las hay)

- Ninguna funcional. Diferencias de forma: (a) rutas de archivo con extensión `.tsx` en vez de `.js`/`.jsx` para 9 de los 10 archivos listados originalmente, mismo componente; (b) `design-tokens-mobile.ts` no existía como tal — se migró desde `.js` en este commit; (c) los 2 sitios de FND-B en "tabClass" requirieron añadir `flex flex-col` (no solo sustituir `space-y-*` por `gap-*`) para no romper el espaciado visual, ya que esos contenedores no eran flex de partida — desviación menor respecto al texto del GAP ("space-y-N por gap-N... sin cambio visual esperado"), pero necesaria para cumplir ese mismo criterio de "resultado visual idéntico".

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10 — implementación limpia y fiel al GAP; penalizo 1 punto por la desviación no funcional en FND-B (añadir `flex flex-col` no estaba en el texto original, aunque estaba justificada y documentada)

### Checklist

- [x] Criterios de aceptación cumplidos — los 6 verificados uno a uno contra el diff real
- [x] Sin fetch() directo
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos — `design-tokens-mobile.js` migrado a `.ts` en el mismo commit (regla de oro 3)
- [x] Sin any sin justificación — el rest param de `combineMobileClasses` quedó tipado explícito
- [x] Hooks gigantes no tocados sin permiso
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (gap-* en flex-col, next/image, token de design-tokens-mobile)
- [x] Nomenclatura correcta

### Revisión Visual

- [x] Sin inline styles — los 6 sitios `style={{ paddingBottom: ... }}` reemplazados por `MOBILE_SAFE_AREAS.BOTTOM_INSET` vía `cn()`
- [x] `gap-*` en vez de `space-y-*` en los 3 sitios de FND-B, sin cambio visual (se añadió `flex flex-col` donde el contenedor no era flex, correctamente justificado en la sección de decisiones)
- [x] `next/image` con `width={240} height={85}` en `OrderHeaderDesktop.tsx`, proporción real del asset preservada
- [x] Sin colores hardcodeados

**Veredicto visual:** ✅ APROBADO

### Revisión UX — Light

GAP: 068 — Batch de 3 findings de baja severidad (estilo inline, space-y en flex, img→next/image)
Mode: Light (refactor interno sin cambio de comportamiento)

- [x] El cambio es autoexplicativo — no hay decisión nueva de usuario
- [x] No introduce affordance nueva
- [x] Consistente con la UI circundante — mismo resultado visual
- [x] N/A hover/focus/active (no es interactivo nuevo)
- [x] N/A texto (no cambia copy)

VERDICT: ✅ APROBADO

### Observaciones para Jose

Implementación sólida. `npm run type-check` pasa limpio. Único punto a vigilar: la migración
de `design-tokens-mobile.js` → `.ts` tipó `combineMobileClasses` como
`Array<string | false | null | undefined>`, más estricto que el uso implícito anterior — si
algún caller le pasa un valor no cubierto por esa unión (p.ej. `undefined` de un ternario
anidado raro) TypeScript lo marcaría, pero `type-check` ya está limpio así que no hay
callers afectados ahora mismo. No bloquea el cierre.

### Estado final de la implementación

Los 6 sitios de `style={{ paddingBottom: ... }}` usan `MOBILE_SAFE_AREAS.BOTTOM_INSET` vía
`cn()`. Los 3 sitios de `space-y-*` en contenedores flex usan `gap-*` (2 de ellos requirieron
añadir `flex flex-col` porque no eran flex de partida, documentado y correcto).
`OrderHeaderDesktop.tsx` usa `next/image` con dimensiones fijas que preservan la proporción
real del asset. `design-tokens-mobile.ts` migrado desde `.js` con tipado explícito.

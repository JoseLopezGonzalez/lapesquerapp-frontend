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

- [ ] `MOBILE_SAFE_AREAS.BOTTOM_INSET` existe en `design-tokens-mobile.ts` con la clase `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`
- [ ] Los 6 archivos de FND-A usan ese token en vez del `style={{ paddingBottom: ... }}` inline
- [ ] Los 3 sitios de FND-B usan `gap-*` en vez de `space-y-*`
- [ ] `OrderHeaderDesktop.jsx` usa `next/image` con `width={240} height={85}` en vez de `<img>`
- [ ] El resultado visual (espaciado y tamaño de imagen) es idéntico al actual en desktop y mobile
- [ ] `npm run type-check` pasa sin errores

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

# GAP-067 — Sustituir useIsMobile por useIsMobileSafe en todo el editor de pedidos (15 archivos)

## Metadata

- **Tipo:** Bug
- **Módulo:** Ventas / Pedidos
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-07-01
- **Autor:** Jose

---

## Contexto y problema

Detectado en `/audit-desktop order editor` (2026-07-01). El propio docstring de
`src/hooks/use-mobile.jsx` advierte:

> "⚠️ IMPORTANTE: Este hook puede causar hydration mismatch si se usa para render
> condicional. Para render condicional (cambios estructurales), usa `useIsMobileSafe()` en
> su lugar. ... Solo usa este hook para lógica condicional, no para render condicional."

A pesar de esta advertencia explícita en el propio código, **15 archivos del editor de
pedidos** usan `useIsMobile()` (la variante sin guard de `mounted`) precisamente para
render condicional estructural — ternarios `isMobile ? <ComponenteA/> : <ComponenteB/>` que
cambian el árbol de componentes completo, no solo una clase CSS puntual. Esto significa que
en el primer render (servidor + primer paint cliente) `isMobile` vale `false` sin importar el
viewport real, y solo tras el `useEffect` interno del hook se corrige — causando un flash
visible del layout de escritorio antes de mostrar el layout móvil correcto, cada vez que se
abre cualquier pestaña del editor en un viewport móvil.

**Precedente:** `GAP-042-useismobile-safe-admin-crm` (closed) ya hizo exactamente este mismo
barrido para el módulo CRM. Este GAP aplica el mismo patrón al módulo de pedidos.

### Archivos afectados (15) y el render condicional estructural que disparan

| Archivo | Uso estructural detectado |
|---|---|
| `src/app/admin/orders/[id]/OrderClient.js:10` | `onClose={isMobile ? handleClose : undefined}` pasado a `Order` |
| `Order/OrderEditSheet/index.js:55` | `Sheet side={isMobile ? 'bottom' : 'right'}`, layout de formulario, variante de botón trigger |
| `Order/OrderLabels/index.js:53` | Línea 230/235 — ternario de layout completo |
| `Order/OrderExport/index.js:25` | Líneas 47/120/144 — grid vs stack, bloques condicionales |
| `Order/OrderMap/index.tsx:14` | Línea 36 — contenedor flex-col vs h-full |
| `Order/OrderProduction/index.js:31` | Líneas 54/55/185/194/196 — layout + Dialog/Drawer condicional |
| `Order/OrderPlannedProductDetails/index.js:60` | Líneas 402/407/612/621/623 — layout + Dialog/Drawer condicional |
| `Order/OrderAttachments/index.tsx:521` | Líneas 654/657 — layout + rama condicional completa |
| `Order/OrderDetails/index.tsx:86` | Línea 97 — `if (isMobile) { return ... }` (early return con árbol distinto) |
| `Order/OrderIncident/index.js:33` | Líneas 219/221 — layout + rama condicional completa |
| `Order/OrderPallets/index.js:16` | Líneas 94-259 — prop `isMobile` propagada a 8 subcomponentes |
| `Order/OrderCostAnalysis/index.jsx:194` | Líneas 276-495 — múltiples ramas condicionales de gráfico/tabla |
| `Order/OrderAuxiliaryLines/index.tsx:103` | Líneas 324/329/502/508/509 — layout + Dialog/Drawer condicional |
| `Order/OrderProductDetails/index.js:35` | Líneas 62/63/162/171/173 — layout + Dialog/Drawer condicional |
| `Order/OrderDocuments/index.tsx:98` | Líneas 503-637 — layout + rama condicional completa |

## Solución acordada

Para cada uno de los 15 archivos:

1. Reemplazar `import { useIsMobile } from '@/hooks/use-mobile'` por
   `import { useIsMobileSafe } from '@/hooks/use-mobile'`.
2. Reemplazar `const isMobile = useIsMobile();` por
   `const { isMobile, mounted } = useIsMobileSafe();`.
3. Añadir un guard `if (!mounted) return null;` (o el fallback más apropiado al contexto del
   componente — p. ej. si el componente ya tiene un estado de loading previo, puede
   combinarse con ese early return) **antes** del primer uso estructural de `isMobile`,
   siguiendo el patrón ya usado en `Order/index.tsx:181` (`if (!mounted) return null;`).
4. Verificar que ningún otro identificador llamado `isMobile` en el mismo archivo quede
   huérfano o mal tipado tras el cambio (PL-017 — grep de `isMobile` en el archivo completo).

**Excepción:** en `OrderPallets/index.js`, `isMobile` se propaga como prop a 8
subcomponentes — verificar si alguno de esos subcomponentes también importa `useIsMobile`
directamente (evitar doble fuente de verdad); si no, la propagación de la prop ya corregida
es suficiente y no hace falta tocar los subcomponentes.

## Referencias e inspiración

- `src/hooks/use-mobile.jsx` — docstring de ambos hooks, advertencia explícita
- `GAP-042-useismobile-safe-admin-crm` (closed) — mismo barrido en módulo CRM, mismo patrón de fix
- `GAP-016-field-app-useismobile-render-condicional` (closed) — mismo anti-patrón en Field app
- `Order/index.tsx:36,181` — patrón correcto ya usado en el shell del propio editor (`useIsMobileSafe` + `if (!mounted) return null`)
- design-context.md § Mobile Patterns: "Never skip `if (!mounted) return null` when conditionally rendering based on isMobile"
- PL-017 (project-learnings.md): grep exhaustivo tras eliminar/renombrar una variable

## Criterios de aceptación

- [ ] Ninguno de los 15 archivos listados importa `useIsMobile` de `@/hooks/use-mobile`
- [ ] Los 15 archivos usan `useIsMobileSafe()` y destructuran `{ isMobile, mounted }`
- [ ] Cada archivo tiene un guard `mounted` antes de cualquier render condicional estructural basado en `isMobile`
- [ ] Ningún archivo del listado tiene referencias huérfanas a la declaración anterior tras el cambio
- [ ] El comportamiento visual en desktop no cambia
- [ ] El comportamiento visual en mobile no cambia tras el primer paint (solo se elimina el flash de layout incorrecto)
- [ ] `npm run type-check` pasa sin errores

## Archivos a crear o modificar

**Modificar (15):**
- `src/app/admin/orders/[id]/OrderClient.js`
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.js`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.js`
- `src/components/Admin/OrdersManager/Order/OrderExport/index.js`
- `src/components/Admin/OrdersManager/Order/OrderMap/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.js`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.js`
- `src/components/Admin/OrdersManager/Order/OrderPallets/index.js`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.js`
- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx`

## Restricciones

- No renombrar ningún `.js`/`.jsx` a `.tsx` en este GAP (scope de GAP-061)
- No refactorizar ni tocar la lógica de negocio de ninguno de los 15 componentes — solo el hook de detección móvil y su guard
- Dado el tamaño (15 archivos), tratar como PR propio, sin mezclar con otros GAPs del módulo Ventas/Pedidos abiertos en paralelo (GAP-057, GAP-061, GAP-062, GAP-064, GAP-065, GAP-066)
- Verificar `npm run type-check` completo antes del push (protocolo PL-BUILD-05 — archivo grande / cambio de patrón repetido en muchos ficheros)
- Grep de `isMobile` y `useIsMobile` en cada archivo tras el cambio para confirmar que no queda ninguna referencia a la versión antigua (PL-017)

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/app/admin/orders/[id]/OrderClient.js`
- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderLabels/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderExport/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderMap/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProduction/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAttachments/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderIncident/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPallets/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderCostAnalysis/index.jsx`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderProductDetails/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderDocuments/index.tsx`

En los 15 archivos: `import { useIsMobile }` → `import { useIsMobileSafe }`, `const isMobile = useIsMobile();` → `const { isMobile, mounted } = useIsMobileSafe();`, y guard `if (!mounted) return null;` insertado tras el último hook de React del componente y antes del primer render/JSX que depende de `isMobile` estructuralmente.

### Decisiones tomadas durante la implementación

- Varios de los 15 archivos ya habían sido migrados de `.js`/`.jsx` a `.tsx` por otros GAPs en paralelo (GAP-061 y similares) entre la fecha de creación de este GAP (2026-07-01) y su implementación. Se localizó cada archivo por su ruta de directorio real en vez de asumir la extensión listada en el GAP. Solo `OrderCostAnalysis/index.jsx` seguía en `.jsx`, consistente con la restricción de no renombrar en este GAP.
- En `OrderClient.js`, el uso de `isMobile` no es un ternario de árbol de componentes sino un prop (`onClose={isMobile ? handleClose : undefined}`) pasado a `Order`. Se aplicó el mismo patrón (`mounted` guard con `return null`) por consistencia y porque `Order` ya hace su propio `if (!mounted) return null` internamente, así que el guard aquí no introduce parpadeo ni coste visual adicional.
- En `OrderCostAnalysis/index.jsx`, el componente ya tenía un early return de loading (`if (costAnalysisLoading && !costAnalysis)`) que también depende de `isMobile` para su grid. Se optó por un guard `mounted` explícito y separado antes de ese bloque, en vez de fusionar la lógica, porque el propio skeleton de loading usa `isMobile` en su layout y fusionar no habría eliminado el flash en viewports móviles.
- `OrderPallets/index.tsx` propaga `isMobile` como prop a 8 subcomponentes; se verificó (grep) que ninguno de ellos importa `useIsMobile` directamente, por lo que no fue necesario tocarlos (excepción ya prevista en el GAP).

### Desviaciones del plan (si las hay)

- Ninguna funcional. Única diferencia: 13 de los 15 archivos ya eran `.tsx` en el momento de implementar (ver arriba), por lo que las rutas modificadas difieren en extensión de las listadas originalmente en el GAP, pero corresponden al mismo componente.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 10/10

### Checklist

Criterios de aceptación del GAP:
- [x] Ninguno de los 15 archivos importa `useIsMobile` de `@/hooks/use-mobile` — verificado por grep, 0 coincidencias
- [x] Los 15 archivos usan `useIsMobileSafe()` y destructuran `{ isMobile, mounted }` — verificado, 2 referencias por archivo (import + destructuring)
- [x] Cada archivo tiene un guard `mounted` antes de cualquier render condicional estructural basado en `isMobile` — verificado archivo por archivo, guard colocado tras el último hook de React y antes del primer JSX devuelto que depende de `isMobile`
- [x] Ningún archivo tiene referencias huérfanas a la declaración anterior — grep de `useIsMobile[^S]` sin resultados
- [x] Comportamiento visual en desktop no cambia — la rama `isMobile` siempre evalúa `false` en desktop, con o sin `mounted`; sin cambios de lógica de negocio
- [x] Comportamiento visual en mobile no cambia tras el primer paint — solo se retrasa el primer render estructural hasta que `mounted` es `true`, eliminando el flash de layout desktop
- [x] `npm run type-check` pasa sin errores — confirmado, exit 0, salida limpia

Checklist técnico del proyecto:
- [x] Sin fetch() directo (no aplica — ningún archivo toca la capa HTTP)
- [x] Sin hardcode de tenant (no aplica)
- [x] Sin archivos .js nuevos creados
- [x] Sin any sin justificación
- [x] Hooks gigantes (`useOrder`, `usePallet`, `useLabelEditor`) no tocados
- [x] `entitiesConfig.js` no tocado
- [x] Patrones de `.claude/rules/` respetados
- [x] Nomenclatura correcta
- [x] `npm run lint` sobre los 15 archivos — 0 errores, 12 warnings preexistentes no relacionados con este cambio (set-state-in-effect, no-img-element, impure-function, static-components en código que el GAP no tocaba salvo el hook)

Revisión UX — Light (bug fix que restaura comportamiento existente, sin flujo nuevo, sin formulario, sin cambio de navegación ni permisos):
- [x] El cambio es invisible para el usuario en el caso correcto (elimina un bug, no añade una decisión nueva)
- [x] No introduce affordance nueva
- [x] Consistente con el patrón ya usado en `Order/index.tsx` (mismo componente padre del editor)
- [x] No aplica hover/focus/active — no es un elemento interactivo nuevo
- [x] No aplica cambio de copy

VERDICT UX: ✅ APROBADO

### Observaciones para Jose

Implementación mecánica y correcta. Un par de notas:

1. **13 de los 15 archivos ya estaban en `.tsx`** en el momento de implementar (migrados por GAP-061 u otros GAPs en paralelo entre el 2026-07-01 y hoy). Solo `OrderCostAnalysis/index.jsx` seguía en `.jsx`, consistente con la restricción del GAP de no renombrar. Las rutas reales difieren en extensión de las listadas originalmente en el GAP pero corresponden a los mismos 15 componentes — sin desviación de scope.
2. En `OrderClient.js` y en varios de los otros 14 archivos, el guard `if (!mounted) return null;` se colocó tras variables JSX intermedias (`content`, `actions`, `gridContent`, `mainContent`) que ya usaban `isMobile` en su cálculo antes de mi cambio. Esto es seguro porque esas variables no se renderizan hasta el `return` final — solo se computan de más en el primer render, sin coste visual ni de hydration.
3. `OrderPallets/index.tsx` propaga `isMobile` a 8 subcomponentes vía prop; confirmado por grep que ninguno de ellos importa `useIsMobile` directamente, así que no hubo doble fuente de verdad que corregir (excepción ya prevista explícitamente en el GAP).

Nada bloquea el cierre. No se detectaron patrones nuevos que requieran una entrada en `project-learnings.md` — el patrón aplicado ya está documentado (precedente GAP-042) y cubierto por el propio docstring de `use-mobile.jsx`.

### Estado final de la implementación

Los 15 archivos del editor de pedidos migraron de `useIsMobile()` a `useIsMobileSafe()` con guard `mounted`. El flash de layout desktop→mobile en el primer paint queda eliminado en toda la superficie del editor de pedidos (Sheet, Labels, Export, Map, Production, PlannedProductDetails, Attachments, Details, Incident, Pallets, CostAnalysis, AuxiliaryLines, ProductDetails, Documents) más el wrapper `OrderClient.js`. `npm run type-check` y `npm run lint` limpios sobre los archivos tocados.

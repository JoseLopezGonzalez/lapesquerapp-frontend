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

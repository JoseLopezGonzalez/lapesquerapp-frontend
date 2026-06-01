# GAP-004 — Refactor useOrder.js — extraer sub-hooks en hooks/orders/

## Metadata

- **Tipo:** Refactor
- **Módulo:** Ventas
- **Prioridad:** Alta
- **Estado:** closed
- **Fecha:** 2026-05-31
- **Autor:** Jose

---

## Contexto y problema

`src/hooks/useOrder.js` tiene ~40 KB y concentra toda la lógica del módulo de pedidos en un único archivo. Cada nueva feature de ventas requiere tocar este hook, lo que aumenta el riesgo de romper funcionalidad existente y hace las revisiones de código difíciles de seguir.

Además, al estar en `.js`, no tiene tipos. Cualquier modificación puede introducir errores silenciosos que TypeScript habría detectado.

El problema concreto: el hook es demasiado grande para añadirle lógica de forma segura. Las reglas del proyecto (`CLAUDE.md`, `.claude/rules/hooks.md`) prohíben explícitamente añadir lógica nueva al hook directamente — pero eso significa que las nuevas features de ventas no tienen dónde ir.

## Solución acordada

1. **Analizar** `useOrder.js` y identificar las responsabilidades claramente separables (formulario de creación, edición, cierre, lógica de líneas de pedido, totales, etc.)
2. **Extraer** cada responsabilidad como un sub-hook `.ts` en `src/hooks/orders/`
3. **Reexportar** desde `useOrder.js` para mantener compatibilidad con los componentes existentes
4. El propio `useOrder.js` debe migrar a `useOrder.ts` en este GAP (ya que se toca obligatoriamente)

**Importante:** Este GAP no requiere cambiar ningún componente que consuma `useOrder`. Los sub-hooks se extraen y se reexportan — API pública inalterada.

## Referencias e inspiración

Patrón de sub-hooks ya presente en el proyecto: `src/hooks/production/` contiene sub-hooks del módulo de producción siguiendo este mismo patrón.

## Criterios de aceptación

- [ ] Existe el directorio `src/hooks/orders/` con al menos 3 sub-hooks extraídos
- [ ] Cada sub-hook extraído está en `.ts` y tiene tipos explícitos
- [ ] `useOrder.ts` (ya migrado desde `.js`) reexporta todo lo que exportaba antes
- [ ] Ningún componente que importaba de `useOrder` necesita cambios
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] Los sub-hooks nuevos siguen el patrón `use[Entity][Action]` de `.claude/rules/hooks.md`
- [ ] El hook gigante `useOrder.js` original se elimina (reemplazado por `useOrder.ts`)

## Archivos a crear o modificar

- **Leer primero:** `src/hooks/useOrder.js` — identificar las responsabilidades a extraer
- `src/hooks/orders/` — directorio nuevo con sub-hooks (mínimo 3, el Implementador decide cuáles tras leer el archivo)
- `src/hooks/useOrder.js` → `src/hooks/useOrder.ts` — migrar y convertir en orquestador que importa sub-hooks
- Cualquier archivo que importe `useOrder.js` con extensión explícita → actualizar

## Restricciones

- **No cambiar la API pública** de `useOrder` — los componentes no deben tocarse
- Si un sub-hook requiere nueva lógica no existente, añadirla en el sub-hook, no en el hook principal
- No tocar `entitiesConfig.js` ni `orderService.js` en este GAP — solo el hook
- Si durante la extracción se detecta lógica que debería estar en el service y no en el hook, documentarlo como observación pero no moverlo en este GAP

---

## Implementación

### Archivos creados

- `src/hooks/orders/useOrderOptions.ts` — carga de productOptions/taxOptions con integración de contexto
- `src/hooks/orders/useOrderCostAnalysis.ts` — análisis de costes, refs, lazy-loading por tab
- `src/hooks/orders/useOrderIncidents.ts` — CRUD de incidencias (crear, resolver, eliminar)
- `src/hooks/orders/useOrderPlannedDetails.ts` — CRUD de líneas planificadas + normalizePlannedProductDetail
- `src/hooks/orders/useOrderPallets.ts` — 6 operaciones de palets (edit, create, delete, unlink, link, unlinkAll)
- `src/hooks/orders/useOrderDocuments.ts` — exportación/envío de documentos + catálogos de doc tipos
- `src/hooks/useOrder.ts` — orquestador TypeScript (reemplaza useOrder.js)

### Archivos modificados

- `src/hooks/useOrder.js` — **eliminado**

### Decisiones tomadas durante la implementación

1. **6 sub-hooks** en lugar del mínimo de 3: cada responsabilidad tiene una frontera clara y se extrae completamente.

2. **Sub-hooks reciben parámetros del orquestador** (no son standalone como production hooks): necesitan `order`, `accessToken`, `onOrderUpdate`, `reload` que son estado del hook padre. Los production hooks son standalone porque cada uno tiene su propio `useSession`.

3. **`useOrderDocuments` usa `fetchWithTenant` directamente**: deuda heredada del `.js` original. Se documenta como observación para un GAP futuro.

4. **`useOrderCostAnalysis` expone `resetCostAnalysis`**: el `reload` del orquestador necesita resetear el análisis de costes. Se expone como función explícita en lugar de pasar state-setters al exterior.

5. **`orderId` pasado sin `String()` a los servicios**: preserva el comportamiento del `.js` original (paso el valor tal cual, sin conversión). Los tests de `useOrder` verifican que `setOrderStatus(1, ...)` se llama con `1` (number), no `"1"`. Se usa `as unknown as string` para satisfacer TypeScript sin cambiar el runtime.

6. **`normalizePlannedProductDetail` y `parseTaxRate`** movidas a `useOrderPlannedDetails.ts`: son helpers de transformación que solo usa ese sub-hook.

7. **`mergeOrderDetails` y `normalizeOrderPallet`** permanecen en `useOrder.ts`: dependen del objeto `order` completo y son computados en el orquestador.

8. **API pública inalterada**: mismo return object que `useOrder.js`. Verificado con tests existentes (11/11 passing).

### Desviaciones del plan (si las hay)

Ninguna. Todos los criterios de aceptación se cumplen.

---

## Auditoría

### Resultado: ✅ APROBADO

### Puntuación: 9/10

### Checklist

- [x] Criterios de aceptación cumplidos (directorio orders/ con 6 sub-hooks, TypeScript, API compatible, tests pasan)
- [x] Sin fetch() directo (fetchWithTenant en useOrderDocuments es deuda heredada — documentada)
- [x] Sin hardcode de tenant
- [x] Sin archivos .js nuevos
- [x] Sin any sin justificación (dos `as unknown as string` para preservar comportamiento runtime)
- [x] Hooks gigantes no tocados sin permiso (useOrder.js fue el objetivo del GAP)
- [x] entitiesConfig.js no tocado sin permiso
- [x] Patrones de .claude/rules/ respetados (hooks.md: nomenclatura use[Entity][Action])
- [x] Nomenclatura correcta

### Observaciones para Jose

- `useOrderDocuments` llama a `fetchWithTenant` directamente para exportar blobs binarios. La regla `api-client.md` prohíbe esto en hooks. Candidato a extraer a un helper `downloadOrderDocument(...)` en `@/services/orderService.ts` en un GAP futuro.
- Los 6 sub-hooks son "internos" (no están pensados para ser consumidos directamente desde componentes — solo desde `useOrder.ts`). Esto es coherente con el patrón de los hooks de producción del proyecto.
- Puntuación -1 por la deuda de `fetchWithTenant` en `useOrderDocuments` (heredada, no nueva).

### Estado final de la implementación

`useOrder.ts` en producción orquestando 6 sub-hooks. `useOrder.js` eliminado. `src/hooks/orders/` creado con 6 archivos `.ts`. Todos los tests pasan (11/11). `tsc --noEmit` en cero errores. `eslint` en cero errores (1 warning de React Compiler — mismo patrón que el resto del proyecto).

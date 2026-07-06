# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-06

## Módulo activo

**dashboard-home — 2 pasadas completas (2026-07-05/06):** pasada 1 (solo
`ui-audit-agent` sobre Admin/Dirección) + pasada 2 (11 carriles en paralelo —
code-audit-agent, ui-audit-agent, domain-business-auditor — completando
Admin/Dirección y cubriendo Comercial, Operario/Almacén y Field). 83 GAP
candidates de la pasada 2 → `gap-normalizer` fusionó 8 duplicados → 75 GAPs.
**Total módulo: 60 `ready`, 20 `blocked`, 4 `later`, 8 `rejected`.** Pendiente
de cubrir: carril `permissions-multitenant-auditor` (ningún carril de
multi-tenant/permisos se ha lanzado todavía sobre este módulo). Ver
`docs/ai/modules/dashboard-home/audit.md` § 7 para las 14 preguntas de negocio
agrupadas que desbloquean los 20 `blocked` — ninguna bloquea los 60 `ready`.
Compite en prioridad con `pallets` (backlog algo mayor, ver abajo) — Jose
decide cuál implementar primero.

pallets (Palets) — 2 pasadas de `/deep-audit-module` completas (pasada 1:
pantalla de creación/edición, desktop + mobile; pasada 2: listado, movimientos
de almacén, vinculación masiva desde pedido) + los 6 `blocked` de la pasada 2
resueltos por Jose (2026-07-06, 5 desbloqueados, 1 sigue `blocked` en espera de
verificación de backend). Módulo listo para `/implement-next` a gran escala:
**42 `ready`, 1 `blocked`, 5 `rejected`**. `orders` queda en segundo plano con 1
solo GAP `ready` pendiente (`GAP-V2-028`, ver histórico más abajo).

## Fase activa

**Pasada 2 de `pallets` completa y mergeada (2026-07-05):** mismos 3 carriles
(code-audit-agent, ui-audit-agent, domain-business-auditor) sobre las 3
superficies que quedaron fuera de alcance en la pasada 1: listado de palets
(solo config específica, no el motor genérico `EntityClient`), movimientos de
almacén (assign/move position, código en `Stores`), y vinculación masiva desde
pedido (`OrderPallets/hooks/useOrderPallets.ts`, evitando duplicar
GAP-V2-025/026 de `orders`). 25 GAP candidates escritos, normalizados por
`gap-normalizer` a 23 GAPs (2 pares fusionados, 0 divisiones) → **17 `ready`, 6
`blocked`, 0 `done`, 0 `later`, 2 `rejected`**. Registry regenerado: **total
módulo pallets (2 pasadas): 37 `ready`, 6 `blocked`, 0 `done`, 0 `later`, 5
`rejected`**.

**Hallazgo más importante de la pasada 2 — corrección de un GAP ya `ready` de
la pasada 1:** GAP-V2-083 demostró que la premisa de GAP-V2-059 ("servicio
legacy muerto, eliminar el archivo") era incorrecta —
`src/services/domain/pallets/palletService.js` alimenta activamente
`list`/`delete`/`deleteMultiple` del listado `/admin/pallets` vía
`entityServiceMapper.ts` → `EntityClient`. Ejecutarlo tal como estaba escrito
habría roto el listado en producción. `gap-normalizer` reescribió GAP-V2-059
in-place con el alcance correcto (eliminar solo los 4 métodos confirmados
muertos) antes de que llegara a `/implement-next` — ver
`docs/ai/modules/pallets/audit.md` § 7 y § 10 para el detalle completo. Lección
para futuras pasadas: cualquier hallazgo de "servicio/archivo muerto" debe
verificar imports relativos además de imports con alias `@/`, ya que un grep
por el path con alias puede no detectar un import relativo real.

**Segundo hallazgo relevante:** el mismo bug P0 de GS1-128 de la pasada 1
(GAP-V2-078, AI de precisión incorrecto, peso decodificado ×100 por lectores
externos) reaparece en un tercer punto de creación de cajas
(`useOrderPallets.ts`, creación de palet desde previsión de pedido) — nuevo
GAP-V2-109, P0, dependiente de GAP-V2-078. Candidato a regla permanente en
`project-learnings.md`: el bug se ha visto en 6+ archivos de 3 módulos
distintos (pallets, production, label editor) — la construcción de GS1-128
debería centralizarse.

**Actualización 2026-07-06 — Jose resolvió 5 de los 6 `blocked` de la pasada 2**
(ver `docs/ai/modules/pallets/audit.md` § 10 para el detalle completo):
- GAP-V2-087 y GAP-V2-089 (ambos L) — autorizados, PR aislado cada uno
  (GAP-V2-085→087, GAP-V2-088→089). Pasan a `ready`.
- GAP-V2-106 — confirmado: una posición **puede alojar varios palets** a la
  vez. Re-scopeado de "bloquear" a "mostrar info de ocupación", P1→P2, M→S.
  Pasa a `ready`.
- GAP-V2-107 — confirmado: el backend **sí limpia** `position` al traspasar.
  Re-scopeado de "domain-business + posible fix" a "ux-ui, solo copy
  informativo", P1→P3, S→XS. Pasa a `ready`.
- GAP-V2-103 — Jose no conoce el campo backend exacto, pide verificarlo al
  implementar. Pasa a `ready` con criterio explícito: confirmar contra
  `GET /api/v2/pallets` antes de escribir el header.
- **GAP-V2-105 sigue `blocked`** — a diferencia de 103, aquí no está
  garantizado que el backend soporte filtrar por disponibilidad de stock.
  Quien lo retome debe verificar contra la API real primero; si no hay
  soporte, es una petición de backend, no un GAP de este módulo frontend.

Registry regenerado: **42 ready, 1 blocked (GAP-V2-105), 0 done, 0 later, 5
rejected** — total del módulo, ambas pasadas.

### Pasada 1 de `pallets` (histórico, mismo día)

Pasada 1 de `pallets` completa (2026-07-05): 3 carriles ejecutados en paralelo
(code-audit-agent, ui-audit-agent, domain-business-auditor) sobre creación/edición
de palet. 22 GAP candidates escritos, normalizados por `gap-normalizer` a 21 GAPs
(2 pares fusionados, 1 dividido). Jose resolvió los 7 `blocked` en la misma sesión
(ver `docs/ai/modules/pallets/audit.md` § 10 para el detalle de cada decisión) →
registry final tras pasada 1: **20 `ready`, 0 `blocked`, 0 `done`, 0 `later`, 3
`rejected`**.

Dos P0 reales, primeros a implementar:
- **GAP-V2-078** — el código de barras GS1-128 impreso en la etiqueta física de caja
  usa el Application Identifier de precisión incorrecto (3100/3200 en vez de
  3102/3202) — cualquier lector externo (cliente, transportista, carretilla)
  decodifica el peso ×100. Bug de dominio con impacto físico real, no solo interno.
- **GAP-V2-068** — "Eliminar todas las cajas" en desktop (`PalletView`) ejecuta sin
  ningún diálogo de confirmación, a diferencia de mobile que sí lo pide.

Decisiones clave que desbloquearon los 7 `blocked`:
- GAP-V2-058 (L) y GAP-V2-062 (XL, + GAP-V2-065 en cascada) — autorizados, PRs
  aislados, 058 antes que 062.
- GAP-V2-061 — rol para borrar imágenes de palet = mismo que
  `canManagePalletCostFields` (administrador/dirección/técnico).
- GAP-V2-079 — Opción A: eliminar el campo "peso bruto" por caja del historial
  (queda solo a nivel de palet).
- GAP-V2-081 — **rechazado**: no hay validación backend y la lógica de negocio
  permite intencionalmente vincular un palet a un pedido sin producto
  coincidente (sustitución/reasignación legítima).
- GAP-V2-082 — mantenido, re-scopeado sin depender ya de GAP-V2-079; tara
  variable caja a caja, sin catálogo ni memoria de sesión.

Patrón transversal detectado por 2 carriles independientes: `PalletView/index.tsx`
(2829 líneas, creció desde ~1100 tras GAP-039 legacy) es monolítico y diverge del
patrón correctamente modularizado de `MobilePalletView/*` — mismo síntoma visto
desde código (GAP-V2-062) y desde UX (GAP-V2-068/069/070, falta de guardrails de
confirmación/loading que sí tiene mobile).

## Fase activa (histórico, sesión 2026-07-04 — módulo orders)

Reconciliación 2026-07-04: Jose hizo una sesión de pareo mobile fuera del flujo
GAP (2026-07-03 18:50 → 2026-07-04 00:52, 10 commits directos sobre `main`/rama
del módulo: `deda30b`..`60125f1`) que reescribió en profundidad la UI mobile de
`Order` — `OrderSectionList.tsx` eliminado y sustituido por
`OrderSectionGrid.tsx`, `OrderHeaderMobile`/`OrderSummaryMobile` reescritos con
`MobileOptionSheet` (nuevo componente en `src/components/Shadcn/`),
`OrderContent`/`Order/index.tsx` con scroll/animaciones y `isMobileOverride`,
`OrderEditSheet` con acordeón mobile, `OrderAuxiliaryLines` dividido en
`index.tsx` + `OrderAuxiliaryLineSheet.tsx` + `types.ts`, `OrdersManager`/
`ComercialOrdersManager` con restauración de pedido seleccionado desde la URL,
`AttachmentCard` con `DropdownMenu` mobile, y `OrderDetails`/`OrderMap` con
`ProspectLocationMap`/`RouteMap` sustituyendo el iframe de Google Maps.

Se revisaron los 41 GAPs de `orders` contra ese diff para detectar cuáles
quedaban obsoletos, en conflicto, o necesitaban reabrirse:

- **GAP-V2-057** (única `ready` de code-quality, guard de cierre en
  `OrderEditSheet`) — estaba **desactualizada**: el mismo refactor mobile de
  ayer (commit `375a1d5`) ya conecta `onOpenChange` del `Sheet` a
  `handleSheetOpenChange`, que reproduce exactamente la lógica pedida por el
  GAP. Verificado línea a línea contra el código actual + `npm run
type-check` limpio → **pasada a `done`** en esta sesión (sin pasar por
  `gap-auditor`, verificación directa documentada en el propio GAP).
- **GAP-V2-036** (rejected) — uno de sus `target_files`
  (`OrderSectionList.tsx`) ya no existe, sustituido por `OrderSectionGrid.tsx`.
  No cambia la decisión de rechazo; se añadió una nota de reconciliación en el
  GAP para que una futura reapertura no busque un archivo inexistente.
- **GAP-V2-020, GAP-V2-030, GAP-V2-038, GAP-V2-046, GAP-V2-051, GAP-V2-052,
  GAP-V2-007, GAP-V2-031** (todos `done`, archivos reescritos por la sesión
  mobile) — verificados uno a uno contra el código actual: los 8 siguen
  cumpliendo sus criterios de aceptación sin regresión (`canViewCostData` sigue
  ocultando coste/margen, `useOrderFormConfig` sigue sin `useState`+`useEffect`
  espejo, `isRowValid`/`isDetailValid` siguen bloqueando guardado — movidos a
  `OrderAuxiliaryLines/types.ts` pero intactos —, `font-medium` se mantiene,
  `parseTaxRate` compartido se mantiene, unidad de catálogo en vez de `kg` fijo
  se mantiene, `min-h-[44px]`/`min-w-[44px]` se mantiene en los triggers
  reescritos con `MobileOptionSheet`, `'use client'` se mantiene en los 3
  componentes reescritos).
- **GAP-V2-028** (`ready`, `orderService.ts`) — no tocado por la sesión mobile,
  sigue igual, sin cambios necesarios.
- Resto de GAPs `done`/`rejected` no tocados por el diff mobile (`OrdersList`,
  `OrderCard`, `OrderIncident`, `OrderCustomerHistory`, etc.) — sin necesidad
  de re-verificación.

`npm ci` + `npm run type-check` (limpio) + `npx vitest run` sobre toda la
suite: mismos 22 tests/11 archivos en fallo preexistentes ya documentados en
GAP-V2-038 (ninguno de `orders`, salvo `useOrdersProfitabilityStats.test.ts`
que ya figuraba en esa misma lista) — **sin regresión nueva** introducida por
la sesión mobile de ayer.

**Hallazgo nuevo, no bloqueante, sin GAP abierto todavía:** `npx eslint` sobre
los ~30 archivos tocados por la sesión mobile marca 19 warnings (0 errores),
en su mayoría `react-hooks/set-state-in-effect` en `OrdersManager/index.tsx`,
`ComercialOrdersManager.tsx` y `ProspectLocationMap.jsx` (restauración de
`selectedOrder`/categoría activa desde `useEffect` + `setState` síncrono) — el
mismo patrón de "estado espejo" que GAP-V2-030 ya corrigió en
`useOrderFormConfig`, ahora reintroducido en 3 sitios nuevos por el código de
ayer. No se abre GAP todavía (P3 potencial, sin síntoma funcional reportado) —
queda para la próxima pasada de auditoría si Jose confirma que quiere cubrirlo.

## Fase activa (histórico, sesión 2026-07-03)

Sesión local 2026-07-03 (continuación): tras cerrar el lote 17 (4 P1) y resolver los 3
`blocked`, se ejecutó `/implement-next module=orders category=code-quality limit=3
risk=low` (lote 18). Cerró y verificó `done` (gap-auditor en modo lote, contexto limpio,
sin hallazgos bloqueantes):

- **GAP-V2-029** — las 3 funciones de exportación de rentabilidad de `orderService.ts`
  obtienen el token con `getAuthToken()` interno en vez de recibirlo como parámetro; tipo
  `AuthToken` eliminado; test actualizado (20/20 verde).
- **GAP-V2-030** — `useOrderFormConfig` deriva `defaultValues`/`formGroups` con `useMemo`
  puro, sin el `useState`+`useEffect` de espejo que duplicaba un render por cambio.
- **GAP-V2-026** — `invalidateOrderDetail` en `useOrderPallets.ts` usa `refetchType:
'none'`, eliminando el doble refetch por operación de palet (seguimiento de GAP-V2-025).

Lote adicional en la misma sesión: `GAP-V2-037` (aria-invalid nativo en `OrderEditSheet`,
Combobox/DatePicker dejados fuera por ser componentes `.js` compartidos de 14+ callers),
`GAP-V2-052` (`formatQuantityWithUnit` sustituye el sufijo `kg` fijo por `row.unit` en
líneas auxiliares) y `GAP-V2-047` (unifica `font-bold`/`font-semibold` → `font-medium` en
`OrderCustomerHistory`, incluyendo `ChartTooltip.jsx` fuera de `target_files`). Verificados
`done` (9-10/10) por `gap-auditor` en modo lote.

Lote 20 (misma sesión, continuación): 5 GAPs P3 code-quality/ux-ui — `GAP-V2-031`
(`'use client'` en `OrderProduction`/`OrderLabels`), `GAP-V2-033` (`StatusBadge` extendido
con `showDot`, sustituye badge inline duplicado en `OrderCard` mobile), `GAP-V2-048`
(título "Pedidos Activos" unificado a `text-xl font-medium`, absorbe alcance de
GAP-V2-046 para ese archivo), `GAP-V2-049` (jerarquía cliente/ID en `OrderCard` desktop)
y `GAP-V2-050` (sub-escala `CardTitle` en `OrderIncident`). Verificados `done` por
`gap-auditor` en modo lote (observación no bloqueante en GAP-V2-033: el badge resultante
no es 100% pixel-idéntico al span eliminado, más consistente con el resto del proyecto).

Lote 21 (misma sesión, cierre de P2/P3 pequeños): `GAP-V2-046` (`font-semibold`→
`font-medium` en 5 archivos de producción/palets/líneas auxiliares/previsión),
`GAP-V2-032` (interfaces de dominio de `orders` movidas de `orderService.ts` a
`src/types/orders.ts`, 31 tipos con re-export de compatibilidad — `gap-auditor` señaló
`OrderStatus` fuera del movimiento inicial, corregido en la misma sesión y re-verificado),
`GAP-V2-034` (3 archivos de test nuevos — `useComercialOrders`, `useOrderFormConfig`,
`useOrderCreateFormConfig` — 12 tests cubriendo normalización de dominio específica de
cada hook). Verificados `done` por `gap-auditor` en modo lote.

`npm run type-check`, `eslint` por archivo y `npm run build` limpios en los 4 últimos lotes.
`npx vitest run` comparado con `git stash` contra el árbol limpio: mismos 11 archivos/22
tests en fallo preexistentes antes y después — sin regresión introducida por ninguno de
los lotes; +12 tests nuevos verdes (GAP-V2-034).
**Cambios sin commitear todavía** — contexto LOCAL, Claude no commitea por su cuenta;
pendiente de que Jose revise y commitee (incluye lote 17 + blocked resueltos + lotes
18/19/20/21, todo en la misma sesión sin commit).

P0/P1 abiertos: 0. Blocked: 0. Ready: 1 — GAP-V2-028 (L), único GAP pendiente de todo
el módulo. Todo lo demás ya es `done` (37) o `rejected` (3).

## Acción recomendada

**Opción — `dashboard-home` (60 GAPs `ready` tras 2 pasadas, ver detalle abajo):**

```text
/implement-next module=dashboard-home category=ux-ui
```

Empezar por el P0 (GAP-V2-004, `CompanySetupAlert` solapado con `BottomNav` en
mobile) y el bug confirmado de GAP-V2-050 (diálogo "Cancelar acción" de agenda
comercial envía payload incompleto, rompe la función tal cual está). GAP-V2-003
(size L, 18 archivos) y GAP-V2-135 (`useStoreData` reimplementado a mano en
`warehouse/[storeId]/page.js`) son buenos candidatos de PR aislado por tamaño.
Antes de un lote grande, valorar si conviene que Jose resuelva primero las 14
preguntas de negocio de § 7 del audit.md — desbloquean 20 GAPs adicionales sin
tocar los 60 ya `ready`.

**Prioridad — `pallets`:** empezar por el P0 de dominio, mayor riesgo (impacto físico
en lectores externos, no solo interno):

```text
/implement-next module=pallets category=domain-business limit=1 risk=high
```
→ GAP-V2-078 (GS1-128 AI de precisión incorrecto).

Seguido de cerca por el P0 de UX (acción destructiva sin confirmación):
```text
/implement-next module=pallets category=ux-ui limit=1 risk=low
```
→ GAP-V2-068 ("Eliminar todas las cajas" sin confirmación en desktop).

Tras esos 2, quedan 40 GAPs `ready` más en `pallets` (ver
`docs/ai/modules/pallets/gaps-registry.md`, 42 `ready` en total sumando ambas
pasadas, tras la resolución de blocked del 2026-07-06). Cadenas de GAPs
grandes (L/XL) a respetar, cada una en PR aislado: GAP-V2-058 → GAP-V2-062 →
GAP-V2-065 (primera pasada, `PalletView`); GAP-V2-085 → GAP-V2-087 (segunda
pasada, `useStore`/`useStoreDialogs`); GAP-V2-088 → GAP-V2-089 (segunda pasada,
split de `OrderPallets/hooks/useOrderPallets.ts`). GAP-V2-109 (P0, GS1-128
recurrente) conviene encadenarlo justo después de GAP-V2-078 en la misma
sesión, ya que corrige el mismo bug en un archivo distinto.

**Único pendiente en `pallets`:** GAP-V2-105 (filtro de disponibilidad de stock
en el listado) sigue `blocked` — antes de implementarlo, verificar contra la
API real (`GET /api/v2/pallets`) si el backend soporta filtrar por
disponibilidad; si no, es una petición de cambio de backend, no un GAP
implementable solo en este repo frontend.

**Pendiente secundario — `orders`:** implementar GAP-V2-028 en pasada dedicada
(autorizado, tamaño L — no combinar con otros GAPs en el mismo commit, ciclo
completo de type-check/lint/test/build propio):

```text
/implement-next module=orders category=architecture-refactor limit=1 risk=medium
```

Tras cerrar GAP-V2-028, el módulo `orders` queda en 0 `ready` — punto natural para
commitear toda la sesión y decidir si abrir una nueva pasada de `/deep-audit-module`
(el carril `performance` sigue sin auditar nunca) o pasar a otro módulo.

Adicional (opcional, no bloqueante): confirmar con Jose si quiere abrir un GAP P3
para el patrón `react-hooks/set-state-in-effect` reintroducido ayer en
`OrdersManager/index.tsx`, `ComercialOrdersManager.tsx` y `ProspectLocationMap.jsx`
(ver hallazgo en "Fase activa" de esta misma sesión) antes de la próxima
`/deep-audit-module` sobre `orders`.

También queda pendiente de confirmación de Jose (no bloquea ningún GAP `ready` todavía, pero condiciona un futuro candidato): si las líneas auxiliares de pedido deben admitir cantidad/precio unitario negativo para representar abonos/devoluciones.

## Motivo

Los 16 lotes de `/implement-next` de la pasada 2026-07-02 cerraron `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022` y `GAP-V2-023`. Los lotes 15 y 16 (rama `lv9qnf`, 2026-07-03) cerraron `GAP-V2-024` y `GAP-V2-025`; el segundo generó `GAP-V2-026` como seguimiento no bloqueante de un doble refetch. GAP-V2-001 y GAP-V2-019 quedaron `rejected/superseded` (divididos o fusionados en otros GAPs). La ampliación de auditoría (rama `ewomf1`) cubrió superficies que quedaban `pending` y encontró 20 hallazgos nuevos. El lote 17 (2026-07-03) cerró los 4 P1 `ready` de esa ampliación: `GAP-V2-057`, `GAP-V2-056`, `GAP-V2-051` y `GAP-V2-038`. Jose resolvió los 3 `blocked` restantes en la misma sesión: `GAP-V2-027` (done), `GAP-V2-028` (ready, pendiente de implementar), `GAP-V2-036` (rejected). El lote 18 cerró `GAP-V2-029`, `GAP-V2-030` y `GAP-V2-026`. El lote 19 (misma sesión, continuación) cerró `GAP-V2-037`, `GAP-V2-052` y `GAP-V2-047`. El lote 20 (misma sesión, continuación) cerró `GAP-V2-031`, `GAP-V2-033`, `GAP-V2-048`, `GAP-V2-049` y `GAP-V2-050`. El lote 21 (misma sesión, cierre) cerró `GAP-V2-046`, `GAP-V2-032` y `GAP-V2-034` — deja el módulo en 1 solo GAP `ready` (`GAP-V2-028`).

## Archivos clave

- `docs/ai/modules/dashboard-home/audit.md`
- `docs/ai/modules/dashboard-home/gaps-registry.md`
- `docs/ai/gaps/dashboard-home/GAP-V2-{001..213}.md` (92 archivos con huecos por
  rangos reservados de carril; 60 `ready`, 20 `blocked`, 4 `later`, 8 `rejected`
  — ver registry para el desglose exacto de IDs)
- `docs/ai/modules/pallets/audit.md`
- `docs/ai/modules/pallets/gaps-registry.md`
- `docs/ai/gaps/pallets/GAP-V2-{058..067,068..069,072..082}.md` (21 archivos vivos +
  2 marcados `rejected` como registro de fusión — ver registry para el desglose)
- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-{001..009,011..014,019..034,036..038,046..052,056,057}.md` (41 archivos, ver registry para el desglose ready/done/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- `OrderEditSheet/index.tsx`: GAP-V2-057, GAP-V2-030 (hook consumido) y GAP-V2-037 (aria-invalid) ya `done` (GAP-V2-057 confirmado `done` de nuevo el 2026-07-04 tras el refactor mobile de acordeón) — sin GAPs `ready` pendientes sobre este archivo.
- `OrderAuxiliaryLines/index.tsx`: GAP-V2-051, GAP-V2-038, GAP-V2-046 y GAP-V2-052 (unidad) ya `done` — todos verificados de nuevo el 2026-07-04 tras el split en `index.tsx`/`OrderAuxiliaryLineSheet.tsx`/`types.ts` de la sesión mobile, sin regresión. Ningún GAP `ready` pendiente sobre este archivo.
- GAP-V2-028 (ready, L) es el único GAP grande pendiente — implementar en pasada aislada. GAP-V2-029 (mismo archivo `orderService.ts`, ángulo distinto) ya está `done`, no genera conflicto de commit al implementar GAP-V2-028.
- `src/lib/orders/orderReadOnlyPermissions.ts` tiene ahora 2 comentarios documentando el rechazo de GAP-V2-036 — no reabrir "acción oculta sin feedback" para `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS`/`isOrderPalletsReadOnly` en futuras auditorías sin evidencia de que la decisión de producto cambió.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- No volver a auditar los mismos 5 carriles sobre los mismos archivos sin evidencia de que algo cambió — usar `needs_reaudit` si aplica.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el código de esta sesión (lote 17 + resolución de los 3 blocked + lote 18) antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`) — sigue sin commitear al cierre de esta sesión.
- Antes de empezar trabajo nuevo sobre `orders`, comprobar si hay otra rama `claude/orders-*` sin mergear (`git branch -r | grep orders`) para evitar que se repita esta reconciliación.
- Sesiones de pareo fuera del flujo GAP (como la mobile de 2026-07-03/04) no actualizan `next-action.md`/`gaps-registry.md` por su cuenta — tras cualquiera de estas sesiones, repasar los GAPs `ready`/`done` cuyos `target_files` coincidan con los archivos tocados antes de fiarse del estado del registro.

## Estado resumido

```text
dashboard-home: audit_pass_1_done (2026-07-05) → 1_lane_executed (ui-audit-agent,
solo superficie Admin/Dirección, alcance limitado por Jose) → 8_candidates →
2_decisiones_de_producto_con_jose (OrdersProfitabilityTimelineCard: integrar →
GAP-V2-009 nuevo; NewLabelingFeatureCard: eliminar → GAP-V2-006 reescrito) →
normalizado_en_hilo_principal (≤15 candidatos, sin gap-normalizer) → 9 GAPs,
todos ready → registry pasada 1: 9 ready, 0 blocked, 0 done, 0 later, 0 rejected
  → audit_pass_2_done (2026-07-06, Jose pidió continuar tras confirmar que la
    cobertura no estaba completa) → 11_lanes_executed_en_paralelo
    (code-audit-agent + domain-business-auditor completando Admin/Dirección;
    los 3 carriles del piloto sobre Comercial, Operario/Almacén, Field) →
    2 fallos por límite de sesión de la API a mitad de camino (el primero
    detuvo los 11 antes de escribir nada, relanzados igual; el segundo detuvo
    solo gap-normalizer antes de escribir nada, relanzado igual) → sin pérdida
    de trabajo en ningún caso → 83 candidates → gap-normalizer (8
    fusiones/rejected, 2 divisiones) → 75 GAPs → registry final módulo (2
    pasadas): 60 ready, 20 blocked, 4 later, 8 rejected. 20 blocked: 6 por
    tamaño L/XL sin autorizar, 14 por preguntas de negocio/backend (ver
    audit.md § 7, 14 preguntas agrupadas). Pendiente: carril
    permissions-multitenant-auditor, nunca lanzado sobre este módulo.

pallets: audit_pass_1_done → 3_lanes_executed → 22_candidates → gap-normalizer
(2 fusiones, 1 split) → 21 GAPs → jose_resolved_7_blocked (2026-07-05) → pass_1
registry: 20 ready, 0 blocked, 0 done, 0 later, 3 rejected
  → audit_pass_2_done (listado, movimientos de almacén, vinculación masiva) →
    3_lanes_executed → 25_candidates (incluye corrección de GAP-V2-059) →
    gap-normalizer (2 fusiones, 0 splits, GAP-V2-059 reescrito in-place) → 23
    GAPs → registry final módulo (2 pasadas): 37 ready, 6 blocked, 0 done, 0
    later, 5 rejected
  → jose_resolved_5_of_6_blocked_pass_2 (2026-07-06): GAP-V2-087/089 (L,
    autorizados) · GAP-V2-106 (re-scopeado, varios palets por posición) ·
    GAP-V2-107 (re-scopeado, backend confirmado limpia position) ·
    GAP-V2-103 (ready, verificar campo al implementar) → registry final: 42
    ready, 1 blocked (GAP-V2-105, pendiente de verificar soporte backend),
    0 done, 0 later, 5 rejected → listo para /implement-next a gran escala

orders: audited_ampliado → reconciled_lv9qnf_and_ewomf1 → batch_17_p1_done → blocked_resolved → batch_18_code_quality_done → batch_19_a11y_domain_ux_done → batch_20_code_quality_ux_done → batch_21_final_small_gaps_done → mobile_pairing_session_2026-07-03_04 (fuera de flujo GAP) → reconciled_2026-07-04 (GAP-V2-057 ready→done, GAP-V2-036 nota de archivo renombrado, 8 GAPs done re-verificados sin regresión) (1 ready [GAP-V2-028, L], 0 blocked, 38 done, 0 later, 3 rejected)
```

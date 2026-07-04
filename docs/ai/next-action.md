# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-04

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

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

Única vía pendiente — implementar GAP-V2-028 en pasada dedicada (autorizado, tamaño L —
no combinar con otros GAPs en el mismo commit, ciclo completo de
type-check/lint/test/build propio):

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
audited_ampliado → reconciled_lv9qnf_and_ewomf1 → batch_17_p1_done → blocked_resolved → batch_18_code_quality_done → batch_19_a11y_domain_ux_done → batch_20_code_quality_ux_done → batch_21_final_small_gaps_done → mobile_pairing_session_2026-07-03_04 (fuera de flujo GAP) → reconciled_2026-07-04 (GAP-V2-057 ready→done, GAP-V2-036 nota de archivo renombrado, 8 GAPs done re-verificados sin regresión) (1 ready [GAP-V2-028, L], 0 blocked, 38 done, 0 later, 3 rejected)
```

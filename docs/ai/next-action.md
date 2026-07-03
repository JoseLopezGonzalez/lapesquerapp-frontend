# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-03

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Sesión local 2026-07-03: se implementó y verificó el lote completo de los 4 GAPs P1
`ready` que quedaban tras la reconciliación de las ramas `lv9qnf`/`ewomf1` — GAP-V2-057
(guard de "descartar cambios" en `OrderEditSheet`), GAP-V2-056 (botón "Exportar" de
`OrdersList` sin gate de rol), GAP-V2-051 (`parseTaxRate` divergente en
`OrderAuxiliaryLines`, recurrencia de GAP-V2-012) y GAP-V2-038 (validación mínima de
guardado en los editores de línea de `OrderAuxiliaryLines`/`OrderPlannedProductDetails`).
`gap-auditor` en modo lote con contexto limpio verificó los 4 como `done`, sin hallazgos
bloqueantes.

Acto seguido, Jose resolvió las 3 decisiones que tenían `blocked` a GAP-V2-027/028/036:

- **GAP-V2-027** → eliminar `OrdersListFiltersSheet.tsx` (plan Fase 3 no vigente). Hecho,
  `done`.
- **GAP-V2-028** → autorizado el refactor `L`/riesgo `medium` completo de `orderService.ts`
  (35 funciones), sin dividir en sub-GAPs. Pasa a `ready`, pendiente de implementación
  dedicada (no se implementó en esta sesión — tamaño grande, merece su propio ciclo).
- **GAP-V2-036** → rechazado. El rol comercial no tiene expectativa de ver
  secciones/acciones bloqueadas por permiso, así que no hace falta avisar. Documentado con
  comentarios en `src/lib/orders/orderReadOnlyPermissions.ts` para que no se reabra en
  futuras auditorías.

`npm run type-check`, `eslint` por archivo y `npm run build` limpios; `npm run test:run`
sin regresiones nuevas. **Cambios sin commitear todavía** — contexto LOCAL, Claude no
commitea por su cuenta; pendiente de que Jose revise y commitee.

P0/P1 abiertos: 0. Blocked: 0. Ready: 15 (14 P2/P3 pequeños + GAP-V2-028, tamaño L).

## Acción recomendada

Dos vías independientes, no excluyentes:

**A) Lote P2/P3 pequeño (código/UX/dominio), sin tocar `orderService.ts`:**

```text
/implement-next module=orders category=code-quality limit=3 risk=low
```

que cogería `GAP-V2-029` (recurrencia de token-as-parameter + código muerto en
`orderService.ts`), `GAP-V2-030` (`useOrderFormConfig` con estado duplicado) y
`GAP-V2-026` (`refetchType: 'none'` en `useOrderPallets.ts`, seguimiento de GAP-V2-025).

**B) GAP-V2-028 en pasada dedicada** (autorizado, tamaño L — no combinar con otros GAPs
en el mismo commit, ciclo completo de type-check/lint/test/build propio):

```text
/implement-next module=orders category=architecture-refactor limit=1 risk=medium
```

También queda pendiente de confirmación de Jose (no bloquea ningún GAP `ready` todavía, pero condiciona un futuro candidato): si las líneas auxiliares de pedido deben admitir cantidad/precio unitario negativo para representar abonos/devoluciones.

## Motivo

Los 16 lotes de `/implement-next` de la pasada 2026-07-02 cerraron `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022` y `GAP-V2-023`. Los lotes 15 y 16 (rama `lv9qnf`, 2026-07-03) cerraron `GAP-V2-024` y `GAP-V2-025`; el segundo generó `GAP-V2-026` como seguimiento no bloqueante de un doble refetch. GAP-V2-001 y GAP-V2-019 quedaron `rejected/superseded` (divididos o fusionados en otros GAPs). La ampliación de auditoría (rama `ewomf1`) cubrió superficies que quedaban `pending` y encontró 20 hallazgos nuevos. El lote 17 (esta sesión, 2026-07-03) cerró los 4 P1 `ready` de esa ampliación: `GAP-V2-057`, `GAP-V2-056`, `GAP-V2-051` y `GAP-V2-038`. Inmediatamente después, Jose resolvió los 3 `blocked` restantes en la misma sesión: `GAP-V2-027` (done), `GAP-V2-028` (ready, pendiente de implementar), `GAP-V2-036` (rejected).

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-{001..009,011..014,019..034,036..038,046..052,056,057}.md` (41 archivos, ver registry para el desglose ready/done/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- GAP-V2-026 (doble refetch en `useOrderPallets`) depende de GAP-V2-025 (ya `done`) — verificar en DevTools/Network que la operación sigue refrescando en una sola petición tras el cambio, no en cero.
- `OrderEditSheet/index.tsx` ya fue tocado por GAP-V2-057 (`done`) — GAP-V2-037 (aria-invalid, `ready`) sigue pendiente sobre el mismo archivo; releer antes de implementarlo para no pisar el nuevo `handleSheetOpenChange`.
- `OrderAuxiliaryLines/index.tsx` ya fue tocado por GAP-V2-051 y GAP-V2-038 (ambos `done`, mismo archivo, sin conflicto — campos distintos); GAP-V2-046 y GAP-V2-052 (`ready`) siguen pendientes sobre el mismo archivo — releer antes de implementarlos.
- GAP-V2-028 (ready, L) es el único GAP grande pendiente — implementar en pasada aislada, no mezclar con GAP-V2-029 (token-as-parameter, mismo archivo `orderService.ts` desde ángulo distinto) en el mismo commit sin releer primero cuál se implementa antes.
- `src/lib/orders/orderReadOnlyPermissions.ts` tiene ahora 2 comentarios documentando el rechazo de GAP-V2-036 — no reabrir "acción oculta sin feedback" para `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS`/`isOrderPalletsReadOnly` en futuras auditorías sin evidencia de que la decisión de producto cambió.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- No volver a auditar los mismos 5 carriles sobre los mismos archivos sin evidencia de que algo cambió — usar `needs_reaudit` si aplica.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el código de esta sesión (lote 17 + resolución de los 3 blocked) antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`) — sigue sin commitear al cierre de esta sesión.
- Antes de empezar trabajo nuevo sobre `orders`, comprobar si hay otra rama `claude/orders-*` sin mergear (`git branch -r | grep orders`) para evitar que se repita esta reconciliación.

## Estado resumido

```text
audited_ampliado → reconciled_lv9qnf_and_ewomf1 → batch_17_p1_done → blocked_resolved (15 ready, 0 blocked, 23 done, 0 later, 3 rejected)
```

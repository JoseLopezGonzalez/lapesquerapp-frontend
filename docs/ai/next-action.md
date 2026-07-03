# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-03

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

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

`npm run type-check`, `eslint` por archivo y `npm run build` limpios en ambos lotes.
`npx vitest run` comparado con `git stash` contra el árbol limpio: mismos 11 archivos/22
tests en fallo preexistentes antes y después — sin regresión introducida por ninguno de
los dos lotes.
**Cambios sin commitear todavía** — contexto LOCAL, Claude no commitea por su cuenta;
pendiente de que Jose revise y commitee (incluye lote 17 + blocked resueltos + lote 18 +
lote 19, todo en la misma sesión sin commit).

P0/P1 abiertos: 0. Blocked: 0. Ready: 9 (8 P3 pequeños + GAP-V2-028, tamaño L).

## Acción recomendada

Dos vías independientes, no excluyentes:

**A) Siguiente lote P3 pequeño, sin tocar `orderService.ts`:**

```text
/implement-next module=orders category=ux-ui limit=4 risk=low
```

→ cogería el resto de P3 ux-ui: `GAP-V2-046`, `GAP-V2-048`, `GAP-V2-049`, `GAP-V2-050`.

```text
/implement-next module=orders category=code-quality limit=4 risk=low
```

→ cogería los 4 P3 code-quality restantes: `GAP-V2-031`, `GAP-V2-032`, `GAP-V2-033`,
`GAP-V2-034`.

**B) GAP-V2-028 en pasada dedicada** (autorizado, tamaño L — no combinar con otros GAPs
en el mismo commit, ciclo completo de type-check/lint/test/build propio):

```text
/implement-next module=orders category=architecture-refactor limit=1 risk=medium
```

También queda pendiente de confirmación de Jose (no bloquea ningún GAP `ready` todavía, pero condiciona un futuro candidato): si las líneas auxiliares de pedido deben admitir cantidad/precio unitario negativo para representar abonos/devoluciones.

## Motivo

Los 16 lotes de `/implement-next` de la pasada 2026-07-02 cerraron `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022` y `GAP-V2-023`. Los lotes 15 y 16 (rama `lv9qnf`, 2026-07-03) cerraron `GAP-V2-024` y `GAP-V2-025`; el segundo generó `GAP-V2-026` como seguimiento no bloqueante de un doble refetch. GAP-V2-001 y GAP-V2-019 quedaron `rejected/superseded` (divididos o fusionados en otros GAPs). La ampliación de auditoría (rama `ewomf1`) cubrió superficies que quedaban `pending` y encontró 20 hallazgos nuevos. El lote 17 (2026-07-03) cerró los 4 P1 `ready` de esa ampliación: `GAP-V2-057`, `GAP-V2-056`, `GAP-V2-051` y `GAP-V2-038`. Jose resolvió los 3 `blocked` restantes en la misma sesión: `GAP-V2-027` (done), `GAP-V2-028` (ready, pendiente de implementar), `GAP-V2-036` (rejected). El lote 18 cerró `GAP-V2-029`, `GAP-V2-030` y `GAP-V2-026`. El lote 19 (misma sesión, continuación) cerró `GAP-V2-037`, `GAP-V2-052` y `GAP-V2-047`.

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-{001..009,011..014,019..034,036..038,046..052,056,057}.md` (41 archivos, ver registry para el desglose ready/done/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- `OrderEditSheet/index.tsx`: GAP-V2-057, GAP-V2-030 (hook consumido) y GAP-V2-037 (aria-invalid) ya `done` — sin GAPs `ready` pendientes sobre este archivo.
- `OrderAuxiliaryLines/index.tsx`: GAP-V2-051, GAP-V2-038 y GAP-V2-052 (unidad) ya `done` — GAP-V2-046 (`ready`, font-semibold) sigue pendiente sobre el mismo archivo, releer antes de implementarlo.
- GAP-V2-028 (ready, L) es el único GAP grande pendiente — implementar en pasada aislada. GAP-V2-029 (mismo archivo `orderService.ts`, ángulo distinto) ya está `done`, no genera conflicto de commit al implementar GAP-V2-028.
- `src/lib/orders/orderReadOnlyPermissions.ts` tiene ahora 2 comentarios documentando el rechazo de GAP-V2-036 — no reabrir "acción oculta sin feedback" para `COMMERCIAL_IN_PROGRESS_BLOCKED_ORDER_SECTIONS`/`isOrderPalletsReadOnly` en futuras auditorías sin evidencia de que la decisión de producto cambió.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- No volver a auditar los mismos 5 carriles sobre los mismos archivos sin evidencia de que algo cambió — usar `needs_reaudit` si aplica.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el código de esta sesión (lote 17 + resolución de los 3 blocked + lote 18) antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`) — sigue sin commitear al cierre de esta sesión.
- Antes de empezar trabajo nuevo sobre `orders`, comprobar si hay otra rama `claude/orders-*` sin mergear (`git branch -r | grep orders`) para evitar que se repita esta reconciliación.

## Estado resumido

```text
audited_ampliado → reconciled_lv9qnf_and_ewomf1 → batch_17_p1_done → blocked_resolved → batch_18_code_quality_done → batch_19_a11y_domain_ux_done (9 ready, 0 blocked, 29 done, 0 later, 3 rejected)
```

# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-03

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Circuito acotado de 5 carriles de `orders` sustancialmente cerrado: 21 GAPs documentados, 1 `ready` (GAP-V2-026, de seguimiento puntual), 18 `done`, 0 `blocked`, 2 `rejected/superseded`. GAP-V2-001 (sub-hooks de mutación sin TanStack Query) quedó completamente resuelto vía sus cuatro sub-GAPs (GAP-V2-022/023/024/025). GAP-V2-026 nació de una observación no bloqueante del `gap-auditor` al verificar GAP-V2-025.

## Acción recomendada

```text
/implement-next module=orders category=code-quality limit=1 risk=low
```

que cogería `GAP-V2-026`: aplicar `refetchType: 'none'` en `invalidateOrderDetail` de
`src/hooks/orders/useOrderPallets.ts` para eliminar el doble refetch por operación de
palet, sin tocar `reload()`/`resetCostAnalysis()`/`onChange`.

Tras cerrarlo, el circuito acotado de `orders` queda sin GAPs `ready`. Opciones
posteriores: ampliar `/deep-audit-module module=orders` a superficies pending
(listado/tablas, testing, performance, pase visual con capturas), o pasar a otro
módulo piloto con `/deep-audit-module module={otro_módulo}`.

## Motivo

Los 16 lotes de `/implement-next` ejecutados cerraron los 18 GAPs `done`: `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022`, `GAP-V2-023`, `GAP-V2-024` y `GAP-V2-025`. GAP-V2-001 y GAP-V2-019 quedaron `rejected/superseded` (divididos o fusionados en otros GAPs). GAP-V2-026 se creó el 2026-07-03 a partir del hallazgo no bloqueante señalado al verificar GAP-V2-025.

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-001..009.md`, `GAP-V2-011..014.md` y `GAP-V2-019..026.md` (21 archivos, ver registry para el desglose ready/done/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- GAP-V2-026 depende de GAP-V2-025 (ya `done`) y toca el mismo archivo — verificar en DevTools/Network que la operación sigue refrescando en una sola petición tras el cambio, no en cero.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).
- La rama `claude/orders-deep-audit-lv9qnf` fue recreada desde `origin/main` el 2026-07-03 porque el PR anterior de esa rama ya estaba mergeado; el siguiente trabajo debe seguir usando ese mismo nombre de rama salvo indicación contraria.

## Estado resumido

```text
audited_acotado → batch_16_done + split_GAP_V2_001 + GAP_V2_026_created (18 done, 1 ready, 0 blocked, 2 rejected)
```

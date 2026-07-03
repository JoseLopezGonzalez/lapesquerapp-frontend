# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-03

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Circuito acotado de 5 carriles de `orders` **cerrado**: 20 GAPs documentados, 0 `ready`, 18 `done`, 0 `blocked`, 2 `rejected/superseded`. GAP-V2-001 (sub-hooks de mutación sin TanStack Query) quedó completamente resuelto vía sus cuatro sub-GAPs (GAP-V2-022/023/024/025).

## Acción recomendada

No quedan GAPs `ready` en el circuito acotado de `orders`. Opciones para continuar:

```text
A) Ampliar cobertura de orders con una nueva pasada de:
   /deep-audit-module module=orders
   → enfocar superficies aún `pending` en §2 Cobertura de audit.md (p. ej. listado/tablas
     en code-quality, testing directo, performance, un pase visual con capturas reales).
   No repetir carriles/archivos ya `audited` sin evidencia de que algo cambió.

B) Abrir un GAP de seguimiento puntual para el hallazgo no bloqueante de GAP-V2-025:
   doble refetch en src/hooks/orders/useOrderPallets.ts (invalidateQueries + reload()).
   Fix sugerido: refetchType: 'none' en la invalidación.

C) Pasar a otro módulo piloto:
   /deep-audit-module module={otro_módulo}
```

## Motivo

Los 16 lotes de `/implement-next` ejecutados cerraron los 18 GAPs `done`: `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022`, `GAP-V2-023`, `GAP-V2-024` y `GAP-V2-025`. GAP-V2-001 y GAP-V2-019 quedaron `rejected/superseded` (divididos o fusionados en otros GAPs). No hay más GAPs candidatos generados por este circuito de 5 carriles.

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-001..009.md`, `GAP-V2-011..014.md` y `GAP-V2-019..025.md` (20 archivos, todos `done` o `rejected`)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).
- La rama `claude/orders-deep-audit-lv9qnf` fue recreada desde `origin/main` el 2026-07-03 porque el PR anterior de esa rama ya estaba mergeado; el siguiente trabajo debe seguir usando ese mismo nombre de rama salvo indicación contraria.

## Estado resumido

```text
audited_acotado → batch_16_done + split_GAP_V2_001 — circuito cerrado (18 done, 0 ready, 0 blocked, 2 rejected)
```

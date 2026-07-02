# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-02

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Primera auditoría real de `orders` completada en circuito acotado de 5 carriles. 20 GAPs documentados: 2 `ready`, 16 `done`, 0 `blocked` y 2 `rejected/superseded`. Cruce legacy acotado completado en `docs/ai/modules/orders/audit.md` sin crear GAPs nuevos.

## Acción recomendada

La tolerancia planificado/producido ya quedó implementada en GAP-V2-011, la normalización de IVA pendiente/inválido quedó cerrada en GAP-V2-012, la guarda de finalización con producción incompleta quedó cerrada en GAP-V2-013, la ocultación de coste/margen comercial quedó cerrada en GAP-V2-020, el lote code-quality medio cerró GAP-V2-003 y GAP-V2-005, GAP-V2-006 añadió cancelación explícita al formulario desktop de creación, GAP-V2-008 separó el error recuperable del estado "pedido no encontrado", GAP-V2-009 normalizó copy menor en pestaña/buscador, GAP-V2-014 cerró el drift restante de palets/tildes/capitalización, GAP-V2-007 cerró el hallazgo a11y-responsive de touch targets mobile, GAP-V2-022 migró incidencias a `useMutation` y GAP-V2-023 migró detalles planificados a `useMutation`.

La siguiente acción recomendada es implementar el siguiente sub-GAP de mutaciones:

```text
/implement-next module=orders category=code-quality limit=1 risk=medium
```

que cogería `GAP-V2-024`.

## Motivo

Los lotes implementables ya cerraron `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022` y `GAP-V2-023`. GAP-V2-001 quedó rechazado como lote único y reemplazado por sub-GAPs; siguen `ready` `GAP-V2-024` y `GAP-V2-025`.

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-001..009.md`, `GAP-V2-011..014.md` y `GAP-V2-019..025.md` (20 archivos, ver registry para el desglose ready/blocked/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- Implementar GAP-V2-024/025 de uno en uno porque ambos pueden tocar `src/hooks/useOrder.ts`.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).

## Estado resumido

```text
audited_acotado → batch_14_done + split_GAP_V2_001 (16 done, 2 ready, 0 blocked, 2 rejected)
```

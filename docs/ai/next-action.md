# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-02

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Primera auditoría real de `orders` completada en circuito acotado de 5 carriles. 16 GAPs documentados: 10 `ready`, 5 `done`, 0 `blocked` y 1 `rejected` por merge. Cruce legacy acotado completado en `docs/ai/modules/orders/audit.md` sin crear GAPs nuevos.

## Acción recomendada

La tolerancia planificado/producido ya quedó implementada en GAP-V2-011 y la normalización de IVA pendiente/inválido quedó cerrada en GAP-V2-012. La siguiente acción recomendada es continuar con la guarda de finalización de pedido incompleto:

```text
/implement-next module=orders category=domain-business limit=1 risk=medium
```

que cogería `GAP-V2-013`.

Para seguir permisos comerciales hace falta ampliar riesgo:

```text
/implement-next module=orders category=architecture-refactor limit=1 risk=medium
```

que cogería `GAP-V2-020` (ocultar/evitar coste y margen en detalle comercial readOnly).

Para seguir code-quality hace falta ampliar riesgo:

```text
/implement-next module=orders category=code-quality limit=2 risk=medium
```

que cogería `GAP-V2-003` y `GAP-V2-005`. `GAP-V2-001` sigue fuera por `size: L` salvo autorización explícita.

## Motivo

Los lotes implementables ya cerraron `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011` y `GAP-V2-012`. Al quedar corregidas las reglas de tolerancia e IVA pendiente, el siguiente avance más coherente es `GAP-V2-013`.

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-001..009.md`, `GAP-V2-011..014.md` y `GAP-V2-019..021.md` (16 archivos, ver registry para el desglose ready/blocked/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación.
- GAP-V2-001, 003, 005 y 020 son `risk: medium` — quedan fuera de `/implement-next` con el filtro `risk=low` salvo que Jose lo autorice explícitamente.
- GAP-V2-001 es `size: L` — no coger por defecto en ningún lote sin autorización explícita.
- GAP-V2-020 afecta coste/margen visible para comercial: conviene coordinarlo con backend/policies además del ocultado frontend.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).

## Estado resumido

```text
audited_acotado → batch_4_done + business_rules_confirmed (5 done, 10 ready, 0 blocked, 1 rejected)
```

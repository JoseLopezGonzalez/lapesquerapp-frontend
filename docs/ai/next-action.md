# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-02

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Primera auditoría real ejecutada (piloto acotado a 3 carriles). 12 GAPs generados y normalizados: 10 `ready`, 2 `blocked` por reglas de negocio pendientes.

## Acción recomendada

Antes de implementar nada, Jose debe confirmar 3 reglas operativas que bloquean GAP-V2-011 y GAP-V2-013 (ver `docs/ai/modules/orders/audit.md` § 9 Bloqueos). En paralelo, ya se puede empezar a implementar lo que no depende de eso:

```text
/implement-next module=orders category=code-quality limit=2 risk=low
```

que cogería `GAP-V2-002` y `GAP-V2-004` (los dos `ready`, `risk: low`, `size: S` sin dependencias abiertas).

## Motivo

El piloto demostró el flujo completo: guard de git, 3 subagentes en paralelo escribiendo GAPs candidatos sin colisión de IDs (rangos reservados por carril), normalización manual (12 candidatos, por debajo del umbral de 15 que activaría `gap-normalizer`), registry regenerado por script. Quedan sin usar en esta pasada: `gap-normalizer` (no hizo falta), `design-quality-auditor` y `permissions-multitenant-auditor` como carriles (alcance deliberadamente acotado a 3).

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-001..013.md` (12 archivos, ver registry para el desglose ready/blocked)

## Restricciones

- No marcar GAP-V2-011 ni GAP-V2-013 como `ready` sin que Jose confirme la regla de negocio.
- GAP-V2-001, 003, 005 son `risk: medium` — quedan fuera de `/implement-next` con el filtro por defecto (`risk=low`) salvo que Jose lo autorice explícitamente.
- GAP-V2-001 es `size: L` — no coger por defecto en ningún lote sin autorización explícita.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).

## Estado resumido

```text
auditing (parcial) → ready_for_implementation (para los GAPs sin bloqueo)
```

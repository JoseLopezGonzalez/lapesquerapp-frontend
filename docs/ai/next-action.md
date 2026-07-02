# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-02

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Primera auditoría real de `orders` completada en circuito acotado de 5 carriles. 16 GAPs documentados: 13 `ready`, 2 `blocked` por reglas de negocio pendientes y 1 `rejected` por merge.

## Acción recomendada

Jose debe confirmar 3 reglas operativas para desbloquear GAP-V2-011 y GAP-V2-013 (ver `docs/ai/modules/orders/audit.md` § 9 Bloqueos). En paralelo, ya se puede empezar a implementar lo que no depende de eso:

```text
/implement-next module=orders category=code-quality limit=2 risk=low
```

que cogería `GAP-V2-002` y `GAP-V2-004` (los dos `ready`, `risk: low`, `size: S` sin dependencias abiertas).

Alternativa de permisos comerciales, también low risk:

```text
/implement-next module=orders category=architecture-refactor limit=1 risk=low
```

que cogería `GAP-V2-021` (ocultar creación en manager comercial readOnly). `GAP-V2-020` es P1 pero `risk: medium` porque toca visibilidad de coste/margen.

## Motivo

El piloto queda ampliado y cerrado en el circuito acotado: guard de git, subagentes por carril, rangos de IDs separados, normalización manual y registry regenerado por script. `gap-normalizer` no hizo falta: el volumen quedó por debajo del umbral práctico y solo hubo un merge (`GAP-V2-019` → `GAP-V2-002`).

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-001..009.md`, `GAP-V2-011..014.md` y `GAP-V2-019..021.md` (16 archivos, ver registry para el desglose ready/blocked/rejected)

## Restricciones

- No marcar GAP-V2-011 ni GAP-V2-013 como `ready` sin que Jose confirme la regla de negocio.
- GAP-V2-001, 003, 005, 012 y 020 son `risk: medium` — quedan fuera de `/implement-next` con el filtro por defecto (`risk=low`) salvo que Jose lo autorice explícitamente.
- GAP-V2-001 es `size: L` — no coger por defecto en ningún lote sin autorización explícita.
- GAP-V2-020 afecta coste/margen visible para comercial: conviene coordinarlo con backend/policies además del ocultado frontend.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).

## Estado resumido

```text
audited_acotado → ready_for_implementation (para los GAPs sin bloqueo)
```

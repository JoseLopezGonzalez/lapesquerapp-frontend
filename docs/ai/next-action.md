# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-03

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Auditoría de `orders` ampliada a los 5 carriles sobre las superficies `pending`/`partial` restantes de la matriz de cobertura (confirmado por Jose: "todo el módulo, los 5 carriles"). 20 candidatos nuevos generados y normalizados por `gap-normalizer`. Total del módulo: 40 GAPs documentados — 19 `ready`, 3 `blocked`, 16 `done`, 0 `later`, 2 `rejected/superseded`.

## Acción recomendada

Implementar el siguiente lote de GAPs `ready` de bajo riesgo (varios P1 de tamaño S/M sin dependencias):

```text
/implement-next module=orders category=code-quality limit=1 risk=low
```

que cogería `GAP-V2-026` (guard de "descartar cambios" en `OrderEditSheet` — actualmente muerto, permite cerrar con cambios sin guardar).

En paralelo, pedir a Jose las 2 decisiones que desbloquean los 3 GAPs `blocked`:

- `GAP-V2-027` — ¿sigue vigente `OrdersListFiltersSheet` para un plan mobile Fase 3, o se elimina como código muerto?
- `GAP-V2-036` — elegir entre 3 opciones de UX para explicar por qué ciertas secciones/acciones quedan bloqueadas para comercial `readOnly`.
- `GAP-V2-028` — autorizar explícitamente el refactor L/riesgo medium de `orderService.ts` (35 funciones con boilerplate duplicado), o pedir que se divida en sub-GAPs más pequeños.

También queda pendiente de confirmación de Jose (no bloquea ningún GAP `ready` todavía, pero condiciona un futuro candidato): si las líneas auxiliares de pedido deben admitir cantidad/precio unitario negativo para representar abonos/devoluciones.

## Motivo

La pasada anterior (2026-07-02) ya cerró 16 GAPs vía `/implement-next` y dejó `GAP-V2-024`/`GAP-V2-025` como `ready`. La pasada 2026-07-03 amplió la auditoría a superficies que quedaban `pending` (listado, tablas/listados, edición, estados loading/empty/success, integración API completa de `orderService.ts`, testing) y encontró 20 hallazgos nuevos: destaca `GAP-V2-051` (recurrencia de la regla de negocio ya corregida en GAP-V2-012 — `parseTaxRate` duplicado y sin el fix en `OrderAuxiliaryLines`) y `GAP-V2-056` (botón "Exportar" del listado sin gate de rol, mismo patrón de riesgo que GAP-V2-020/021 ya cerrados).

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-{001..009,011..014,019..034,036..038,046..052,056}.md` (40 archivos, ver registry para el desglose ready/blocked/done/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- Implementar GAP-V2-024/025 de uno en uno porque ambos pueden tocar `src/hooks/useOrder.ts`.
- GAP-V2-026 también toca `OrderEditSheet/index.tsx`, igual que GAP-V2-037 (aria-invalid) — implementar uno y volver a leer el archivo antes del otro para no pisar cambios.
- GAP-V2-051 debe reutilizar `parseTaxRate` ya corregido en `useOrderPlannedDetails.ts` (GAP-V2-012, done), no reimplementar la lógica.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- No volver a auditar los mismos 5 carriles sobre los mismos archivos sin evidencia de que algo cambió — usar `needs_reaudit` si aplica.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).

## Estado resumido

```text
audited_ampliado → normalized_20_candidates (19 ready, 3 blocked, 16 done, 0 later, 2 rejected)
```

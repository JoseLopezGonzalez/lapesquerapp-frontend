# Next Action

> Este archivo responde siempre a: ¿qué debe hacer el siguiente agente/chat/modelo?
> Se actualiza al final de cada `/deep-audit-module` y cada `/implement-next`.

## Fecha

2026-07-03

## Módulo activo

orders (Pedidos) — módulo piloto

## Fase activa

Dos líneas de trabajo paralelas sobre `orders` se reconciliaron el 2026-07-03. La rama
`claude/orders-deep-audit-lv9qnf` cerró GAP-V2-024/025 vía `/implement-next` y creó
GAP-V2-026 (seguimiento de doble refetch en `useOrderPallets`) — ya mergeada a `main`
(PR #68). En paralelo, la rama `claude/orders-deep-audit-ewomf1` amplió la auditoría a
los 5 carriles sobre las superficies `pending`/`partial` restantes de la matriz
(confirmado por Jose: "todo el módulo, los 5 carriles"), generando 20 candidatos nuevos
normalizados por `gap-normalizer` a 17 `ready` + 3 `blocked`. Al mergear `main` en esa
rama se detectó una colisión de numeración (ambas ramas habían usado `GAP-V2-026` para
hallazgos distintos) — resuelta renombrando el de `ewomf1` a `GAP-V2-057`. Total del
módulo tras la reconciliación: **41 GAPs — 18 `ready`, 3 `blocked`, 18 `done`, 0 `later`,
2 `rejected/superseded`.**

## Acción recomendada

Implementar primero el GAP más simple y ya validado (seguimiento de la pasada anterior):

```text
/implement-next module=orders category=code-quality limit=1 risk=low
```

que cogería `GAP-V2-026`: aplicar `refetchType: 'none'` en `invalidateOrderDetail` de
`src/hooks/orders/useOrderPallets.ts` para eliminar el doble refetch por operación de
palet, sin tocar `reload()`/`resetCostAnalysis()`/`onChange`.

Después, implementar el lote de P1 `ready` más urgente de la ampliación de auditoría:

```text
/implement-next module=orders category=code-quality limit=1 risk=low
```

que cogería `GAP-V2-057` (guard de "descartar cambios" en `OrderEditSheet` — este GAP se
creó originalmente como `GAP-V2-026` en la rama `ewomf1`, pero se renombró a `GAP-V2-057`
al reconciliar con `lv9qnf`, que ya usaba ese número para un hallazgo distinto).

En paralelo, pedir a Jose las 3 decisiones que desbloquean los GAPs `blocked`:

- `GAP-V2-027` — ¿sigue vigente `OrdersListFiltersSheet` para un plan mobile Fase 3, o se elimina como código muerto?
- `GAP-V2-036` — elegir entre 3 opciones de UX para explicar por qué ciertas secciones/acciones quedan bloqueadas para comercial `readOnly`.
- `GAP-V2-028` — autorizar explícitamente el refactor L/riesgo medium de `orderService.ts` (35 funciones con boilerplate duplicado), o pedir que se divida en sub-GAPs más pequeños.

También queda pendiente de confirmación de Jose (no bloquea ningún GAP `ready` todavía, pero condiciona un futuro candidato): si las líneas auxiliares de pedido deben admitir cantidad/precio unitario negativo para representar abonos/devoluciones.

## Motivo

Los 16 lotes de `/implement-next` de la pasada 2026-07-02 cerraron `GAP-V2-002`, `GAP-V2-004`, `GAP-V2-021`, `GAP-V2-011`, `GAP-V2-012`, `GAP-V2-013`, `GAP-V2-020`, `GAP-V2-003`, `GAP-V2-005`, `GAP-V2-006`, `GAP-V2-008`, `GAP-V2-009`, `GAP-V2-014`, `GAP-V2-007`, `GAP-V2-022` y `GAP-V2-023`. Los lotes 15 y 16 (rama `lv9qnf`, 2026-07-03) cerraron `GAP-V2-024` y `GAP-V2-025`; el segundo generó `GAP-V2-026` como seguimiento no bloqueante de un doble refetch. GAP-V2-001 y GAP-V2-019 quedaron `rejected/superseded` (divididos o fusionados en otros GAPs). En paralelo, la ampliación de auditoría (rama `ewomf1`) cubrió superficies que quedaban `pending` (listado, tablas/listados, edición, estados loading/empty/success, integración API completa de `orderService.ts`, testing) y encontró 20 hallazgos nuevos: destaca `GAP-V2-051` (recurrencia de la regla de negocio ya corregida en GAP-V2-012 — `parseTaxRate` duplicado y sin el fix en `OrderAuxiliaryLines`) y `GAP-V2-056` (botón "Exportar" del listado sin gate de rol, mismo patrón de riesgo que GAP-V2-020/021 ya cerrados).

## Archivos clave

- `docs/ai/modules/orders/audit.md`
- `docs/ai/modules/orders/gaps-registry.md`
- `docs/ai/gaps/orders/GAP-V2-{001..009,011..014,019..034,036..038,046..052,056,057}.md` (41 archivos, ver registry para el desglose ready/blocked/done/rejected)

## Restricciones

- Reglas confirmadas: tolerancia `min(max(10 kg, kg_planificados * 3%), 75 kg)` ya implementada, IVA 0% legítimo permitido y distinguido de IVA pendiente/inválido, y finalización con producción incompleta mediante advertencia/confirmación ya implementada.
- GAP-V2-026 (doble refetch en `useOrderPallets`) depende de GAP-V2-025 (ya `done`) — verificar en DevTools/Network que la operación sigue refrescando en una sola petición tras el cambio, no en cero.
- GAP-V2-057 (guard de cierre de `OrderEditSheet`) también toca `OrderEditSheet/index.tsx`, igual que GAP-V2-037 (aria-invalid) — implementar uno y volver a leer el archivo antes del otro para no pisar cambios. GAP-V2-026 y GAP-V2-057 son GAPs completamente distintos pese a haber compartido número originalmente — no confundirlos al leer el histórico.
- GAP-V2-051 debe reutilizar `parseTaxRate` ya corregido en `useOrderPlannedDetails.ts` (GAP-V2-012, done), no reimplementar la lógica.
- GAP-V2-020 ya quedó resuelto en frontend, pero conviene coordinar el refuerzo equivalente con backend/policies.
- No volver a auditar los mismos 5 carriles sobre los mismos archivos sin evidencia de que algo cambió — usar `needs_reaudit` si aplica.
- Recordar commitear `docs/ai/modules/orders/`, `docs/ai/gaps/orders/`, y el resto de la capa v2 antes de la próxima auditoría o implementación (guard de git en `/deep-audit-module`).
- Antes de empezar trabajo nuevo sobre `orders`, comprobar si hay otra rama `claude/orders-*` sin mergear (`git branch -r | grep orders`) para evitar que se repita esta reconciliación.

## Estado resumido

```text
audited_ampliado → reconciled_lv9qnf_and_ewomf1 (18 ready, 3 blocked, 18 done, 0 later, 2 rejected)
```

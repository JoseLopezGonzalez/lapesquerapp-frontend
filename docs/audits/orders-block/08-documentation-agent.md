# Auditoría: Documentation Agent
# Bloque: Pedidos - documentación, contexto IA y decisiones

**Fecha:** 2026-04-26
**Rol auditor:** Documentation Agent
**Scope:** documentación existente, gaps, ADRs y contexto necesario para agentes

---

## 1. Archivos inspeccionados

| Archivo | Resultado |
|---|---|
| `AGENTS.md` | Lista pedidos como área funcional, sin describir gestor/editor |
| `docs/ai-context/00-project-brief.md` | Menciona sales orders en alcance general |
| `docs/ai-context/01-frontend-architecture.md` | Menciona `useOrder.js` y `OrderContext` como hooks complejos |
| `docs/ai-context/03-form-system.md` | Usa pedidos como ejemplo, no documenta el formulario real |
| `docs/ai-context/04-api-services.md` | Menciona `orderService.ts`, no detalla doble servicio |
| `docs/ai-context/05-entity-client.md` | Indica que `useOrder.js` es caso fuera de EntityClient |
| `docs/ai-context/10-current-priorities.md` | Menciona rentabilidad de pedidos |
| `docs/decisions/` | No hay ADR específico para arquitectura del bloque de pedidos |

---

## 2. Resultado general

El bloque más importante del frontend no tiene un documento estable propio. La documentación general reconoce pedidos, EntityClient y `useOrder.js`, pero no explica la arquitectura real: diferencia entre `/admin/orders` y `/admin/orders-manager`, doble servicio, read-only comercial, field/autoventa, palets, documentos y rentabilidad.

### Nota global: **3.0 / 10**

---

## 3. Hallazgos

| Severidad | Hallazgo | Referencia |
|---|---|---|
| Alta | No existe documento `docs/ai-context/` específico para el bloque de pedidos. | `docs/ai-context/` |
| Alta | No está documentada la diferencia entre listado EntityClient y gestor operacional. | `src/configs/entitiesConfig.js:129`, `src/app/admin/orders-manager/page.js:1` |
| Alta | No está documentada la convivencia de `src/services/orderService.ts` y `src/services/domain/orders/orderService.js`. | `src/services/orderService.ts:1`, `src/services/domain/orders/orderService.js:1` |
| Media | No hay ADR para reutilizar `Order` entre admin y comercial mediante `readOnly`. | `src/app/comercial/orders/[id]/page.js:1` |
| Media | No hay guía de QA para flujos críticos de pedidos: crear, editar, palets, documentos, field. | `docs/ai-context/07-testing-qa.md` |
| Media | No hay documentación del contrato de estados de pedido (`pending`, `finished`, `incident`, autoventa). | `src/configs/entitiesConfig.js:346` |
| Baja | `10-current-priorities.md` documenta rentabilidad, pero no enlaza con servicios/cards concretas ni riesgos. | `docs/ai-context/10-current-priorities.md` |

---

## 4. Documentación recomendada

1. Crear `docs/ai-context/12-orders-block.md` con:
   - rutas por rol;
   - diferencia EntityClient vs gestor;
   - componentes principales;
   - service layer actual;
   - reglas read-only comercial;
   - field/autoventa;
   - flujos de palets, documentos y rentabilidad.
2. Añadir sección en `04-api-services.md` para explicar el estado transitorio de los dos servicios de pedidos.
3. Añadir checklist de QA de pedidos en `07-testing-qa.md`.
4. Crear ADR si se decide mantener `Order` compartido con `readOnly` como patrón oficial.
5. Crear ADR si se decide consolidar los servicios de pedidos.

---

## 5. Archivos que necesitan revisión humana

| Archivo | Qué revisar |
|---|---|
| `docs/ai-context/10-current-priorities.md` | Si rentabilidad sigue siendo prioridad activa o ya está completada |
| `docs/ai-context/04-api-services.md` | Decidir cómo documentar `orderService.ts` vs adapter de dominio |
| `docs/decisions/` | Decidir ADR de arquitectura del bloque de pedidos |
| `AGENTS.md` | Añadir una línea más explícita sobre gestor/editor/field de pedidos si se considera área crítica |

---

## 6. Checklist de calidad documental

- [ ] Cualquier agente puede encontrar el entry point correcto para crear pedido.
- [ ] Cualquier agente entiende por qué `/admin/orders` y `/admin/orders-manager` coexisten.
- [ ] Está documentado qué flujos son admin, comercial y field.
- [ ] Está documentado qué servicio usar para cada operación.
- [ ] Está documentado qué acciones requieren coordinación backend o negocio.


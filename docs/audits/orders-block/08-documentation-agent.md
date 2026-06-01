# Auditoría: Documentation Agent

# Bloque: Pedidos - documentación, contexto IA y decisiones

**Fecha:** 2026-04-26
**Rol auditor:** Documentation Agent
**Scope:** documentación existente, gaps, ADRs y contexto necesario para agentes

---

## 1. Archivos inspeccionados

| Archivo                                       | Resultado                                                      |
| --------------------------------------------- | -------------------------------------------------------------- |
| `AGENTS.md`                                   | Lista pedidos como área funcional, sin describir gestor/editor |
| `docs/ai-context/00-project-brief.md`         | Menciona sales orders en alcance general                       |
| `docs/ai-context/01-frontend-architecture.md` | Menciona `useOrder.js` y `OrderContext` como hooks complejos   |
| `docs/ai-context/03-form-system.md`           | Usa pedidos como ejemplo, no documenta el formulario real      |
| `docs/ai-context/04-api-services.md`          | Menciona `orderService.ts`, no detalla doble servicio          |
| `docs/ai-context/05-entity-client.md`         | Indica que `useOrder.js` es caso fuera de EntityClient         |
| `docs/ai-context/10-current-priorities.md`    | Menciona rentabilidad de pedidos                               |
| `docs/decisions/`                             | No hay ADR específico para arquitectura del bloque de pedidos  |

---

## 2. Resultado general

El bloque más importante del frontend no tiene un documento estable propio. La documentación general reconoce pedidos, EntityClient y `useOrder.js`, pero no explica la arquitectura real: diferencia entre `/admin/orders` y `/admin/orders-manager`, doble servicio, read-only comercial, field/autoventa, palets, documentos y rentabilidad.

### Nota global: **3.0 / 10**

---

## 3. Hallazgos

| ID      | Severidad | Hallazgo                                                                                                             | Explicación del problema                                                                        | Referencia                                                                       | Solución / mejora recomendada                                    | Estado    | Observaciones |
| ------- | --------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------- | ------------- |
| OB08-01 | Alta      | No existe documento `docs/ai-context/` específico para el bloque de pedidos.                                         | Los agentes nuevos deben reconstruir la arquitectura leyendo código disperso.                   | `docs/ai-context/`                                                               | Crear `docs/ai-context/12-orders-block.md`.                      | Pendiente |               |
| OB08-02 | Alta      | No está documentada la diferencia entre listado EntityClient y gestor operacional.                                   | Es fácil tocar el listado cuando la feature pertenece al gestor, o al revés.                    | `src/configs/entitiesConfig.js:129`, `src/app/admin/orders-manager/page.js:1`    | Documentar rutas, propósito y cuándo tocar cada pantalla.        | Pendiente |               |
| OB08-03 | Alta      | No está documentada la convivencia de `src/services/orderService.ts` y `src/services/domain/orders/orderService.js`. | Sin guía, cada implementación puede elegir una capa distinta y agrandar la duplicidad.          | `src/services/orderService.ts:1`, `src/services/domain/orders/orderService.js:1` | Añadir nota en `04-api-services.md` con estado actual y destino. | Pendiente |               |
| OB08-04 | Media     | No hay ADR para reutilizar `Order` entre admin y comercial mediante `readOnly`.                                      | Es una decisión arquitectónica relevante porque mezcla roles y permisos en el mismo componente. | `src/app/comercial/orders/[id]/page.js:1`                                        | Crear ADR si se consolida como patrón compartido oficial.        | Pendiente |               |
| OB08-05 | Media     | No hay guía de QA para flujos críticos de pedidos: crear, editar, palets, documentos, field.                         | El bloque tiene demasiados caminos para depender de memoria o pruebas ad hoc.                   | `docs/ai-context/07-testing-qa.md`                                               | Añadir checklist específico de pedidos.                          | Pendiente |               |
| OB08-06 | Media     | No hay documentación del contrato de estados de pedido (`pending`, `finished`, `incident`, autoventa).               | Estados sin contrato claro provocan filtros, badges y permisos inconsistentes.                  | `src/configs/entitiesConfig.js:346`                                              | Documentar estados, transiciones y roles permitidos.             | Pendiente |               |
| OB08-07 | Baja      | `10-current-priorities.md` documenta rentabilidad, pero no enlaza con servicios/cards concretas ni riesgos.          | La prioridad queda vaga y no orienta mantenimiento ni QA.                                       | `docs/ai-context/10-current-priorities.md`                                       | Enlazar cards, servicios y estado real de prioridad.             | Pendiente |               |

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

| ID      | Archivo                                    | Qué revisar                                                                                      | Explicación del problema                                                                    | Solución / mejora recomendada                                          | Estado    | Observaciones |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------- | ------------- |
| OB08-08 | `docs/ai-context/10-current-priorities.md` | Si rentabilidad sigue siendo prioridad activa o ya está completada                               | Una prioridad desactualizada arrastra trabajo hacia el sitio equivocado.                    | Actualizar prioridad y enlazar auditoría si sigue activa.              | Pendiente |               |
| OB08-09 | `docs/ai-context/04-api-services.md`       | Decidir cómo documentar `orderService.ts` vs adapter de dominio                                  | La capa API de pedidos es ambigua sin una nota explícita.                                   | Añadir sección "Pedidos: servicio histórico y adapter".                | Pendiente |               |
| OB08-10 | `docs/decisions/`                          | Decidir ADR de arquitectura del bloque de pedidos                                                | Reutilización read-only y facade de servicios son decisiones estables, no notas temporales. | Crear ADR para service facade o reutilización read-only si se aprueba. | Pendiente |               |
| OB08-11 | `AGENTS.md`                                | Añadir una línea más explícita sobre gestor/editor/field de pedidos si se considera área crítica | Pedidos aparece como dominio general, pero no como bloque complejo con flujos propios.      | Ampliar alcance funcional con "gestor/editor/field de pedidos".        | Pendiente |               |

---

## 6. Checklist de calidad documental

- [ ] Cualquier agente puede encontrar el entry point correcto para crear pedido.
- [ ] Cualquier agente entiende por qué `/admin/orders` y `/admin/orders-manager` coexisten.
- [ ] Está documentado qué flujos son admin, comercial y field.
- [ ] Está documentado qué servicio usar para cada operación.
- [ ] Está documentado qué acciones requieren coordinación backend o negocio.

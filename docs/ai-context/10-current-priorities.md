# Current Priorities — La PesquerApp Frontend

> Este archivo debe mantenerse actualizado. Responsable: Jose o Documentation Agent.
> Última actualización: 2026-04-26

---

## Trabajo reciente completado

- **Rentabilidad de pedidos**: Cards de análisis de rentabilidad (`OrdersProfitabilityProductsCard`, `OrdersProfitabilitySummaryCard`) con métricas, tooltips y búsqueda integrada.
- **Datos de exportación**: Actualización continua de productos y barcos en `exportData.js` (productos: CANGREJO AZUL, CINTA, BROTOLA DE FANGO, CIGALA ROTA; barcos: MAPE y otros).
- **Estructura de contexto para agentes IA**: Implementación completa de `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `docs/ai-context/`, `docs/agents/`, `docs/templates/`, `docs/decisions/`.

---

## Prioridades activas

### 1. CRM — Agenda de próxima acción (alta prioridad)

El backend ya tiene implementado el sistema de "próxima acción" por cliente/prospecto.
El frontend está pendiente de integrar el flujo:

- Crear interacción → registrar próxima acción
- Marcar acción como completada → proponer nueva
- Vista de agenda comercial (listado de acciones pendientes por fecha)

Documentación de referencia: `docs/to do/26-03-2026/agenda-next-action-ux-backend-implementation.md`

### 2. Dashboard de rentabilidad

- Refinamiento de las cards de análisis de rentabilidad de pedidos.
- Posible expansión a clientes y productos.

### 3. Exportaciones de datos

- Integración con Facilcom, A3ERP y Excel.
- Actualización de catálogos de productos y barcos en `exportData.js`.

### 4. Responsividad móvil

- Mejora de la experiencia en almacén y campo (roles: `operario`, `repartidor_autoventa`).
- Las pantallas de field operators y warehouse operators son de uso mayoritario en móvil.

---

## Refactors pendientes programados

- **Unificación hooks autoventa** (`useFieldAutoventa` + `useAutoventa`): ~170 líneas duplicadas, baja prioridad. Ver `docs/74-refactor-hooks-autoventa-duplicacion.md`.

---

## No hacer ahora

- No rediseñar la aplicación completa.
- No introducir nueva librería de UI.
- No cambiar el contrato de la API sin coordinación explícita con el backend.
- No añadir abstracciones complejas antes de que haya necesidad clara.
- No modificar `entitiesConfig.js` de forma masiva sin revisión.

---

## Estado del sistema de agentes IA

La estructura de contexto para agentes está completa y operativa.

Para iniciar cualquier tarea, usar la frase de activación del agente correspondiente:

```
Actúa como [Nombre del Agente] de La PesquerApp. Lee las reglas del repo y ayúdame a [tarea concreta].
```

Agentes disponibles: Frontend Next.js, UI/Form System, API Client, EntityClient, Design System, Frontend Performance, QA/UX, Brutal Reviewer, Documentation.

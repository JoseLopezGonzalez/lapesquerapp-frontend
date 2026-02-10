# Mobile App – PesquerApp

Este directorio agrupa toda la documentación relacionada con la **experiencia mobile / PWA** de PesquerApp, con foco en que la app instalada en el smartphone **se sienta como una app nativa**, no solo como una web responsive.

## Estructura

- `plan/`
  - Contiene la **visión y el plan general** de adaptación mobile (documento estratégico, relativamente estable).
- `estandares-ui/`
  - **Estándares de diseño y usabilidad** para la versión mobile: patrones de apps nativas, design tokens, reglas de interacción, pilares de UI nativa.
- `implementacion/`
  - Documentación **vinculada a la implementación concreta** en el código:
    - estado actual
    - TODOs generales
    - checklists
    - documentación por módulo/pantalla

## Documentos clave actuales

- `plan/01-PLAN-GENERAL-ADAPTACION-MOBILE.md`  
  Documento maestro de **visión y estrategia** para la adaptación mobile y armonización con desktop.

- `estandares-ui/01-PILARES-UI-NATIVA-MOBILE.md`  
  **Pilares y estándares** de UI para que la PWA se sienta nativa (navegación, touch, feedback, accesibilidad, PWA, etc.).

- `implementacion/01-MASTER-IMPLEMENTACION-MOBILE-PESQUERAPP.md`  
  Documento maestro de **implementación**: estado actual, tareas, fases, checklists y próximos pasos.

- `implementacion/02-PLAN-LISTA-PEDIDOS-MOBILE.md`  
  **Plan de implementación** de las mejoras de la pantalla principal del gestor de pedidos en mobile (lista como cola de trabajo, header simple, sheet de filtros, cards operativas). Basado en el análisis en `analisis/01-ANALISIS-GESTOR-PEDIDOS-MOBILE.md`.

El flujo esperado es:

1. Definir/ajustar la visión en `plan/`.
2. Bajar esa visión a estándares concretos en `estandares-ui/`.
3. Bajar esos estándares a implementación y tareas rastreables en `implementacion/`.


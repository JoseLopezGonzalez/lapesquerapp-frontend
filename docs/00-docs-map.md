# Mapa de Documentación — Brisapp Next.js

**Última actualización**: 2026-03-23

## Circuito activo de frontend

| Archivo | Descripción |
|---|---|
| [prompts/frontend-circuit/00-guia-circuito-frontend.md](./prompts/frontend-circuit/00-guia-circuito-frontend.md) | Guía del circuito activo de auditoría e implementación |
| [prompts/frontend-circuit/01-prompt-maestro-auditoria-frontend.md](./prompts/frontend-circuit/01-prompt-maestro-auditoria-frontend.md) | Prompt maestro de auditoría |
| [prompts/frontend-circuit/02-prompt-maestro-implementacion-frontend-por-bloques.md](./prompts/frontend-circuit/02-prompt-maestro-implementacion-frontend-por-bloques.md) | Prompt maestro de implementación por bloques |
| [prompts/frontend-circuit/03-fuente-de-verdad-bloques-y-puntuaciones-frontend.md](./prompts/frontend-circuit/03-fuente-de-verdad-bloques-y-puntuaciones-frontend.md) | Fuente principal de verdad para bloques y puntuaciones |
| [prompts/frontend-circuit/04-network-cors-auth-cross-origin-frontend.md](./prompts/frontend-circuit/04-network-cors-auth-cross-origin-frontend.md) | Documento integrado de network/CORS/auth/cross-origin |

**Regla:** esta estructura sustituye al circuito anterior como referencia operativa principal.

## Documentos principales (raíz)

| NN | Archivo | Descripción |
|---|---------|-------------|
| 00 | [00-overview-introduction.md](./00-overview-introduction.md) | Visión general, stack, convenciones |
| 01 | [01-architecture-app-router.md](./01-architecture-app-router.md) | App Router, rutas, layouts |
| 02 | [02-project-structure.md](./02-project-structure.md) | Estructura de directorios |
| 03 | [03-components-ui-shadcn.md](./03-components-ui-shadcn.md) | Componentes UI base |
| 04 | [04-components-admin.md](./04-components-admin.md) | Componentes Admin |
| 05 | [05-hooks-personalizados.md](./05-hooks-personalizados.md) | Hooks |
| 06 | [06-context-api.md](./06-context-api.md) | Context API |
| 07 | [07-servicios-api-v2.md](./07-servicios-api-v2.md) | Servicios API v2 |
| 08 | [08-formularios.md](./08-formularios.md) | Formularios RHF |
| 09 | [09-flujos-completos.md](./09-flujos-completos.md) | Flujos funcionales |
| 10 | [10-estilos-design-system.md](./10-estilos-design-system.md) | Estilos y design system |
| 11 | [11-autenticacion-autorizacion.md](./11-autenticacion-autorizacion.md) | Auth y protección |
| 12 | [12-utilidades-helpers.md](./12-utilidades-helpers.md) | Helpers |
| 13 | [13-exportaciones-integraciones.md](./13-exportaciones-integraciones.md) | Exportaciones |
| 14 | [14-produccion-en-construccion.md](./14-produccion-en-construccion.md) | Módulo producción |
| 15 | [15-observaciones-criticas.md](./15-observaciones-criticas.md) | Observaciones críticas |
| 16-23 | [16-guia-auth-magic-link-otp.md](./16-guia-auth-magic-link-otp.md) … [23-uso-settings.md](./23-uso-settings.md) | Guías y config |
| — | [guia-branding-generico-env.md](./guia-branding-generico-env.md) | Branding genérico / La PesquerApp por .env |
| 40 | [40-plan-core-consolidation-erp.md](./40-plan-core-consolidation-erp.md) | Plan consolidación Core |
| 50-66 | analisis, endpoints, especificaciones, implementaciones | Docs técnicos |

## Subcarpetas

- **analisis/** — Análisis técnicos, optimizaciones (01-09-*)
- **API-references/** — Referencias de endpoints
- **arquitectura-servicios/** — Arquitectura de servicios (00-03-*)
- **audits/** — Auditorías
- **chat-ai/** — Integración chat AI (00-03-*)
- **configs/** — [00-entities-config.md](./configs/00-entities-config.md)
- **examples/** — [00-entity-config-examples.md](./examples/00-entity-config-examples.md)
- **migraciones-expo/** — Guías Expo
- **mobile-app/** — Planes y análisis mobile
- **prompts/** — Prompts de trabajo
- **prompts/frontend-circuit/** — Circuito activo de auditoría e implementación del frontend
- **prompts/antiguos/frontend-circuito-v1/** — Prompts históricos archivados del circuito anterior
- **refactor/** — Análisis de refactor
- **troubleshooting/** — notas operativas y redirecciones a documentos activos
- **troubleshooting/antiguos/** — troubleshooting histórico archivado
- **audits/antiguos/frontend-circuito-v1/** — auditoría global y evolution log históricos
- **_worklog/** — [CHANGES.md](./_worklog/CHANGES.md), [VERIFY.md](./_worklog/VERIFY.md)

# Documentación - Brisapp Next.js

## 📋 Visión General

Documentación completa del frontend de **Brisapp**, una aplicación Next.js 16 para gestión de operaciones pesqueras. Esta documentación cubre exclusivamente la **API v2** (versión activa).

📌 **Mapa completo**: [00-docs-map.md](./00-docs-map.md)

---

## ⚠️ Notas Importantes

- **API v2 es la versión activa**: Toda la documentación se enfoca en API v2
- **Producción en construcción**: El módulo de producción está en desarrollo activo
- **Documentación basada en código real**: Solo se documenta lo que existe

---

## 📚 Documentación Principal

### Circuito Activo de Auditoría e Implementación

- **[prompts/12-prompt-auditoria-principal-frontend.md](./prompts/12-prompt-auditoria-principal-frontend.md)** - Prompt maestro de auditoría
- **[prompts/13-prompt-implementacion-mejoras-por-bloques-frontend.md](./prompts/13-prompt-implementacion-mejoras-por-bloques-frontend.md)** - Prompt maestro de implementación por bloques
- **[prompts/14-guia-circuito-auditoria-e-implementacion-frontend.md](./prompts/14-guia-circuito-auditoria-e-implementacion-frontend.md)** - Guía operativa del circuito activo
- **[prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md](./prompts/15-fuente-de-verdad-bloques-y-puntuaciones-frontend.md)** - Fuente principal de verdad para bloques, puntuaciones y estado
- **[prompts/16-network-cors-auth-cross-origin-frontend.md](./prompts/16-network-cors-auth-cross-origin-frontend.md)** - Anexo operativo para CORS, cookies, auth flow y cross-origin
- **[prompts/17-prompt-auditoria-producciones-rendimiento-y-fluidez.md](./prompts/17-prompt-auditoria-producciones-rendimiento-y-fluidez.md)** - Prompt especializado para auditar producciones con foco en rendimiento, loaders, transiciones y fluidez percibida

Los prompts y auditorías movidos a `antiguos/` pasan a ser referencia histórica y no deben usarse como circuito principal.

### Fundamentos

1. **[00-overview-introduction.md](./00-overview-introduction.md)** - Visión general, stack tecnológico, convenciones
2. **[01-architecture-app-router.md](./01-architecture-app-router.md)** - Arquitectura Next.js App Router, rutas, layouts
3. **[02-project-structure.md](./02-project-structure.md)** - Estructura de directorios y organización

### Componentes y UI

4. **[03-components-ui-shadcn.md](./03-components-ui-shadcn.md)** - Componentes base ShadCN UI y personalizados
5. **[04-components-admin.md](./04-components-admin.md)** - Componentes del módulo Admin

### Estado y Lógica

6. **[05-hooks-personalizados.md](./05-hooks-personalizados.md)** - Hooks personalizados
7. **[06-context-api.md](./06-context-api.md)** - Context API (Order, Store, Settings)

### Servicios y Datos

8. **[07-servicios-api-v2.md](./07-servicios-api-v2.md)** - Servicios API v2 y endpoints
9. **[08-formularios.md](./08-formularios.md)** - Sistema React Hook Form

### Flujos y Funcionalidades

10. **[09-flujos-completos.md](./09-flujos-completos.md)** - Flujos funcionales documentados
11. **[10-estilos-design-system.md](./10-estilos-design-system.md)** - Tailwind CSS y design system
12. **[11-autenticacion-autorizacion.md](./11-autenticacion-autorizacion.md)** - NextAuth y protección de rutas
13. **[12-utilidades-helpers.md](./12-utilidades-helpers.md)** - Funciones auxiliares, helpers y logger (desarrollo vs producción)
14. **[13-exportaciones-integraciones.md](./13-exportaciones-integraciones.md)** - Exportaciones e integraciones

### Estado del Proyecto

15. **[14-produccion-en-construccion.md](./14-produccion-en-construccion.md)** - Módulo de producción (en desarrollo)
16. **[15-observaciones-criticas.md](./15-observaciones-criticas.md)** - Problemas identificados y mejoras

### Análisis y Auditorías

17. **[analisis/README.md](./analisis/README.md)** - Análisis técnicos, auditorías y optimizaciones

- Análisis de componentes y módulos
- Optimizaciones implementadas
- Propuestas de refactorización

### Histórico del Circuito Anterior

- `docs/prompts/antiguos/frontend-circuito-v1/` - prompts legacy del circuito anterior
- `docs/audits/antiguos/frontend-circuito-v1/` - auditoría global y evolution log previos

---

## 📖 Documentación Técnica

### Específica de Módulos

_(Docs específicos: ver subcarpetas analisis/, API-references/, etc.)_

### Guías Rápidas

- **[23-uso-settings.md](./23-uso-settings.md)** - Guía de uso de settings globales
- **[configs/00-entities-config.md](./configs/00-entities-config.md)** - Configuración de entidades
- **[examples/00-entity-config-examples.md](./examples/00-entity-config-examples.md)** - Ejemplos de configuración

---

## 🎯 Guía de Uso

### Para Desarrolladores Nuevos

1. **[00-overview-introduction.md](./00-overview-introduction.md)** - Comienza aquí
2. **[01-architecture-app-router.md](./01-architecture-app-router.md)** - Estructura general
3. **[02-project-structure.md](./02-project-structure.md)** - Navegación del código

### Para Revisión de Código

- **[15-observaciones-criticas.md](./15-observaciones-criticas.md)** - Problemas identificados

---

## 🔗 Enlaces Rápidos

- [Introducción](./00-overview-introduction.md) - Comienza aquí
- [Arquitectura](./01-architecture-app-router.md) - Estructura del proyecto
- [Observaciones Críticas](./15-observaciones-criticas.md) - Problemas identificados
- [Producción](./14-produccion-en-construccion.md) - Módulo en desarrollo

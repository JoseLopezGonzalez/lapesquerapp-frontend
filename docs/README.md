# Documentación - Brisapp Next.js

## 📋 Índice General

Esta documentación cubre **exclusivamente** la interacción con la **API v2**, que es la versión activa del backend. La API v1 está obsoleta y solo existe como capa de compatibilidad.

Esta es la documentación principal del proyecto, cubriendo toda la arquitectura, componentes, servicios, hooks, formularios, flujos funcionales y más del frontend de Brisapp.

---

## 📚 Estructura de Documentación

### Documentos Principales

1. **[00-INTRODUCCION.md](./00-INTRODUCCION.md)**
   - Visión general del proyecto
   - Stack tecnológico completo
   - Convenciones de código
   - Estructura de carpetas
   - Módulos principales

2. **[01-ARQUITECTURA.md](./01-ARQUITECTURA.md)**
   - Arquitectura Next.js App Router
   - Estructura de rutas y layouts
   - Client vs Server Components
   - Middleware y protección de rutas
   - Multi-tenant architecture

3. **[02-ESTRUCTURA-PROYECTO.md](./02-ESTRUCTURA-PROYECTO.md)**
   - Descripción detallada de directorios
   - Organización de código
   - Path aliases y convenciones
   - Flujo de dependencias

4. **[03-COMPONENTES-UI.md](./03-COMPONENTES-UI.md)**
   - Componentes base ShadCN UI
   - Componentes personalizados
   - Props y uso de cada componente
   - Dependencias externas

5. **[04-COMPONENTES-ADMIN.md](./04-COMPONENTES-ADMIN.md)**
   - Componentes del módulo Admin
   - Dashboard, Orders, Stores, Productions
   - Sistema de entidades genérico
   - Layout y navegación

6. **[05-HOOKS-PERSONALIZADOS.md](./05-HOOKS-PERSONALIZADOS.md)**
   - Documentación de todos los hooks
   - Parámetros y retornos
   - Casos de uso y ejemplos
   - Hooks de configuración

7. **[06-CONTEXT-API.md](./06-CONTEXT-API.md)**
   - OrderContext, StoreContext, SettingsContext
   - Estado inicial y acciones
   - Patrones de consumo
   - Gestión de estado global

8. **[07-SERVICIOS-API-V2.md](./07-SERVICIOS-API-V2.md)**
   - Documentación completa de servicios
   - Endpoints API v2
   - Parámetros y respuestas
   - Manejo de errores
   - Ejemplos de uso

9. **[08-FORMULARIOS.md](./08-FORMULARIOS.md)**
   - Sistema React Hook Form
   - Configuración de formularios
   - Componentes de input personalizados
   - Validaciones y reglas
   - Ejemplos reales

10. **[09-FLUJOS-COMPLETOS.md](./09-FLUJOS-COMPLETOS.md)**
    - Flujos funcionales documentados
    - Crear/editar pedidos
    - Gestión de almacenes
    - Sistema de etiquetas
    - Exportaciones e integraciones
    - Procesos completos paso a paso

11. **[10-ESTILOS-DESIGN-SYSTEM.md](./10-ESTILOS-DESIGN-SYSTEM.md)**
    - Configuración Tailwind CSS
    - Design tokens y variables
    - Componentes ShadCN
    - Responsive design
    - Animaciones y temas

12. **[11-AUTENTICACION-AUTORIZACION.md](./11-AUTENTICACION-AUTORIZACION.md)**
    - NextAuth configuración
    - Protección de rutas
    - Roles y permisos
    - Middleware de autenticación
    - Flujos de login/logout

13. **[12-UTILIDADES-HELPERS.md](./12-UTILIDADES-HELPERS.md)**
    - Funciones auxiliares
    - Helpers de formato
    - Utilidades de librería
    - Transformación de datos
    - GS1-128 parsing

14. **[13-EXPORTACIONES-INTEGRACIONES.md](./13-EXPORTACIONES-INTEGRACIONES.md)**
    - Exportación a Excel (XLSX)
    - Integración con A3ERP
    - Integración con Facilcom
    - Generación de PDFs
    - Azure Document AI
    - Envío de documentos por email

15. **[14-PRODUCCION-EN-CONSTRUCCION.md](./14-PRODUCCION-EN-CONSTRUCCION.md)**
    - Estado actual del módulo
    - Funcionalidades implementadas
    - Funcionalidades pendientes
    - Servicios API v2
    - Limitaciones conocidas

16. **[15-OBSERVACIONES-CRITICAS.md](./15-OBSERVACIONES-CRITICAS.md)**
    - Compilación de todas las observaciones
    - Componentes duplicados
    - Código muerto
    - Lógica incompleta
    - Problemas de rendimiento
    - Inconsistencias arquitectónicas

---

## 🎯 Guía de Uso

### Para Desarrolladores Nuevos

1. Comienza con **[00-INTRODUCCION.md](./00-INTRODUCCION.md)** para entender el proyecto
2. Revisa **[01-ARQUITECTURA.md](./01-ARQUITECTURA.md)** para la estructura general
3. Consulta **[02-ESTRUCTURA-PROYECTO.md](./02-ESTRUCTURA-PROYECTO.md)** para navegar el código
4. Usa los demás documentos como referencia según necesites

### Para IAs y Herramientas de Código

- Todos los documentos están estructurados con referencias exactas a archivos y líneas
- Cada sección incluye ejemplos de código real
- Las observaciones críticas están documentadas sin modificar el código

### Para Revisión de Código

- Consulta **[15-OBSERVACIONES-CRITICAS.md](./15-OBSERVACIONES-CRITICAS.md)** para ver todos los problemas identificados
- Cada documento incluye su propia sección de observaciones críticas

---

## ⚠️ Notas Importantes

1. **API v2 es la versión activa**: Toda la documentación se enfoca en API v2
2. **Producción en construcción**: El módulo de producción está en desarrollo activo
3. **Documentación basada en código real**: Solo se documenta lo que existe
4. **Observaciones críticas**: Documentadas sin modificar el código

---

## 📊 Estadísticas

- **Total de archivos documentados**: 15 documentos principales
- **Componentes documentados**: 100+ componentes
- **Hooks documentados**: 13 hooks personalizados
- **Servicios API v2**: 12+ servicios principales
- **Flujos completos**: 8 flujos funcionales
- **Observaciones críticas**: 200+ observaciones identificadas

---

## 🔗 Enlaces Rápidos

- [Introducción](./00-INTRODUCCION.md) - Comienza aquí
- [Observaciones Críticas](./15-OBSERVACIONES-CRITICAS.md) - Todos los problemas identificados

### Documentación Complementaria (Referencia Rápida)

La siguiente documentación está **integrada** en los documentos principales pero se mantiene como referencia rápida:

- [Configuración de Entidades](./configs/entitiesConfig.md) - Guía detallada de configuración (también en [04-COMPONENTES-ADMIN.md](./04-COMPONENTES-ADMIN.md))
- [Ejemplos de Configuración](./examples/entity-config-examples.md) - Ejemplos prácticos (también en [04-COMPONENTES-ADMIN.md](./04-COMPONENTES-ADMIN.md))
- [Uso de Settings](./USO_SETTINGS.md) - Guía práctica rápida (también en [06-CONTEXT-API.md](./06-CONTEXT-API.md))
- [Componentes de Filtros](./components/Admin/Filters/GenericFilters/Types/) - Documentación técnica de componentes (también en [04-COMPONENTES-ADMIN.md](./04-COMPONENTES-ADMIN.md))

---

## 📝 Mantenimiento

Esta documentación debe actualizarse cuando:
- Se añaden nuevas funcionalidades
- Se modifican componentes críticos
- Se cambian patrones arquitectónicos
- Se identifican nuevos problemas

**Última actualización**: Generada automáticamente basada en el código actual del repositorio.


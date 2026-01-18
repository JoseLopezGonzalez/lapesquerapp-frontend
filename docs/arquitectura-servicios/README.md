# Arquitectura de Servicios de Dominio

Este directorio contiene toda la documentación relacionada con la refactorización de la arquitectura de servicios para preparar la integración con Vercel AI Chat.

---

## 📚 Documentos

### 🎯 [TODO Unificado](./TODO-UNIFICADO.md) ⭐ **START HERE**
Documento que unifica todos los TODOs de los demás documentos en un solo lugar. Incluye estado de progreso, próximos pasos y tareas organizadas por fases.

**📌 Consulta esto primero** para ver qué hacer a continuación y seguir el progreso.

### 1. [Resumen Ejecutivo](./RESUMEN-ARQUITECTURA-SERVICIOS.md)
Resumen completo del estado actual, lo que se ha completado y próximos pasos.

**📌 Comienza aquí** si quieres una visión general rápida.

### 2. [Arquitectura de Servicios de Dominio](./ARQUITECTURA-SERVICIOS-DOMINIO.md)
Documento principal que describe los principios arquitectónicos, estructura propuesta y restricciones.

**📖 Lee esto** para entender la arquitectura completa y los principios de diseño.

### 3. [Plan de Implementación](./PLAN-IMPLEMENTACION-SERVICIOS-DOMINIO.md)
Plan detallado paso a paso para implementar la arquitectura, con fases y tareas específicas.

**🎯 Úsalo** como guía para la implementación gradual.

### 4. [Ejemplo de Implementación: Supplier Service](./IMPLEMENTACION-EJEMPLO-SUPPLIER-SERVICE.md)
Ejemplo completo y documentado de cómo implementar un service de dominio, usando `supplierService` como referencia.

**🔧 Consulta esto** cuando necesites crear un nuevo service de dominio.

### 5. [Plan de Integración: Vercel AI Chatbot](./PLAN-INTEGRACION-VERCEL-AI-CHATBOT.md) ⭐ **NUEVO**
Plan detallado paso a paso para integrar el template de Vercel AI Chatbot con los servicios de dominio.

**🚀 Úsalo** para implementar el chat AI conectado a todos los servicios de dominio.

### 6. [Implementación Chat AI Completa](./IMPLEMENTACION-CHAT-AI-COMPLETA.md) ⭐ **NUEVO**
Documento detallado que describe exactamente cómo se implementó el chat AI, incluyendo todas las librerías, versiones, código completo, problemas encontrados y soluciones. Incluye comparación con documentación oficial de Vercel y OpenAI.

**📖 Consulta esto** para verificar la implementación exacta y compararla con la documentación oficial.

### 7. [Próximos Pasos](./PROXIMOS-PASOS.md)
Documento que resume las opciones de próximos pasos después de completar las fases 1-5.

**📋 Revisa** para ver qué hacer después de completar la refactorización.

---

## 🗂️ Estructura de Archivos en el Proyecto

```
/src/
  ├── lib/
  │   └── auth/
  │       └── getAuthToken.js                    # Helper para obtener token
  │
  ├── services/
  │   ├── generic/                               # Servicios genéricos (PRIVADOS)
  │   │   ├── entityService.js
  │   │   ├── createEntityService.js
  │   │   └── editEntityService.js
  │   │
  │   └── domain/                                # Servicios de dominio (PÚBLICOS)
  │       └── suppliers/
  │           └── supplierService.js             # Ejemplo completo
```

---

## 🎯 Principios Clave

1. **Servicios Genéricos Son Privados**
   - Solo deben usarse dentro de services de dominio
   - Los componentes NUNCA deben importarlos directamente

2. **Servicios de Dominio Son Públicos**
   - Son la única forma en que los componentes interactúan con el backend
   - Expresan semántica de negocio, no técnica

3. **Ocultación de Detalles Técnicos**
   - URLs, endpoints y configuración dinámica están encapsulados
   - Los componentes solo conocen métodos semánticos

4. **Contratos Estables**
   - Los services de dominio tienen contratos predecibles
   - Cambios internos no afectan los contratos públicos

---

## 🚀 Inicio Rápido

### Para entender la arquitectura:
1. Lee [Resumen Ejecutivo](./RESUMEN-ARQUITECTURA-SERVICIOS.md)
2. Revisa [Arquitectura de Servicios](./ARQUITECTURA-SERVICIOS-DOMINIO.md)

### Para implementar un nuevo service:
1. Lee [Ejemplo de Implementación](./IMPLEMENTACION-EJEMPLO-SUPPLIER-SERVICE.md)
2. Copia el patrón de `supplierService.js`
3. Adapta para tu entidad específica

### Para migrar componentes:
1. Revisa [Plan de Implementación](./PLAN-IMPLEMENTACION-SERVICIOS-DOMINIO.md)
2. Sigue las fases definidas
3. Valida cada cambio antes de continuar

---

## 📅 Estado del Proyecto

**Última actualización:** Enero 2025

**Estado:** 
- ✅ Fases 1-5 completadas (27 servicios de dominio creados)
- ⏳ Fase 6 en progreso: Integración con Vercel AI Chatbot

**Próximos pasos:**
- Implementar integración con Vercel AI Chatbot (ver [Plan de Integración](./PLAN-INTEGRACION-VERCEL-AI-CHATBOT.md))
- Crear tools/functions que conecten el AI con los servicios de dominio
- Crear UI del chat

---

## 🔗 Referencias Relacionadas

- [API References](../API-references/README.md) - Contratos de la API backend
- [Análisis API Frontend Backend](../ANALISIS-API-FRONTEND-BACKEND.md) - Análisis de inconsistencias
- [Documentación de Servicios API v2](../07-SERVICIOS-API-V2.md) - Documentación de servicios existentes

---

**Nota:** Este directorio contiene documentación específica de la refactorización. Para documentación general del proyecto, consulta el directorio raíz `/docs/`.


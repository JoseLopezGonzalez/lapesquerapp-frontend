# Arquitectura de Servicios de Dominio

Este directorio contiene toda la documentación relacionada con la refactorización de la arquitectura de servicios para preparar la integración con Vercel AI Chat.

---

## 📚 Documentos

### 🎯 [TODO Unificado](./00-todo-unificado.md) ⭐ **START HERE**

Documento que unifica todos los TODOs de los demás documentos en un solo lugar. Incluye estado de progreso, próximos pasos y tareas organizadas por fases.

**📌 Consulta esto primero** para ver qué hacer a continuación y seguir el progreso.

### 1. [Resumen Ejecutivo](./03-resumen-arquitectura-servicios.md)

Resumen completo del estado actual, lo que se ha completado y próximos pasos.

**📌 Comienza aquí** si quieres una visión general rápida.

### 2. [Arquitectura de Servicios de Dominio](./01-arquitectura-servicios-dominio.md)

Documento principal que describe los principios arquitectónicos, estructura propuesta y restricciones.

**📖 Lee esto** para entender la arquitectura completa y los principios de diseño.

### 3. [Próximos Pasos](./02-proximos-pasos.md)

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

1. Lee [Resumen Ejecutivo](./03-resumen-arquitectura-servicios.md)
2. Revisa [Arquitectura de Servicios](./01-arquitectura-servicios-dominio.md)

### Para implementar un nuevo service:

1. Revisa el patrón de servicios existentes en `/src/services/domain/`
2. Usa `supplierService.js` como referencia: `/src/services/domain/suppliers/supplierService.js`
3. Sigue el patrón establecido: métodos semánticos que usan servicios genéricos internamente

### Para ver el estado actual:

1. Revisa [TODO Unificado](./00-todo-unificado.md) para ver el estado de completitud
2. Consulta [Próximos Pasos](./02-proximos-pasos.md) para futuras mejoras

---

## 📅 Estado del Proyecto

**Última actualización:** Enero 2025

**Estado:**

- ✅ Fases 1-5 completadas (27 servicios de dominio creados)
- ✅ Chat AI integrado y funcionando (ver [Documentación del Chat AI](../chat-ai/README.md))

**Próximos pasos:**

- Ver [Próximos Pasos](./02-proximos-pasos.md) para próximas mejoras

---

## 🔗 Referencias Relacionadas

### Documentación del Chat AI

- **[Documentación del Chat AI](../chat-ai/README.md)** - Toda la documentación específica del sistema de Chat AI

### Otra Documentación

- [API References](../API-references/README.md) - Contratos de la API backend
- [Documentación de Servicios API v2](../07-servicios-api-v2.md) - Documentación de servicios existentes

---

**Nota:** Este directorio contiene documentación específica de la refactorización. Para documentación general del proyecto, consulta el directorio raíz `/docs/`.

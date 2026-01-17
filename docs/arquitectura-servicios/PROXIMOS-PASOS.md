# Próximos Pasos - Después de Fases 1-5

**Fecha:** Enero 2025  
**Estado Actual:** Todas las fases de refactorización completadas ✅

---

## 🎯 Objetivo Original

Preparar la base del proyecto para integrar un **AI Chat (Vercel AI)** sin romper la lógica existente.

**Estado:** ✅ **Base preparada** - Los servicios de dominio están listos para ser usados como tools/functions por Vercel AI.

---

## 📋 Opciones de Próximos Pasos

### Opción 1: Integración con Vercel AI Chat ⭐ **RECOMENDADO**

**Objetivo:** Integrar Vercel AI SDK y crear tools/functions que usen los servicios de dominio.

**Tareas:**
1. Instalar Vercel AI SDK
   ```bash
   npm install ai @ai-sdk/openai
   ```
2. Crear estructura de tools/functions
   - Crear `/src/lib/ai/tools/` para definir las herramientas
   - Cada tool mapeará a un método de un service de dominio
3. Crear tools para servicios principales:
   - `listSuppliers`, `getSupplier`, `createSupplier`, `updateSupplier`, `deleteSupplier`
   - Similar para otras entidades principales
4. Crear API route para el chat
   - `/src/app/api/chat/route.js`
5. Crear componente de UI para el chat
   - Integrar con Vercel AI SDK

**Beneficios:**
- ✅ Cumple el objetivo original del proyecto
- ✅ Los servicios de dominio están listos para esto
- ✅ El AI Chat nunca conoce URLs ni endpoints (como se diseñó)

**Prioridad:** Alta - Es el objetivo original del proyecto

---

### Opción 2: Limpieza y Optimización

**Objetivo:** Eliminar código antiguo y optimizar la estructura.

**Tareas:**
1. **Validar que no hay usos de servicios genéricos originales:**
   - Verificar que ningún componente usa `entityService.js`, `createEntityService.js`, `editEntityService.js` de la raíz
   - Buscar imports y eliminar si no se usan

2. **Eliminar servicios genéricos originales:**
   - `/src/services/entityService.js` (si ya no se usa)
   - `/src/services/createEntityService.js` (si ya no se usa)
   - `/src/services/editEntityService.js` (si ya no se usa)

3. **Eliminar funciones de compatibilidad:**
   - Limpiar funciones de compatibilidad en servicios de dominio (ej: `getSuppliersOptions`, `getSupplier`, etc.)
   - Solo mantener si hay componentes que aún las usan

4. **Optimizar imports:**
   - Verificar que todos los imports usan rutas correctas
   - Eliminar imports no usados

**Beneficios:**
- ✅ Código más limpio
- ✅ Menos confusión entre servicios antiguos y nuevos
- ✅ Reduce tamaño del bundle

**Prioridad:** Media - Mejora la calidad pero no es crítico

---

### Opción 3: Testing y Validación Extendida

**Objetivo:** Asegurar que todo funciona correctamente con pruebas.

**Tareas:**
1. **Testing manual de componentes migrados:**
   - Probar `EntityClient` con diferentes entidades
   - Probar `CreateEntityForm` con diferentes configuraciones
   - Probar `EditEntityForm` con diferentes configuraciones

2. **Validar servicios de dominio:**
   - Probar cada método de cada servicio
   - Verificar manejo de errores
   - Verificar autenticación

3. **Testing de integración:**
   - Probar flujo completo: listar → crear → editar → eliminar
   - Probar con diferentes entidades

4. **Crear tests automatizados:**
   - Unit tests para servicios de dominio
   - Integration tests para componentes
   - E2E tests para flujos completos

**Beneficios:**
- ✅ Confianza en la estabilidad
- ✅ Detección temprana de bugs
- ✅ Documentación implícita de cómo funciona

**Prioridad:** Alta - Importante antes de producción

---

### Opción 4: Extensión de Servicios

**Objetivo:** Agregar más servicios de dominio o métodos específicos.

**Tareas:**
1. **Revisar `entitiesConfig.js` para entidades sin servicio:**
   - Identificar entidades que usan `EntityClient` pero no tienen servicio de dominio
   - Crear servicios faltantes

2. **Agregar métodos específicos a servicios existentes:**
   - Por ejemplo: `storeService.getStockStats()` ya existe
   - Agregar métodos específicos de negocio según necesidad

3. **Crear servicios para módulos específicos:**
   - `orderService` - Ya existe pero podría mejorarse
   - `productionService` - Revisar y potencialmente refactorizar
   - Otros servicios específicos

**Beneficios:**
- ✅ Cobertura completa de todas las entidades
- ✅ Métodos específicos de negocio disponibles
- ✅ Consistencia en toda la aplicación

**Prioridad:** Media - Mejora pero no es crítico si las entidades actuales funcionan

---

### Opción 5: Documentación Adicional

**Objetivo:** Mejorar la documentación para desarrolladores.

**Tareas:**
1. **Guía de uso para desarrolladores:**
   - Cómo crear un nuevo servicio de dominio
   - Cómo usar servicios de dominio en componentes
   - Ejemplos prácticos

2. **Documentar cada servicio de dominio:**
   - Generar documentación automática desde JSDoc
   - Crear ejemplos de uso para cada método

3. **Actualizar README principal:**
   - Incluir información sobre la nueva arquitectura
   - Guías de contribución

**Beneficios:**
- ✅ Onboarding más fácil para nuevos desarrolladores
- ✅ Referencia rápida para desarrollo
- ✅ Mejor mantenibilidad a largo plazo

**Prioridad:** Baja - Mejora pero no bloquea funcionalidad

---

## 🎯 Recomendación: Orden Sugerido

### Fase 6: Integración Vercel AI Chatbot Template ⭐ **PRIMERO**

**Razón:** Es el objetivo original del proyecto. Los servicios de dominio fueron diseñados específicamente para esto.

**Plan Detallado:** Ver [PLAN-INTEGRACION-VERCEL-AI-CHATBOT.md](./PLAN-INTEGRACION-VERCEL-AI-CHATBOT.md)

**Resumen de Pasos:**
1. Instalar Vercel AI SDK y dependencias
2. Configurar variables de entorno (API keys, modelo, etc.)
3. Crear estructura de tools que mapeen a servicios de dominio
4. Crear API route `/api/chat` con AI SDK
5. Crear componente UI del chat (basado en shadcn/ui)
6. Testing y validación de tools y flujos

**Template Base:** [Next.js AI Chatbot](https://vercel.com/templates/next.js/nextjs-ai-chatbot)

### Fase 7: Testing y Validación

**Razón:** Importante validar que todo funciona antes de hacer limpieza.

**Pasos:**
1. Testing manual de funcionalidad
2. Validar servicios individualmente
3. Probar flujos completos

### Fase 8: Limpieza

**Razón:** Después de validar que todo funciona, se puede limpiar código antiguo con seguridad.

**Pasos:**
1. Verificar usos de servicios antiguos
2. Eliminar servicios genéricos originales si no se usan
3. Limpiar funciones de compatibilidad

### Opcionales (después):

- **Extensión de Servicios:** Según necesidad
- **Documentación Adicional:** Mejora continua

---

## 📊 Estado de Preparación para AI Chat

### ✅ Listo

- ✅ 27 servicios de dominio con métodos semánticos (18 originales + 8 nuevos + 1 wrapper)
- ✅ Contratos estables y predecibles
- ✅ Sin dependencias de URLs o endpoints en la interfaz
- ✅ Mapper para obtener servicios por nombre de entidad
- ✅ Autenticación centralizada (`getAuthToken`)

### 🔧 Necesario para AI Chat

- ⏳ Instalar Vercel AI SDK
- ⏳ Crear tools/functions que mapeen métodos de servicios a tools de AI
- ⏳ Crear API route para el chat
- ⏳ Crear componente UI del chat
- ⏳ Configurar modelo de AI (OpenAI, Anthropic, etc.)

---

## 💡 Ejemplo de cómo se vería la integración

### Tool Definition (ejemplo)

```javascript
// src/lib/ai/tools/supplierTools.js
import { supplierService } from '@/services/domain/suppliers/supplierService';

export const supplierTools = {
  listSuppliers: {
    description: 'Lista todos los proveedores con filtros opcionales',
    parameters: {
      filters: { type: 'object', optional: true },
      pagination: { type: 'object', optional: true }
    },
    execute: async ({ filters, pagination }) => {
      return await supplierService.list(filters || {}, pagination || {});
    }
  },
  getSupplier: {
    description: 'Obtiene un proveedor por ID',
    parameters: {
      id: { type: 'number', required: true }
    },
    execute: async ({ id }) => {
      return await supplierService.getById(id);
    }
  },
  // ... más tools
};
```

---

## ❓ ¿Qué prefieres hacer primero?

1. **Integración con Vercel AI Chat** - Objetivo original
2. **Testing y Validación** - Asegurar estabilidad
3. **Limpieza** - Remover código antiguo
4. **Otra cosa** - Dime qué necesitas

---

**Nota:** Todas las opciones son válidas, pero recomendamos empezar con la integración de AI Chat ya que es el objetivo original y los servicios están diseñados para eso.


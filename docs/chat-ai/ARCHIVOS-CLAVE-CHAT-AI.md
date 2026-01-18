# Archivos Clave del Chat AI - La PesquerApp

Este documento lista los archivos más importantes del sistema de Chat AI, explicando qué hace cada uno y su importancia.

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.js                    ⭐ CRÍTICO: API Route del chat
│
├── lib/
│   └── ai/
│       ├── config.js                       ⭐ CRÍTICO: System prompt y configuración
│       └── tools/
│           ├── index.js                    ⭐ CRÍTICO: Registro central de todas las tools
│           ├── entityTools.js              ⭐ CRÍTICO: Tools genéricas para entidades
│           └── orderTools.js               ⭐ CRÍTICO: Tools específicas de pedidos
│
├── components/
│   └── AI/
│       ├── ChatButton.js                   🔹 Importante: Botón para abrir el chat
│       └── Chat/
│           ├── index.js                    🔹 Importante: Componente principal del chat
│           ├── MessageList.js              🔹 Importante: Renderiza los mensajes
│           └── MessageInput.js             🔹 Importante: Input para escribir mensajes
│
└── lib/
    └── utils/
        └── getUserAgent.js                 🔸 Utilidad: Helper para User-Agent
```

---

## ⭐ Archivos CRÍTICOS (Configuración y Lógica Principal)

### 1. **`src/app/api/chat/route.js`** ⭐⭐⭐
**¿Qué hace?**
- API Route de Next.js que maneja todas las peticiones del chat
- Autentica al usuario usando NextAuth
- Configura el modelo de OpenAI (GPT-5)
- Registra las tools y las ejecuta
- Maneja el flujo de DOS PASOS (tool → IA → texto) con `stopWhen: stepCountIs(5)`
- Devuelve el stream de respuestas usando `toUIMessageStreamResponse()`

**Configuración clave:**
- `maxSteps: 10` - Límite máximo de pasos
- `stopWhen: stepCountIs(5)` - Activa multi-step tool loop
- `sendToolResultMessages: true` - Permite que el SDK envíe tool results + mensaje final

**Importancia:** Sin este archivo, el chat no funciona. Es el "cerebro" del sistema.

---

### 2. **`src/lib/ai/config.js`** ⭐⭐⭐
**¿Qué hace?**
- Define el `SYSTEM_PROMPT` que instruye al AI sobre su comportamiento
- Describe el flujo de DOS PASOS obligatorio (tool → texto)
- Explica el contexto del negocio (ERP pesquero)
- Define reglas sobre cómo usar las herramientas

**Contenido clave:**
```javascript
export const SYSTEM_PROMPT = `Eres un asistente AI integrado en La PesquerApp...
[Instrucciones detalladas sobre comportamiento, flujo de dos pasos, ejemplos, etc.]
`;
```

**Importancia:** El `SYSTEM_PROMPT` es lo que hace que el AI:
- Entienda el contexto del ERP
- Sepa cómo usar las tools
- **Genere texto después de ejecutar tools** (flujo de DOS PASOS)

---

### 3. **`src/lib/ai/tools/index.js`** ⭐⭐⭐
**¿Qué hace?**
- Registro central de TODAS las tools disponibles para el AI
- Combina tools genéricas (`entityTools`) con tools específicas (`orderTools`)
- Exporta `allTools` que se usa en `route.js`

**Estructura:**
```javascript
import { entityTools } from './entityTools';
import { orderTools } from './orderTools';

export const allTools = {
  ...entityTools,    // Tools genéricas (listEntities, getEntity, etc.)
  ...orderTools,     // Tools específicas de pedidos (getActiveOrders, etc.)
};
```

**Importancia:** Es el "catálogo" de herramientas. Todas las tools deben estar registradas aquí para que el AI las pueda usar.

---

### 4. **`src/lib/ai/tools/entityTools.js`** ⭐⭐⭐
**¿Qué hace?**
- Define tools GENÉRICAS que funcionan con CUALQUIER entidad
- Tools disponibles:
  - `listEntities` - Lista cualquier entidad (suppliers, customers, products, etc.)
  - `getEntity` - Obtiene detalles de una entidad por ID
  - `getEntityOptions` - Obtiene opciones para autocompletado

**Ejemplo de uso:**
```javascript
// El AI puede usar:
listEntities({ entityType: 'suppliers', search: 'pescado' })
getEntity({ entityType: 'customers', id: 123 })
```

**Importancia:** Permite al AI interactuar con TODAS las entidades del sistema sin necesidad de crear una tool por cada una.

**Internamente usa:**
- `entityServiceMapper.js` - Para obtener el service correcto
- Services de dominio - Para hacer las peticiones reales

---

### 5. **`src/lib/ai/tools/orderTools.js`** ⭐⭐⭐
**¿Qué hace?**
- Define tools ESPECÍFICAS para el dominio de pedidos (orders)
- Tools disponibles:
  - `getActiveOrders` - Lista pedidos activos (pending)
  - `getOrderRankingStats` - Estadísticas de ranking de pedidos
  - `getSalesBySalesperson` - Ventas por vendedor

**Ejemplo de uso:**
```javascript
// El AI puede usar:
getActiveOrders()  // Sin parámetros
getOrderRankingStats({ dateFrom: '2026-01-01', dateTo: '2026-01-31' })
```

**Importancia:** Demuestra cómo crear tools específicas de negocio con lógica compleja.

**Internamente usa:**
- `orderService.getActiveOrders()` - Service de dominio

---

## 🔹 Archivos Importantes (UI y Componentes)

### 6. **`src/components/AI/Chat/index.js`** 🔹🔹
**¿Qué hace?**
- Componente principal del chat UI
- Usa `useChat` de `@ai-sdk/react` para manejar el estado del chat
- Maneja el input manualmente (AI SDK v3+ no lo proporciona directamente)
- Integra `MessageList` y `MessageInput`

**Configuración clave:**
```javascript
const { messages, sendMessage, status, error } = useChat({
  api: '/api/chat',
  maxSteps: 10,  // Debe coincidir con el servidor
});
```

**Importancia:** Es la interfaz que el usuario ve. Sin esto, no hay UI.

---

### 7. **`src/components/AI/Chat/MessageList.js`** 🔹🔹
**¿Qué hace?**
- Renderiza la lista de mensajes del chat
- Maneja `message.parts` según la documentación oficial de AI SDK v6
- Diferencia entre mensajes de usuario y assistant
- Muestra tool invocations y tool results

**Renderizado según doc oficial:**
- `part.type === 'text'` → Muestra texto
- `part.type === 'tool-call'` → Muestra "Consultando..."
- `part.type === 'tool-result'` → Muestra resultado (JSON colapsable)

**Importancia:** Sin esto, los mensajes no se mostrarían en la UI.

---

### 8. **`src/components/AI/Chat/MessageInput.js`** 🔹
**¿Qué hace?**
- Input para escribir mensajes
- Maneja `onSubmit` y `onKeyDown` (Enter)
- Validación para evitar envío de mensajes vacíos

**Importancia:** Permite al usuario escribir y enviar mensajes.

---

### 9. **`src/components/AI/ChatButton.js`** 🔹
**¿Qué hace?**
- Botón reutilizable para abrir el chat
- Puede usarse como botón standalone o como `DropdownMenuItem`
- Gestiona el estado del Dialog modal

**Importancia:** Proporciona el punto de entrada al chat desde el UI.

---

## 🔸 Archivos de Soporte

### 10. **`src/lib/auth/getAuthToken.js`** 🔸🔸
**¿Qué hace?**
- Helper centralizado para obtener el token de autenticación
- Soporta cliente (NextAuth session) y servidor (contexto global)
- Funciones: `getAuthToken()`, `setServerTokenContext()`, `clearServerTokenContext()`

**Importancia:** CRÍTICO para que las tools puedan autenticarse cuando se ejecutan desde el servidor (AI Chat).

---

### 11. **`src/lib/utils/getUserAgent.js`** 🔸
**¿Qué hace?**
- Helper para obtener User-Agent compatible con cliente y servidor
- En cliente: `navigator.userAgent`
- En servidor: `'Node.js/LaPesquerApp-Server'`

**Importancia:** Permite que los services funcionen tanto en cliente como en servidor.

---

### 12. **`src/services/domain/entityServiceMapper.js`** 🔸🔸
**¿Qué hace?**
- Mapea nombres de entidades a sus services de dominio correspondientes
- Usado por `entityTools.js` para obtener el service correcto dinámicamente

**Ejemplo:**
```javascript
getEntityService('suppliers') → supplierService
getEntityService('orders') → orderService
```

**Importancia:** Permite que las tools genéricas funcionen con cualquier entidad.

---

## 📋 Resumen por Prioridad

### **Nivel 1: CRÍTICOS** (No modificar sin entender el impacto)
1. `src/app/api/chat/route.js` - API Route principal
2. `src/lib/ai/config.js` - System prompt
3. `src/lib/ai/tools/index.js` - Registro de tools
4. `src/lib/ai/tools/entityTools.js` - Tools genéricas
5. `src/lib/ai/tools/orderTools.js` - Tools específicas

### **Nivel 2: IMPORTANTES** (Modificar con cuidado)
6. `src/components/AI/Chat/index.js` - Componente principal UI
7. `src/components/AI/Chat/MessageList.js` - Renderizado de mensajes
8. `src/lib/auth/getAuthToken.js` - Autenticación

### **Nivel 3: SOPORTE** (Modificar según necesidades)
9. `src/components/AI/Chat/MessageInput.js` - Input de mensajes
10. `src/components/AI/ChatButton.js` - Botón del chat
11. `src/services/domain/entityServiceMapper.js` - Mapper de services
12. `src/lib/utils/getUserAgent.js` - Helper User-Agent

---

## 🎯 Dónde Hacer Cambios Comunes

### Para cambiar el comportamiento del AI:
👉 **`src/lib/ai/config.js`** (System prompt)

### Para añadir una nueva tool:
1. Crear/editar tool en `src/lib/ai/tools/`
2. Registrar en `src/lib/ai/tools/index.js`

### Para cambiar el modelo de AI:
👉 **`.env.local`** → `AI_MODEL=gpt-5-mini`

### Para cambiar la UI del chat:
👉 **`src/components/AI/Chat/`**

### Para cambiar cómo se ejecutan las tools:
👉 **`src/app/api/chat/route.js`** (registro de tools, `maxSteps`, `stopWhen`)

---

## 📚 Documentación Relacionada

- `docs/arquitectura-servicios/IMPLEMENTACION-CHAT-AI-COMPLETA.md` - Implementación completa
- `docs/arquitectura-servicios/PLAN-INTEGRACION-VERCEL-AI-CHATBOT.md` - Plan de integración
- `docs/arquitectura-servicios/INTEGRACION-AI-CHAT-COMPLETADA.md` - Resumen de integración

---

**Última actualización:** Enero 2025


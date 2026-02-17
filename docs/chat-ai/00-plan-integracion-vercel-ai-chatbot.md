# Plan de Integración: Vercel AI Chatbot Template

**Fecha:** Enero 2025  
**Estado:** Pendiente de implementación  
**Template Base:** [Next.js AI Chatbot](https://vercel.com/templates/next.js/nextjs-ai-chatbot)  
**Referencia GitHub:** [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot)

---

## 🎯 Objetivo

Integrar el template de Vercel AI Chatbot en el proyecto La PesquerApp, conectándolo con los 27 servicios de dominio existentes mediante tools/functions del AI SDK.

---

## 📋 Qué ofrece el Template

### Componentes Clave del Template

1. **Next.js App Router**
   - Server Components (RSCs) y Server Actions
   - Routing avanzado

2. **Vercel AI SDK**
   - API unificada para generar texto, objetos estructurados, tool calls
   - Soporte para múltiples proveedores: xAI (default), OpenAI, Anthropic, Fireworks, etc.
   - Streaming de respuestas
   - Hooks para UI generativa

3. **UI con shadcn/ui**
   - Componentes accesibles (Radix UI)
   - Styling con Tailwind CSS
   - Ya compatible con nuestro proyecto (tenemos shadcn/ui instalado)

4. **Persistencia**
   - Neon Serverless Postgres (o Vercel Postgres) para historial de chats
   - Vercel Blob para almacenamiento de archivos

5. **Autenticación**
   - Auth.js / NextAuth.js (ya lo tenemos instalado)

### AI Gateway (Vercel)

El template usa Vercel AI Gateway por defecto, que permite:
- Acceso unificado a múltiples modelos
- Autenticación automática vía OIDC en deployments de Vercel
- Para deployments locales: requiere `AI_GATEWAY_API_KEY` en `.env.local`

---

## 🏗️ Arquitectura de Integración

### Diagrama de Flujo

```
Usuario → UI Chat → API Route (/api/chat) → AI SDK
                                        ↓
                          Tools (functions) → Servicios de Dominio
                                        ↓
                                    Backend Laravel
```

### Componentes Clave

1. **API Route** (`/src/app/api/chat/route.js`)
   - Recibe mensajes del usuario
   - Invoca AI SDK con tools configuradas
   - Devuelve streaming de respuestas

2. **Tools Registry** (`/src/lib/ai/tools/`)
   - Define todas las tools disponibles para el AI
   - Cada tool mapea a métodos de servicios de dominio

3. **Servicios de Dominio** (ya existentes)
   - 27 servicios listos para ser usados como tools
   - Métodos semánticos de negocio
   - Sin dependencias de URLs/endpoints

4. **UI Component** (`/src/components/AI/Chat`)
   - Interfaz de chat basada en shadcn/ui
   - Integración con AI SDK hooks

---

## 📦 Dependencias a Instalar

### Dependencias del AI SDK

```bash
npm install ai @ai-sdk/openai
# O según el proveedor que uses:
# npm install ai @ai-sdk/anthropic
# npm install ai @ai-sdk/google
```

### Dependencias Opcionales (según template)

```bash
# Si usas Neon Postgres (ya tenemos NextAuth, pero podríamos necesitar adaptador)
npm install @vercel/postgres  # O @neondatabase/serverless si usas Neon

# Si usas Vercel Blob para archivos
npm install @vercel/blob
```

---

## 🔧 Plan de Implementación Paso a Paso

### Fase 1: Setup Inicial (Día 1)

#### 1.1 Instalar Dependencias

```bash
cd /home/jose/brisapp-nextjs
npm install ai @ai-sdk/openai zod
# zod es necesario para validar parámetros de tools
```

#### 1.2 Configurar Variables de Entorno

Crear/actualizar `.env.local`:

```env
# AI Configuration
OPENAI_API_KEY=tu_api_key_aqui
# O si usas AI Gateway
AI_GATEWAY_API_KEY=tu_api_key_aqui

# Opcional: Configuración de modelo
AI_MODEL=gpt-4-turbo-preview
# O para usar AI Gateway con xAI (default del template)
AI_GATEWAY_MODEL=grok-2-vision-1212

# Database (si vamos a usar Postgres para historial de chat)
DATABASE_URL=postgresql://...
```

#### 1.3 Crear Estructura de Carpetas

```
src/
  lib/
    ai/
      tools/
        index.js           # Registry de todas las tools
        entityTools.js     # Tools genéricas para entidades
        orderTools.js      # Tools específicas de orders
        supplierTools.js   # Tools específicas de suppliers
        ...
      config.js            # Configuración del AI SDK
  components/
    AI/
      Chat/
        index.js           # Componente principal del chat
        MessageList.js     # Lista de mensajes
        MessageInput.js    # Input para enviar mensajes
  app/
    api/
      chat/
        route.js           # API route para el chat
```

---

### Fase 2: Crear Tools Registry (Días 2-3)

#### 2.1 Tool Genérica para Entidades

Crear `/src/lib/ai/tools/entityTools.js`:

```javascript
import { getEntityService } from '@/services/domain/entityServiceMapper';
import { z } from 'zod'; // npm install zod

/**
 * Tools genéricas para operaciones CRUD en cualquier entidad
 * Usa el entityServiceMapper para obtener el servicio correcto dinámicamente
 */
export const entityTools = {
  listEntities: {
    description: 'Lista entidades de un tipo específico con filtros opcionales. Entidades disponibles: suppliers, orders, customers, products, etc.',
    parameters: z.object({
      entityType: z.string().describe('Tipo de entidad (ej: suppliers, orders, customers)'),
      filters: z.object({
        search: z.string().optional(),
        ids: z.array(z.number()).optional(),
        // ... otros filtros según entidad
      }).optional(),
      pagination: z.object({
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(12),
      }).optional(),
    }),
    execute: async ({ entityType, filters = {}, pagination = {} }) => {
      const service = getEntityService(entityType);
      if (!service) {
        throw new Error(`No se encontró servicio para la entidad: ${entityType}`);
      }
      return await service.list(filters, pagination);
    },
  },

  getEntity: {
    description: 'Obtiene una entidad específica por ID',
    parameters: z.object({
      entityType: z.string(),
      id: z.number(),
    }),
    execute: async ({ entityType, id }) => {
      const service = getEntityService(entityType);
      if (!service) {
        throw new Error(`No se encontró servicio para la entidad: ${entityType}`);
      }
      return await service.getById(id);
    },
  },

  // ... más tools genéricas según necesidad
};
```

#### 2.2 Tools Específicas (Opcional, para lógica de negocio compleja)

Crear `/src/lib/ai/tools/orderTools.js`:

```javascript
import { orderService } from '@/services/domain/orders/orderService';
import { z } from 'zod';

/**
 * Tools específicas para Orders (Pedidos)
 * Incluye métodos de negocio específicos que no son genéricos
 */
export const orderTools = {
  getActiveOrders: {
    description: 'Obtiene la lista de pedidos activos',
    parameters: z.object({}),
    execute: async () => {
      return await orderService.getActiveOrders();
    },
  },

  getOrderRankingStats: {
    description: 'Obtiene estadísticas de ranking de pedidos',
    parameters: z.object({
      groupBy: z.string().optional(),
      valueType: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      speciesId: z.number().optional(),
    }),
    execute: async (params) => {
      return await orderService.getRankingStats(params);
    },
  },

  // ... más tools específicas de orders
};
```

#### 2.3 Registry Principal

Crear `/src/lib/ai/tools/index.js`:

```javascript
import { entityTools } from './entityTools';
import { orderTools } from './orderTools';
// ... importar más tools específicas si las hay

/**
 * Registry de todas las tools disponibles para el AI
 */
export const allTools = {
  ...entityTools,
  ...orderTools,
  // ... agregar más tools aquí
};

/**
 * Genera el array de tools para el AI SDK
 */
export function getTools() {
  return Object.entries(allTools).map(([name, tool]) => ({
    type: 'function',
    function: {
      name,
      description: tool.description,
      parameters: tool.parameters, // Zod schema
    },
  }));
}
```

---

### Fase 3: Crear API Route (Día 3)

#### 3.1 API Route Básica

Crear `/src/app/api/chat/route.js`:

```javascript
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { allTools } from '@/lib/ai/tools';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/chat
 * 
 * API route para el chat AI. Usa Vercel AI SDK con tools.
 */
export async function POST(req) {
  try {
    // Verificar autenticación
    const token = await getAuthToken();
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    // Convertir tools a formato del AI SDK
    const tools = {};
    for (const [name, toolDef] of Object.entries(allTools)) {
      tools[name] = tool({
        description: toolDef.description,
        parameters: toolDef.parameters,
        execute: async (params) => {
          try {
            // Ejecutar la tool con manejo de errores
            const result = await toolDef.execute(params);
            return result;
          } catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            return {
              error: true,
              message: error.message || 'Error ejecutando la herramienta',
            };
          }
        },
      });
    }

    // Generar respuesta con streaming
    const result = streamText({
      model: openai('gpt-4-turbo-preview'), // O el modelo que configures
      messages,
      tools,
      maxSteps: 5, // Número máximo de tool calls en una respuesta
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### 3.2 Sistema Prompt Inicial (Opcional pero recomendado)

Agregar system prompt para dar contexto al AI:

```javascript
const systemPrompt = `Eres un asistente AI para el sistema ERP La PesquerApp. 
Puedes ayudar con:
- Consultar información de entidades (pedidos, clientes, proveedores, productos, etc.)
- Obtener estadísticas y reportes
- Responder preguntas sobre el sistema

Usa las herramientas disponibles para acceder a la información del sistema.
Sé conciso y claro en tus respuestas.`;

// En streamText:
const result = streamText({
  model: openai('gpt-4-turbo-preview'),
  system: systemPrompt,
  messages,
  tools,
  maxSteps: 5,
});
```

---

### Fase 4: Crear Componente UI (Días 4-5)

#### 4.1 Componente Principal del Chat

Crear `/src/components/AI/Chat/index.js`:

```javascript
'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-full max-h-[600px] border rounded-lg">
      <ScrollArea className="flex-1 p-4">
        <MessageList messages={messages} />
      </ScrollArea>
      <div className="border-t p-4">
        <MessageInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
```

#### 4.2 Componentes Auxiliares

Crear `/src/components/AI/Chat/MessageList.js`:

```javascript
'use client';

export function MessageList({ messages }) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            {message.toolInvocations && (
              <div className="mt-2 text-xs opacity-70">
                {message.toolInvocations.map((invocation) => (
                  <div key={invocation.toolCallId}>
                    Llamando: {invocation.toolName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

Crear `/src/components/AI/Chat/MessageInput.js`:

```javascript
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function MessageInput({ input, handleInputChange, handleSubmit, isLoading }) {
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={input}
        onChange={handleInputChange}
        placeholder="Escribe tu mensaje..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar'}
      </Button>
    </form>
  );
}
```

#### 4.3 Integrar en una Página

Crear `/src/app/admin/ai-chat/page.js`:

```javascript
import { Chat } from '@/components/AI/Chat';

export default function AIChatPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Asistente AI</h1>
      <Chat />
    </div>
  );
}
```

---

### Fase 5: Testing y Validación (Día 6)

#### 5.1 Testing Manual

1. **Probar tools básicas:**
   - "Lista los proveedores"
   - "Muéstrame el pedido con ID 123"
   - "¿Cuántos clientes tenemos?"

2. **Probar herramientas específicas:**
   - "Muéstrame los pedidos activos"
   - "Dame estadísticas de ranking de pedidos"

3. **Probar manejo de errores:**
   - Entidad que no existe
   - ID inválido
   - Permisos insuficientes

#### 5.2 Validar Integración con Servicios

- Verificar que las tools llaman correctamente a los servicios de dominio
- Validar que los servicios devuelven datos correctos
- Confirmar que el AI puede interpretar y presentar los datos

---

### Fase 6: Mejoras y Optimizaciones (Día 7, Opcional)

#### 6.1 Persistencia de Chat (Opcional)

Si queremos guardar historial de conversaciones:

```javascript
// En /src/app/api/chat/route.js
import { saveChat, getChatHistory } from '@/lib/ai/db';

// Guardar mensajes después de la conversación
await saveChat(userId, messages);
```

#### 6.2 Permisos y Seguridad

- Validar permisos por usuario/rol antes de ejecutar tools
- Filtrar tools disponibles según rol
- Sanitizar inputs antes de enviar a tools

#### 6.3 UI Avanzada

- Indicadores de carga por tool
- Botones para acciones rápidas
- Historial de conversaciones anteriores

---

## 🔐 Consideraciones de Seguridad

### 1. Autenticación

- ✅ Ya validamos `getAuthToken()` en la API route
- Considerar validar también el rol del usuario

### 2. Permisos

Crear middleware para validar permisos por tool:

```javascript
// src/lib/ai/tools/permissions.js
export function canUseTool(userRole, toolName) {
  const permissions = {
    admin: ['*'], // Acceso a todo
    user: ['listEntities', 'getEntity'], // Solo lectura
  };
  return permissions[userRole]?.includes(toolName) || 
         permissions[userRole]?.includes('*');
}
```

### 3. Sanitización

- Los servicios de dominio ya validan inputs
- Aún así, validar tipos y rangos en las tools

### 4. Rate Limiting

Considerar agregar rate limiting para evitar abusos:

```javascript
// Usar biblioteca como next-rate-limit o implementar con Redis
```

---

## 📊 Estado de Preparación

### ✅ Listo

- ✅ 27 servicios de dominio con métodos semánticos
- ✅ Contratos estables y predecibles
- ✅ Sin dependencias de URLs o endpoints en la interfaz
- ✅ Mapper para obtener servicios por nombre de entidad
- ✅ Autenticación centralizada (`getAuthToken`)
- ✅ NextAuth.js instalado y configurado
- ✅ shadcn/ui instalado y disponible

### ⏳ Pendiente

- ⏳ Instalar Vercel AI SDK
- ⏳ Crear estructura de tools
- ⏳ Crear API route
- ⏳ Crear componente UI
- ⏳ Configurar variables de entorno
- ⏳ Testing y validación

---

## 🎯 Resultado Esperado

Después de completar este plan, tendremos:

1. **Chat AI funcional** integrado en La PesquerApp
2. **27 entidades disponibles** como tools para el AI
3. **Arquitectura limpia** que separa UI, AI SDK, tools y servicios de dominio
4. **Base sólida** para extender con más funcionalidades

---

## 📚 Recursos

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Template GitHub](https://github.com/vercel/ai-chatbot)
- [AI SDK Tools Guide](https://sdk.vercel.ai/docs/guides/tools)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## ❓ Próximos Pasos

1. **Revisar este plan** y ajustar según necesidades específicas
2. **Comenzar con Fase 1** (Setup inicial)
3. **Iterar** según feedback y necesidades

---

**Última actualización:** Enero 2025


# Implementación Completa del Chat AI - La PesquerApp

**Fecha:** Enero 2025  
**Versión:** 2.0 (Actualizada con correcciones críticas)  
**Estado:** Implementada con correcciones aplicadas

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Librerías y Versiones Utilizadas](#librerías-y-versiones-utilizadas)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Configuración e Instalación](#configuración-e-instalación)
5. [Implementación Detallada](#implementación-detallada)
6. [Flujo de Datos](#flujo-de-datos)
7. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
8. [Puntos Críticos y Correcciones](#puntos-críticos-y-correcciones)
9. [Validación y Pruebas](#validación-y-pruebas)

---

## 🎯 Resumen Ejecutivo

Se ha implementado un sistema de chat AI completo usando **Vercel AI SDK** (versión 6) integrado con **OpenAI** (GPT-5). El chat permite consultar información del ERP mediante "tools" (funciones) que conectan con los servicios de dominio.

**Características principales:**

- ✅ Chat con streaming en tiempo real
- ✅ Integración con servicios de dominio mediante tools
- ✅ Autenticación mediante NextAuth.js
- ✅ Interfaz de usuario con shadcn/ui
- ✅ Soporte para múltiples entidades del ERP

**⚠️ Notas importantes:**

- El SDK usa `prompt` (string) en lugar de `messages` cuando se usa con `useChat`
- **Zod v3** es obligatorio (v4 no es compatible)
- **GPT-5** es el modelo actual (GPT-4-turbo-preview ya no existe)
- Los schemas Zod **NO deben usar `.describe()`** (causa problemas con AI SDK v6)

---

## 📦 Librerías y Versiones Utilizadas

### Dependencias Core (CRÍTICAS)

```json
{
  "@ai-sdk/openai": "^3.0.12",
  "@ai-sdk/react": "^3.0.41",
  "ai": "^6.0.39",
  "zod": "^3.25.76" // ⚠️ CRÍTICO: Debe ser v3, NO v4
}
```

**⚠️ IMPORTANTE - Versiones críticas:**

1. **Zod v3 es obligatorio**: AI SDK v6 **NO** es compatible con Zod v4
   - El SDK usa `schema._def.typeName` que no existe en Zod v4
   - Con Zod v4, los schemas se interpretan como `type: None`

2. **GPT-5 es el modelo actual**: `gpt-4-turbo-preview` ya no existe en OpenAI Platform
   - Usar: `gpt-5-mini` (recomendado) o `gpt-5.2` (máxima calidad)

### Dependencias de UI

```json
{
  "next": "^16.0.7",
  "react": "19.0.0-rc-66855b96-20241106",
  "react-dom": "19.0.0-rc-66855b96-20241106",
  "lucide-react": "^0.475.0",
  "@radix-ui/react-scroll-area": "^1.2.3",
  "@radix-ui/react-dialog": "^1.1.6"
}
```

### Dependencias de Autenticación

```json
{
  "next-auth": "^4.24.13"
}
```

---

## 📁 Estructura de Archivos

```
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.js              # API Route del chat (backend)
├── components/
│   └── AI/
│       ├── Chat/
│       │   ├── index.js              # Componente principal del chat
│       │   ├── MessageList.js        # Lista de mensajes
│       │   └── MessageInput.js       # Input para escribir mensajes
│       └── ChatButton.js             # Botón para abrir el chat
├── lib/
│   └── ai/
│       ├── config.js                 # System prompt y configuración
│       └── tools/
│           ├── index.js              # Registry de todas las tools
│           ├── entityTools.js        # Tools genéricas para entidades
│           └── orderTools.js         # Tools específicas de pedidos
└── services/
    └── domain/                       # Servicios de dominio (usados por tools)
```

---

## ⚙️ Configuración e Instalación

### 1. Variables de Entorno

Crear o actualizar `.env.local`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-5-mini  # ⚠️ CRÍTICO: Usar GPT-5, NO gpt-4-turbo-preview

# NextAuth (si no está ya configurado)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### 2. Instalación de Dependencias

```bash
npm install @ai-sdk/openai@^3.0.12 @ai-sdk/react@^3.0.41 ai@^6.0.39 zod@^3.25.76
```

**⚠️ CRÍTICO:** Forzar Zod v3 en `package.json`:

```json
{
  "overrides": {
    "zod": "3.25.76"
  }
}
```

Luego verificar:

```bash
npm ls zod
```

Debe mostrar **SOLO** `zod@3.25.76`. Si aparece v4 o múltiples versiones:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔧 Implementación Detallada

### 1. API Route (`src/app/api/chat/route.js`)

**Función:** Maneja las peticiones del chat en el servidor.

#### Código completo (versión actualizada):

```javascript
import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToCoreMessages } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { allTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Debes iniciar sesión para usar el chat.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parsear mensajes del request
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Se requieren mensajes válidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. ✅ CORRECCIÓN DEFINITIVA: Convertir UIMessage[] a CoreMessage[] para mantener el historial completo
    // useChat envía UIMessage[] con formato { id, role, parts: [{ type: 'text', text: ... }] }
    // streamText espera CoreMessage[] (formato compatible con el protocolo del SDK)
    // convertToCoreMessages mantiene TODO el historial del chat (memoria del AI)
    // ⚠️ CRÍTICO: NO usar solo el último mensaje (prompt) - esto rompe la memoria del chat
    const coreMessages = convertToCoreMessages(messages);

    // 4. Convertir tools a formato del AI SDK con validación estricta
    const tools = {};
    for (const [name, toolDef] of Object.entries(allTools)) {
      // ✅ VALIDAR que parameters existe y es un ZodObject válido
      if (!toolDef.parameters || typeof toolDef.parameters.parse !== 'function') {
        console.error(`Tool ${name} has invalid parameters schema`, {
          hasParameters: !!toolDef.parameters,
          typeName: toolDef.parameters?._def?.typeName,
        });
        throw new Error(`Tool ${name} has invalid parameters schema`);
      }

      // ✅ Verificar que es un ZodObject (Zod v3)
      if (toolDef.parameters._def?.typeName !== 'ZodObject') {
        console.error(`Tool ${name} parameters is not a ZodObject`, {
          typeName: toolDef.parameters._def?.typeName,
        });
        throw new Error(
          `Tool ${name} parameters must be a ZodObject, got ${toolDef.parameters._def?.typeName}`
        );
      }

      tools[name] = tool({
        description: toolDef.description,
        parameters: toolDef.parameters,
        execute: async (params) => {
          try {
            const result = await toolDef.execute(params);
            // ✅ IMPORTANTE: Las tools deben devolver JSON puro, no strings
            return result;
          } catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            return {
              success: false,
              error: true,
              message: error.message || 'Error ejecutando la herramienta',
              tool: name,
            };
          }
        },
      });
    }

    // 5. Generar respuesta con streaming
    // ✅ CORRECCIÓN DEFINITIVA: Usar messages (historial completo) con convertToCoreMessages
    // Esto mantiene la memoria del chat y cumple con el esquema que espera streamText
    const aiModel = process.env.AI_MODEL || 'gpt-5-mini';

    const result = streamText({
      model: openai(aiModel),
      system: SYSTEM_PROMPT,
      messages: coreMessages, // ✅ Historial completo convertido a CoreMessage[]
      tools,
      maxSteps: 5,
      temperature: 0.7,
    });

    // 6. Devolver stream de respuesta
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);

    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### Puntos críticos:

1. **`convertToCoreMessages` para mantener el historial**: Con `useChat`, convertir `UIMessage[]` a `CoreMessage[]` mantiene la memoria del chat
2. **Validación de schemas**: Verificar que cada tool tenga un `ZodObject` válido antes de registrarlo
3. **Modelo GPT-5**: Usar `gpt-5-mini` o `gpt-5.2`, no `gpt-4-turbo-preview`
4. **`overrides` en package.json**: Forzar Zod v3 para evitar conflictos de versiones

---

### 2. Tools - Schema Correcto (`src/lib/ai/tools/entityTools.js`)

**⚠️ CRÍTICO:** Los schemas Zod **NO deben usar `.describe()`** en AI SDK v6 + Zod v3.

#### ❌ INCORRECTO (con `.describe()`):

```javascript
parameters: z.object({
  entityType: z.enum(AVAILABLE_ENTITIES, {
    description: 'Tipo de entidad...',  // ❌ Esto causa problemas
  }),
  filters: z.object({
    search: z.string().optional().describe('Texto de búsqueda'),  // ❌ NO usar
  }).optional().describe('Filtros'),  // ❌ NO usar
}),
```

#### ✅ CORRECTO (sin `.describe()`):

```javascript
import { z } from 'zod';

const AVAILABLE_ENTITIES = [
  'suppliers',
  'capture-zones',
  'fishing-gears',
  'cebo-dispatches',
  'activity-logs',
  'product-categories',
  'product-families',
  'payment-terms',
  'species',
  'transports',
  'taxes',
  'incoterms',
  'salespeople',
  'products',
  'employees',
  'customers',
  'stores',
  'raw-material-receptions',
  'orders',
  'boxes',
  'countries',
  'pallets',
  'productions',
  'punches',
  'roles',
  'sessions',
  'users',
];

export const entityTools = {
  listEntities: {
    description: `Lista entidades de un tipo específico con filtros opcionales. 
    
Entidades disponibles: ${AVAILABLE_ENTITIES.join(', ')}.`,

    parameters: z.object({
      entityType: z.enum(AVAILABLE_ENTITIES), // ✅ Sin .describe()
      filters: z
        .object({
          search: z.string().optional(),
          ids: z.array(z.number()).optional(),
          status: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
        })
        .optional(), // ✅ Sin .describe()
      pagination: z
        .object({
          page: z.number().optional().default(1),
          perPage: z.number().optional().default(12),
        })
        .optional(), // ✅ Sin .describe()
    }),

    execute: async ({ entityType, filters = {}, pagination = {} }) => {
      const service = getEntityService(entityType);
      if (!service) {
        throw new Error(`No se encontró servicio para la entidad: ${entityType}`);
      }

      const adaptedFilters = { ...filters };
      if (filters.dateFrom || filters.dateTo) {
        adaptedFilters.dates = {
          start: filters.dateFrom,
          end: filters.dateTo,
        };
        delete adaptedFilters.dateFrom;
        delete adaptedFilters.dateTo;
      }

      const result = await service.list(adaptedFilters, pagination);

      return {
        success: true,
        data: result.data || [],
        meta: result.meta || {},
        entityType,
      };
    },
  },
  // ... más tools
};
```

#### Ejemplo de tool con parámetros vacíos:

```javascript
getActiveOrders: {
  description: 'Obtiene la lista de pedidos activos',

  parameters: z.object({}), // ✅ CRÍTICO: SIEMPRE ZodObject directo, NUNCA .optional()

  execute: async () => {
    const orders = await orderService.getActiveOrders();
    return {
      success: true,
      data: Array.isArray(orders) ? orders : (orders?.data || []),
    };
  },
},
```

**⚠️ REGLA ABSOLUTA:** En AI SDK v6, `parameters` **NUNCA** puede ser opcional. Los campos dentro del objeto sí pueden ser opcionales, pero el objeto raíz `parameters` debe ser siempre `z.object({...})` directo, sin `.optional()`, `.default()`, u otros wrappers.

---

### 3. Componente Cliente (`src/components/AI/Chat/index.js`)

**Función:** Componente principal del chat en el frontend.

#### Código completo:

```javascript
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Bot } from 'lucide-react';

export function Chat() {
  // ⚠️ CRÍTICO: En @ai-sdk/react v3, useChat NO devuelve input/handleInputChange/handleSubmit
  // Necesitamos manejar el input manualmente
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
  });

  const isLoading = status === 'streaming' || status === 'in_progress';

  const handleInputChange = useCallback((e) => {
    setInput(e.target?.value || '');
  }, []);

  // ✅ CRÍTICO: sendMessage acepta { text: string }
  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      const message = input.trim();
      if (message && !isLoading) {
        sendMessage({ text: message }); // ✅ Formato correcto
        setInput('');
      }
    },
    [input, sendMessage, isLoading]
  );

  return (
    <div className="bg-background flex h-full max-h-[600px] flex-col rounded-lg border">
      <div className="flex items-center gap-2 border-b p-4">
        <Bot className="text-primary h-5 w-5" />
        <h2 className="text-lg font-semibold">Asistente AI - La PesquerApp</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center">
            <Bot className="mb-2 h-12 w-12 opacity-50" />
            <p className="text-sm">Hola, soy tu asistente AI para La PesquerApp.</p>
          </div>
        )}
        <MessageList messages={messages} isLoading={isLoading} />
      </ScrollArea>

      <div className="border-t p-4">
        {error && (
          <div className="text-destructive mb-2 text-sm">
            Error: {error.message || 'Ocurrió un error. Por favor intenta de nuevo.'}
          </div>
        )}
        <MessageInput
          input={input || ''}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
```

---

## 🔄 Flujo de Datos

### Flujo Completo de un Mensaje:

```
1. Usuario escribe en MessageInput
   ↓
2. Chat/index.js: handleSubmit() llama sendMessage({ text: message })
   ↓
3. useChat (@ai-sdk/react): Envía POST a /api/chat con UIMessage[]
   ↓
4. route.js: Recibe UIMessage[], extrae el texto del último mensaje del usuario
   ↓
5. route.js: Llama streamText() con prompt (string) y tools configuradas
   ↓
6. OpenAI (GPT-5): Procesa prompt y decide si usar tools
   ↓
7. route.js: Ejecuta tool.execute() → Llama servicio de dominio → Obtiene datos reales
   ↓
8. OpenAI: Recibe resultado de tool y genera respuesta
   ↓
9. route.js: Devuelve stream con toUIMessageStreamResponse()
   ↓
10. useChat: Recibe stream y actualiza messages[]
   ↓
11. MessageList: Renderiza mensajes actualizados
```

### Formato de Mensajes:

**UIMessage (cliente - useChat):**

```javascript
{
  id: string,
  role: 'user' | 'assistant',
  parts: Array<{
    type: 'text',
    text: string
  }>
}
```

**Prompt (servidor - streamText):**

```javascript
// String extraído del último mensaje del usuario
'Lista los proveedores';
```

---

## ⚠️ Problemas Encontrados y Soluciones

### Problema 1: Modelo inexistente

**Error:** Request inválida, modelo no encontrado  
**Causa:** `gpt-4-turbo-preview` ya no existe en OpenAI Platform  
**Solución:** Usar `gpt-5-mini` o `gpt-5.2`

```javascript
// ❌ Incorrecto
AI_MODEL = gpt - 4 - turbo - preview;

// ✅ Correcto
AI_MODEL = gpt - 5 - mini;
```

---

### Problema 2: Error "Invalid prompt: The messages do not match the ModelMessage[] schema"

**Error:** "Invalid prompt: The messages do not match the ModelMessage[] schema."  
**Causa:** `useChat` envía `UIMessage[]` pero `streamText` espera `CoreMessage[]` cuando usas `messages`  
**Solución:** Usar `convertToCoreMessages` para convertir el historial completo

```javascript
// ❌ Incorrecto (rompe la memoria del chat)
const lastUserMessage = messages.filter(m => m.role === 'user').at(-1);
const userText = lastUserMessage.parts.filter(p => p.type === 'text').map(p => p.text).join('\n');

const result = streamText({
  prompt: userText,  // ❌ Solo el último mensaje - el AI olvida el historial
  ...
});

// ✅ Correcto (mantiene el historial completo)
import { convertToCoreMessages } from 'ai';

const coreMessages = convertToCoreMessages(messages);

const result = streamText({
  messages: coreMessages,  // ✅ Historial completo convertido
  ...
});
```

---

### Problema 3: Error "Invalid schema for function 'listEntities': got type: None"

**Error:** "schema must be a JSON Schema of 'type: "object"', got 'type: "None"'."  
**Causa:** Zod v4 no es compatible con AI SDK v6. El SDK usa `schema._def.typeName` que no existe en Zod v4  
**Solución:** Usar Zod v3 (v3.25.76)

```bash
# Verificar versión
npm ls zod

# Si aparece v4, reinstalar
rm -rf node_modules package-lock.json
npm install zod@^3.25.76
```

---

### Problema 4: `.describe()` causa problemas en schemas

**Error:** Schemas no reconocidos como válidos  
**Causa:** `.describe()` anidados pueden causar problemas en la conversión a JSON Schema con Zod v3 + AI SDK v6  
**Solución:** Eliminar todos los `.describe()` de los schemas

```javascript
// ❌ Incorrecto
parameters: z.object({
  entityType: z.enum([...]).describe('Tipo de entidad'),
  filters: z.object({...}).optional().describe('Filtros'),
}),

// ✅ Correcto
parameters: z.object({
  entityType: z.enum([...]),  // Sin .describe()
  filters: z.object({...}).optional(),  // Sin .describe()
}),
```

---

### Problema 5: Input no editable

**Error:** "Cannot read properties of undefined (reading 'trim')"  
**Causa:** `useChat` v3+ no devuelve `input` ni `handleInputChange`  
**Solución:** Usar `useState` para manejar el input manualmente

```javascript
// ✅ Correcto
const [input, setInput] = useState('');
const handleInputChange = useCallback((e) => {
  setInput(e.target?.value || '');
}, []);
```

---

## 🔑 Puntos Críticos y Correcciones

### 1. Zod v3 es Obligatorio

```bash
# ✅ Verificar
npm ls zod
# Debe mostrar SOLO zod@3.x.x

# ❌ Si aparece v4, reinstalar
rm -rf node_modules package-lock.json
npm install
```

### 2. Modelo GPT-5

```env
# ✅ Correcto
AI_MODEL=gpt-5-mini

# ❌ Incorrecto (ya no existe)
AI_MODEL=gpt-4-turbo-preview
```

### 3. Prompt vs Messages

```javascript
// ✅ Correcto (con useChat)
const result = streamText({
  prompt: userText, // String del último mensaje
  tools,
});

// ❌ Incorrecto (con useChat)
const result = streamText({
  messages, // UIMessage[] no compatible
  tools,
});
```

### 4. Schemas sin `.describe()`

```javascript
// ✅ Correcto
parameters: z.object({
  entityType: z.enum([...]),
  filters: z.object({...}).optional(),
}),

// ❌ Incorrecto
parameters: z.object({
  entityType: z.enum([...]).describe('Tipo de entidad'),
  filters: z.object({...}).optional().describe('Filtros'),
}),
```

### 5. Validación de Schemas

```javascript
// ✅ Validar antes de registrar
if (toolDef.parameters._def?.typeName !== 'ZodObject') {
  throw new Error(`Tool ${name} parameters must be a ZodObject`);
}
```

---

## ✅ Validación y Pruebas

### Checklist de Funcionalidad:

- [x] ✅ Zod v3 instalado correctamente
- [x] ✅ Modelo GPT-5 configurado
- [x] ✅ Uso de `prompt` en lugar de `messages`
- [x] ✅ Schemas sin `.describe()`
- [x] ✅ Validación de schemas en `route.js`
- [x] ✅ Input manejado manualmente con `useState`
- [x] ✅ `sendMessage({ text: ... })` usado correctamente

### Pruebas Recomendadas:

1. **Test básico de mensaje:**
   - Escribir: "Hola"
   - Verificar que el AI responde

2. **Test de tool genérica:**
   - Escribir: "Lista los proveedores"
   - Verificar que se llama `listEntities` tool
   - Verificar que se muestran datos reales

3. **Test de tool específica:**
   - Escribir: "Muéstrame los pedidos activos"
   - Verificar que se llama `getActiveOrders` tool

4. **Test de error:**
   - Desconectar backend
   - Verificar que se muestra mensaje de error apropiado

---

## 📝 Referencias

### Documentación Oficial

- **Vercel AI SDK v6:** https://sdk.vercel.ai/docs
- **@ai-sdk/react:** https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat
- **OpenAI Function Calling:** https://platform.openai.com/docs/guides/function-calling

### Archivos Clave del Proyecto

- API Route: `src/app/api/chat/route.js`
- Componente Chat: `src/components/AI/Chat/index.js`
- Tools Registry: `src/lib/ai/tools/index.js`
- Entity Tools: `src/lib/ai/tools/entityTools.js`
- Order Tools: `src/lib/ai/tools/orderTools.js`
- Config: `src/lib/ai/config.js`

---

## 🎓 Lecciones Aprendidas

1. **Zod v3 es obligatorio**: AI SDK v6 no es compatible con Zod v4
2. **Prompt vs Messages**: Con `useChat`, usar `prompt` (string) en lugar de `messages`
3. **Modelo GPT-5**: `gpt-4-turbo-preview` ya no existe
4. **Sin `.describe()`**: Los schemas Zod no deben usar `.describe()` en AI SDK v6
5. **Validación temprana**: Validar schemas antes de registrarlos para detectar errores temprano

---

**Documento creado:** Enero 2025  
**Última actualización:** Enero 2025  
**Versión de AI SDK:** 6.0.39  
**Versión de @ai-sdk/react:** 3.0.41  
**Versión de Zod:** 3.25.76 (OBLIGATORIO)

/**
 * API Route para el AI Chat
 * 
 * Endpoint: POST /api/chat
 * 
 * Maneja las conversaciones con el asistente AI usando Vercel AI SDK.
 * Conecta el AI Chat con los servicios de dominio mediante tools.
 */

import { openai } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { allTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT } from '@/lib/ai/config';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 segundos máximo

/**
 * POST /api/chat
 * 
 * Maneja las peticiones del chat AI
 */
export async function POST(req) {
  try {
    // Verificar autenticación
    // ✅ CORREGIDO: Obtener sesión del servidor para pasar el token a las tools
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Debes iniciar sesión para usar el chat.' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ CRÍTICO: Obtener el token de la sesión del servidor para pasarlo a las tools
    const serverToken = session.user.accessToken;
    if (!serverToken) {
      console.warn('[CHAT API] ⚠️ Sesión encontrada pero sin accessToken');
      return new Response(
        JSON.stringify({ error: 'No autorizado. Token de acceso no encontrado.' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ CRÍTICO: Configurar el token del servidor en el contexto global
    // Esto permite que getAuthToken() lo use cuando las tools se ejecuten
    const authTokenModule = await import('@/lib/auth/getAuthToken');
    authTokenModule.setServerTokenContext(serverToken);
    
    // ✅ DEBUG: Verificar que el token se configuró correctamente
    console.log('[CHAT API] 🔐 Token configurado en contexto, verificando...');

    // Parsear mensajes del request
    const { messages } = await req.json();

    console.log('[CHAT API] 📥 Mensajes recibidos del cliente:', JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
      console.error('[CHAT API] ❌ Mensajes inválidos:', { messages, isArray: Array.isArray(messages) });
      return new Response(
        JSON.stringify({ error: 'Se requieren mensajes válidos' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ✅ CORRECCIÓN DEFINITIVA: Convertir UIMessage[] a ModelMessage[] para mantener el historial completo
    // useChat envía UIMessage[] con formato { id, role, parts: [{ type: 'text', text: ... }] }
    // streamText espera ModelMessage[] (formato compatible con el protocolo del SDK)
    // convertToModelMessages mantiene TODO el historial del chat (memoria del AI)
    // ⚠️ CRÍTICO: convertToModelMessages es ASYNC, debemos usar await
    let modelMessages;
    try {
      console.log('[CHAT API] 🔄 Convirtiendo mensajes. Cantidad:', messages.length);
      
      // ✅ CRÍTICO: convertToModelMessages es async, usar await
      modelMessages = await convertToModelMessages(messages);
      
      console.log('[CHAT API] ✅ Mensajes convertidos. Tipo:', typeof modelMessages, '¿Es Array?:', Array.isArray(modelMessages));
      console.log('[CHAT API] ✅ Cantidad de mensajes convertidos:', modelMessages?.length);
      
      if (!Array.isArray(modelMessages)) {
        console.error('[CHAT API] ❌ convertToModelMessages no devolvió un array:', {
          tipo: typeof modelMessages,
          valor: modelMessages,
          esPromise: modelMessages instanceof Promise,
        });
        throw new Error(`convertToModelMessages no devolvió un array. Tipo: ${typeof modelMessages}`);
      }
      
      console.log('[CHAT API] ✅ Primer mensaje convertido:', JSON.stringify(modelMessages[0], null, 2));
    } catch (conversionError) {
      console.error('[CHAT API] ❌ Error al convertir mensajes:', conversionError);
      console.error('[CHAT API] ❌ Stack:', conversionError.stack);
      return new Response(
        JSON.stringify({ 
          error: 'Error al convertir mensajes',
          details: conversionError.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Convertir tools a formato del AI SDK
    console.log('[CHAT API] 🔧 Registrando tools. Total de tools:', Object.keys(allTools).length);
    const tools = {};
    for (const [name, toolDef] of Object.entries(allTools)) {
      console.log(`[CHAT API] 🔧 Registrando tool: ${name}`, {
        hasDescription: !!toolDef.description,
        hasParameters: !!toolDef.parameters,
        hasExecute: typeof toolDef.execute === 'function',
        parametersType: toolDef.parameters?._def?.typeName,
      });

      // ✅ VALIDAR que parameters existe y es un ZodObject válido
      if (!toolDef.parameters || typeof toolDef.parameters.parse !== 'function') {
        console.error(`[CHAT API] ❌ Tool ${name} has invalid parameters schema`, {
          hasParameters: !!toolDef.parameters,
          typeName: toolDef.parameters?._def?.typeName,
          parametersValue: toolDef.parameters,
        });
        throw new Error(`Tool ${name} has invalid parameters schema`);
      }

      // ✅ Verificar que es un ZodObject (Zod v3)
      if (toolDef.parameters._def?.typeName !== 'ZodObject') {
        console.error(`[CHAT API] ❌ Tool ${name} parameters is not a ZodObject`, {
          typeName: toolDef.parameters._def?.typeName,
          _def: toolDef.parameters._def,
        });
        throw new Error(`Tool ${name} parameters must be a ZodObject, got ${toolDef.parameters._def?.typeName}`);
      }

      try {
        // ✅ CORRECCIÓN según documentación oficial: usar inputSchema en lugar de parameters
        // La documentación oficial (https://ai-sdk.dev/providers/ai-sdk-providers/openai) muestra
        // que se debe usar inputSchema para describir los campos esperados
        // ✅ CRÍTICO: Usar closure para capturar serverToken y authTokenModule
        // Esto asegura que el token esté disponible cuando la tool se ejecute, incluso si el contexto global se pierde
        tools[name] = tool({
          description: toolDef.description,
          inputSchema: toolDef.parameters, // ✅ Usar inputSchema (según documentación oficial)
          execute: async (params) => {
            // ✅ CRÍTICO: Re-configurar el token en el contexto ANTES de ejecutar la tool
            // Esto garantiza que esté disponible incluso si el contexto global se perdió
            // El closure captura serverToken y authTokenModule del scope externo
            authTokenModule.setServerTokenContext(serverToken);
            
            try {
              // Ejecutar la tool con manejo de errores
              const result = await toolDef.execute(params);
              console.log(`[CHAT API] ✅ Tool ${name} completada. Resultado:`, JSON.stringify(result, null, 2).substring(0, 500));
              // ✅ IMPORTANTE: Las tools deben devolver JSON puro, no strings
              // El SDK convierte automáticamente a JSON para Responses API (GPT-5)
              return result;
            } catch (error) {
              console.error(`[CHAT API] ❌ Error executing tool ${name}:`, error);
              console.error(`[CHAT API] ❌ Stack:`, error.stack);
              
              // Devolver error estructurado
              return {
                success: false,
                error: true,
                message: error.message || 'Error ejecutando la herramienta',
                tool: name,
              };
            }
          },
        });
        console.log(`[CHAT API] ✅ Tool ${name} registrada correctamente`);
      } catch (toolError) {
        console.error(`[CHAT API] ❌ Error al registrar tool ${name}:`, toolError);
        console.error(`[CHAT API] ❌ Stack:`, toolError.stack);
        throw toolError;
      }
    }

    console.log(`[CHAT API] ✅ Total de tools registradas: ${Object.keys(tools).length}`);

    // ✅ CORREGIDO: Modelo actualizado a GPT-5
    // gpt-4-turbo-preview ya NO existe en OpenAI Platform
    // Usar gpt-5-mini (recomendado) o gpt-5.2 (máxima calidad)
    const aiModel = process.env.AI_MODEL || 'gpt-5-mini';

    console.log('[CHAT API] 🤖 Configurando streamText:', {
      model: aiModel,
      messagesCount: modelMessages.length,
      toolsCount: Object.keys(tools).length,
      systemPromptLength: SYSTEM_PROMPT.length,
    });

    // 🔄 FLUJO DE DOS PASOS (tool → IA → texto) - SEGÚN DOC OFICIAL
    // 
    // Según la documentación oficial (ai-sdk.dev):
    // - Por defecto, streamText es de 1 paso (tool-call → tool-result, sin texto final)
    // - Para activar multi-step tool loop, necesitamos usar stopWhen
    // 
    // PASO 1 - Ejecución de la tool:
    //   - El modelo decide qué tool ejecutar basándose en el mensaje del usuario
    //   - La tool se ejecuta y devuelve datos estructurados (JSON)
    //   - El SDK reinyecta automáticamente el resultado en el stream
    //
    // PASO 2 - Generación de texto (OBLIGATORIO):
    //   - El modelo recibe el resultado de la tool como contexto
    //   - El modelo DEBE generar un mensaje de texto explicando los resultados
    //   - Este texto es lo que el usuario verá en el chat
    //
    // ✅ CONFIGURACIÓN CRÍTICA (según doc oficial):
    //   - stopWhen: stepCountIs(5) → Activa multi-step tool loop (tool → texto)
    //   - maxSteps: 10 → Límite máximo de pasos (tool calls + generación de texto)
    //   - sendToolResultMessages: true (ver más abajo) → Permite que el SDK envíe tool results
    //   - SYSTEM_PROMPT → Instruye explícitamente al modelo sobre el flujo de DOS PASOS
    //
    // ✅ RESPONSABILIDADES CLARAS:
    //   - Tools: Devuelven JSON puro ({ success, data, meta })
    //   - Backend: Orquesta el flujo entre tool y modelo (automático con SDK + stopWhen)
    //   - IA: Es la única responsable de convertir datos en lenguaje natural
    let result;
    try {
      result = streamText({
        model: openai(aiModel),
        system: SYSTEM_PROMPT, // ✅ Instruye explícitamente sobre el flujo de DOS PASOS
        messages: modelMessages, // ✅ Historial completo convertido a ModelMessage[]
        tools, // ✅ Tools que devuelven datos estructurados
        maxSteps: 10, // ✅ Límite máximo de pasos
        stopWhen: stepCountIs(5), // ✅ CRÍTICO: Activa multi-step tool loop (según doc oficial)
        // Con stopWhen: stepCountIs(5), el modelo puede:
        //   - Paso 1: Ejecutar tool
        //   - Paso 2: Recibir tool result
        //   - Paso 3: Generar texto explicando resultados
        //   - Hasta 5 pasos en total (suficiente para tool + texto)
      });
      console.log('[CHAT API] ✅ streamText configurado correctamente');
    } catch (streamTextError) {
      console.error('[CHAT API] ❌ Error al configurar streamText:', streamTextError);
      console.error('[CHAT API] ❌ Stack:', streamTextError.stack);
      console.error('[CHAT API] ❌ Mensajes que causaron el error:', JSON.stringify(modelMessages, null, 2));
      throw streamTextError;
    }

    // Devolver stream de respuesta con flujo de DOS PASOS habilitado
    // 
    // En AI SDK v6, `toUIMessageStreamResponse()` con `sendToolResultMessages: true` garantiza:
    // 
    // 1. El SDK envía el resultado de la tool como mensaje intermedio (tool result)
    // 2. El SDK permite que el modelo genere un mensaje de texto final después de recibir el tool result
    // 3. El frontend (useChat) recibe AMBOS mensajes:
    //    - El tool result (opcionalmente renderizable como indicador de "consultando...")
    //    - El mensaje de texto final del assistant (obligatorio, lo que el usuario lee)
    //
    // ⚠️ SIN `sendToolResultMessages: true`:
    //   - El SDK solo envía el tool result
    //   - El modelo NO genera mensaje de texto final
    //   - El chat queda en silencio (respuesta vacía)
    //
    // ✅ CON `sendToolResultMessages: true`:
    //   - El SDK envía tool result + mensaje de texto final
    //   - El usuario ve la respuesta explicada en lenguaje natural
    //   - El flujo de DOS PASOS funciona correctamente
    console.log('[CHAT API] ✅ Preparando respuesta stream con flujo de DOS PASOS habilitado');
    
    // ✅ Limpiar el contexto del token antes de devolver la respuesta
    authTokenModule.clearServerTokenContext();
    
    return result.toUIMessageStreamResponse({
      sendToolResultMessages: true, // ✅ CRÍTICO: Habilita el flujo de DOS PASOS (tool → texto)
      // Con esta opción, el SDK garantiza que el modelo genere un mensaje de texto
      // después de ejecutar una tool, cumpliendo el flujo: datos → lenguaje natural
    });
  } catch (error) {
    // ✅ Asegurar que limpiamos el contexto incluso si hay error
    try {
      if (authTokenModule?.clearServerTokenContext) {
        authTokenModule.clearServerTokenContext();
      }
    } catch (cleanupError) {
      console.error('[CHAT API] ❌ Error al limpiar contexto de token:', cleanupError);
    }
    
    console.error('[CHAT API] ❌ ERROR GENERAL en chat API:', error);
    console.error('[CHAT API] ❌ Tipo de error:', error.constructor.name);
    console.error('[CHAT API] ❌ Mensaje:', error.message);
    console.error('[CHAT API] ❌ Stack:', error.stack);
    console.error('[CHAT API] ❌ Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error.message,
        type: error.constructor.name
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}


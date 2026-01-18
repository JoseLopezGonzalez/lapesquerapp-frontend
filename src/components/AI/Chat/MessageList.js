'use client';

import { Sparkles, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

/**
 * Componente que renderiza la lista de mensajes del chat
 */
export function MessageList({ messages, isLoading }) {
  // ✅ Función auxiliar para verificar si un mensaje tiene contenido
  const hasMessageContent = (message) => {
    if (Array.isArray(message.parts) && message.parts.length > 0) {
      return message.parts.some(part => 
        part.type === 'text' && part.text && part.text.trim()
      );
    }
    return typeof message.content === 'string' && message.content.trim();
  };

  // ✅ Filtrar mensajes vacíos del assistant cuando está cargando
  // Esto evita mostrar un mensaje en blanco junto con el loader
  const filteredMessages = messages.filter((message) => {
    // Si es un mensaje del assistant sin contenido y está cargando, filtrarlo
    if (message.role === 'assistant' && isLoading) {
      // Si es el último mensaje y no tiene contenido, no mostrarlo
      // (se mostrará el loader en su lugar)
      const isLastMessage = messages[messages.length - 1]?.id === message.id;
      if (isLastMessage && !hasMessageContent(message)) {
        return false;
      }
    }
    return true;
  });

  // ✅ Verificar si el último mensaje del assistant tiene contenido visible
  // Si tiene contenido, no mostrar el loader porque la respuesta ya está apareciendo
  const lastAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0];
  
  const shouldShowLoader = isLoading && messages.length > 0 && 
    (!lastAssistantMessage || !hasMessageContent(lastAssistantMessage));

  return (
    <div className="space-y-4">
      {filteredMessages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'flex gap-3',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </div>
          )}

          <div
            className={cn(
              'max-w-[80%] rounded-lg px-4 py-3',
              message.role === 'user'
                ? 'bg-primary !text-white' // ✅ Forzar texto blanco explícitamente con !important para garantizar contraste
                : 'bg-muted text-foreground'
            )}
          >
            {/* ✅ CORRECCIÓN SEGÚN DOC OFICIAL: Renderizar usando message.parts */}
            {/* La documentación oficial dice: "render the messages using the parts property" */}
            {/* ✅ Ajustar clases: sin whitespace-pre-wrap para Markdown, mantenerlo solo para texto plano del usuario */}
            <div className={cn(
              'text-sm break-words',
              message.role === 'user' ? 'whitespace-pre-wrap' : 'whitespace-normal'
            )}>
              {(() => {
                // ✅ Determinar el color del texto según el rol del mensaje
                const textColor = message.role === 'user' ? 'text-white' : 'text-foreground';
                
                // ✅ AI SDK v6: Los mensajes tienen parts (array) con diferentes tipos
                // Según la doc oficial: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
                if (Array.isArray(message.parts) && message.parts.length > 0) {
                  return message.parts.map((part, idx) => {
                    // ✅ Tipo 'text': Mensaje de texto del assistant (renderizar como Markdown)
                    if (part.type === 'text') {
                      const text = part.text || '';
                      if (text.trim()) {
                        return (
                          <div key={idx} className={message.role === 'user' ? textColor : ''}>
                            {message.role === 'assistant' ? (
                              <MarkdownRenderer content={text} />
                            ) : (
                              <div className={cn('whitespace-pre-wrap', textColor)}>{text}</div>
                            )}
                          </div>
                        );
                      }
                    }
                    
                    // ✅ Tipo 'tool-call' o 'tool-invocation': Invocación de tool
                    if (part.type === 'tool-call' || part.type === 'tool-invocation') {
                      return (
                        <div key={idx} className="mt-2 pt-2 border-t border-border/50">
                          <div className="text-xs opacity-70 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Consultando: {part.toolName || part.toolCallId || 'herramienta'}...</span>
                          </div>
                        </div>
                      );
                    }
                    
                    // ✅ Tipo 'tool-result': Resultado de la tool (mostrar JSON formateado)
                    if (part.type === 'tool-result') {
                      return (
                        <div key={idx} className="mt-2 pt-2 border-t border-border/50">
                          <div className="text-xs opacity-70">
                            <div className="mb-1">✅ Consulta completada: {part.toolName || 'herramienta'}</div>
                            {part.result && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-xs">Ver datos técnicos</summary>
                                <pre className="mt-1 text-xs bg-muted/50 p-2 rounded overflow-auto max-h-32">
                                  {JSON.stringify(part.result, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  });
                }
                
                // ✅ Fallback: Si no hay parts, usar content (string) para compatibilidad
                if (typeof message.content === 'string' && message.content.trim()) {
                  if (message.role === 'assistant') {
                    return <MarkdownRenderer content={message.content} />;
                  }
                  return <div className={message.role === 'user' ? 'text-white' : 'text-foreground'}>{message.content}</div>;
                }
                
                // ✅ Si no hay contenido y no está cargando, no mostrar nada (evitar "respuesta vacía")
                return null;
              })()}
            </div>
          </div>

          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
          )}
        </div>
      ))}

      {shouldShowLoader && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-foreground px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Pensando...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


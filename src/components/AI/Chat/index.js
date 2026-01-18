'use client';

/**
 * Componente principal del AI Chat
 * 
 * Integrado en La PesquerApp para proporcionar asistencia mediante AI.
 * Usa Vercel AI SDK para manejar la conversación y tools para acceder a servicios de dominio.
 */

import { useChat } from '@ai-sdk/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Loader2, Sparkles, User, Package, Users, Truck, Store, Fish } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Chat() {
  // En @ai-sdk/react v3, useChat NO devuelve input/handleInputChange/handleSubmit
  // Necesitamos manejar el input manualmente
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    maxSteps: 10, // ✅ CRÍTICO: Debe coincidir con maxSteps del servidor
    // Si maxSteps difiere entre cliente y servidor, puede causar problemas con tools
  });
  
  // isLoading basado en el status
  const isLoading = status === 'streaming' || status === 'in_progress';

  // ✅ Auto-scroll: Mantener el scroll abajo cuando hay nuevos mensajes o está cargando
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        // Buscar el viewport del ScrollArea (Radix UI)
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') ||
                         scrollAreaRef.current.querySelector('.rt-ScrollAreaViewport');
        
        if (viewport) {
          // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
          requestAnimationFrame(() => {
            viewport.scrollTop = viewport.scrollHeight;
          });
        }
      }
    };

    // Scroll inmediato cuando cambian los mensajes o el estado de loading
    scrollToBottom();

    // Si está cargando/streaming, hacer scroll continuo para mantener fluidez
    let intervalId;
    if (isLoading) {
      intervalId = setInterval(() => {
        scrollToBottom();
      }, 100); // Scroll cada 100ms durante el streaming
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [messages, isLoading]);
  
  // Manejar cambios en el input
  const handleInputChange = useCallback((e) => {
    setInput(e.target?.value || '');
  }, []);
  
  // Manejar submit del formulario
  // En AI SDK v6, sendMessage acepta { text: string } o directamente el texto
  const handleSubmit = useCallback((e) => {
    e?.preventDefault?.();
    const message = input.trim();
    if (message && !isLoading) {
      sendMessage({ text: message });
      setInput(''); // Limpiar input después de enviar
    }
  }, [input, sendMessage, isLoading]);

  // Manejar acciones rápidas (envía mensaje al hacer clic)
  const handleQuickAction = useCallback((message) => {
    if (!isLoading) {
      sendMessage({ text: message });
    }
  }, [sendMessage, isLoading]);

  // Acciones rápidas disponibles
  const quickActions = [
    { text: 'Lista los pedidos activos', icon: Package },
    { text: 'Muéstrame los proveedores', icon: Truck },
    { text: 'Lista los clientes', icon: Users },
    { text: 'Muéstrame los productos', icon: Fish },
    { text: 'Lista los almacenes', icon: Store },
  ];

  return (
    <div className="relative flex flex-col h-full border rounded-lg bg-background overflow-hidden">
      {/* Mensajes */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 pb-28">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-6 px-4">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary opacity-70" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Hola, soy tu asistente AI
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Puedo ayudarte a consultar información sobre pedidos, clientes, proveedores, productos y más.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-full max-w-2xl">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Acciones Rápidas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.text)}
                      disabled={isLoading}
                      className={cn(
                        "h-auto py-2 px-4 gap-2 text-sm",
                        "hover:bg-primary hover:text-primary-foreground transition-colors"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{action.text}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input flotante */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-background/95 backdrop-blur-md rounded-lg shadow-lg border p-2">
          {error && (
            <div className="mb-2 text-sm text-destructive">
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
    </div>
  );
}


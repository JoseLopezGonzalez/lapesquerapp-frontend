'use client';

/**
 * Componente principal del AI Chat
 * 
 * Integrado en La PesquerApp para proporcionar asistencia mediante AI.
 * Usa Vercel AI SDK para manejar la conversación y tools para acceder a servicios de dominio.
 */

import { useChat } from '@ai-sdk/react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Chat() {
  // En @ai-sdk/react v3, useChat NO devuelve input/handleInputChange/handleSubmit
  // Necesitamos manejar el input manualmente
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    maxSteps: 10, // ✅ CRÍTICO: Debe coincidir con maxSteps del servidor
    // Si maxSteps difiere entre cliente y servidor, puede causar problemas con tools
  });
  
  // isLoading basado en el status
  const isLoading = status === 'streaming' || status === 'in_progress';
  
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

  return (
    <div className="flex flex-col h-full max-h-[600px] border rounded-lg bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Asistente AI - La PesquerApp</h2>
      </div>

      {/* Mensajes */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2">
            <Bot className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">
              Hola, soy tu asistente AI para La PesquerApp.
            </p>
            <p className="text-xs">
              Puedo ayudarte a consultar información sobre pedidos, clientes, proveedores, productos y más.
            </p>
            <p className="text-xs mt-2">
              Prueba preguntando: "Lista los pedidos activos" o "Muéstrame los proveedores"
            </p>
          </div>
        )}
        <MessageList messages={messages} isLoading={isLoading} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
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
  );
}


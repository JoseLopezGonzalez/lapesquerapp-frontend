'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

/**
 * Componente de input para enviar mensajes
 */
export function MessageInput({ input, handleInputChange, handleSubmit, isLoading }) {
  // Asegurar que input siempre sea un string
  const inputValue = typeof input === 'string' ? input : '';
  
  // Asegurar que onChange siempre esté definido como función válida
  // Si handleInputChange no está disponible, crear un handler que al menos permita escribir
  const onChangeHandler = typeof handleInputChange === 'function' 
    ? handleInputChange 
    : (e) => {
        // Fallback: si handleInputChange no está disponible, al menos no bloqueamos el input
        // Esto no actualizará el estado, pero permitirá que el usuario escriba temporalmente
        console.warn('MessageInput: handleInputChange is not a function, using fallback', { handleInputChange });
      };
  
  // Si handleInputChange no está definido, no podemos usar un input controlado
  // En ese caso, usar defaultValue en lugar de value
  const isControlled = typeof handleInputChange === 'function';
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        {...(isControlled ? { value: inputValue } : { defaultValue: inputValue })}
        onChange={onChangeHandler}
        placeholder="Escribe tu mensaje..."
        disabled={isLoading}
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && inputValue.trim()) {
              // Hacer submit del formulario correctamente
              const form = e.target.closest('form');
              if (form) {
                form.requestSubmit();
              }
            }
          }
        }}
      />
      <Button 
        type="submit" 
        disabled={isLoading || !inputValue || !inputValue.trim()}
        size="icon"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}


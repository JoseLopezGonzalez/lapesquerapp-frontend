'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  const isDisabled = isLoading || !inputValue || !inputValue.trim();
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center w-full">
        <Input
          type="text"
          {...(isControlled ? { value: inputValue } : { defaultValue: inputValue })}
          onChange={onChangeHandler}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
          className={cn(
            "w-full pr-12 border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none",
            "bg-transparent"
          )}
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
          disabled={isDisabled}
          size="icon"
          className={cn(
            "absolute right-1 h-7 w-7 rounded-md",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}


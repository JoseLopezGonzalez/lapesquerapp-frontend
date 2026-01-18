'use client';

/**
 * Botón para abrir el chat AI
 * 
 * Se puede integrar en cualquier parte de la aplicación para abrir el chat
 * como un modal o panel lateral.
 */

import { useState, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chat } from './Chat';
import { MessageSquare } from 'lucide-react';

export const ChatButton = forwardRef(({ asMenuItem = false, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);

  if (asMenuItem) {
    // Cuando se usa como DropdownMenuItem, envolver el children y añadir el Dialog
    // El children (DropdownMenuItem) ya maneja sus propios estilos
    // ✅ CRÍTICO: Usar onSelect en lugar de onClick para evitar conflictos con el dropdown
    return (
      <>
        {children && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            {children}
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Asistente AI</DialogTitle>
            </DialogHeader>
            <div className="flex-1 px-6 pb-6 overflow-hidden">
              <Chat />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        ref={ref}
        onClick={handleOpen}
        variant="outline"
        size="sm"
        className="gap-2"
        {...props}
      >
        <MessageSquare className="h-4 w-4" />
        Asistente AI
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Asistente AI</DialogTitle>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            <Chat />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ChatButton.displayName = 'ChatButton';


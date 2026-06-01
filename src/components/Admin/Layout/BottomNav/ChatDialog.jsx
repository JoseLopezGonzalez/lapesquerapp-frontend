'use client';

/**
 * ChatDialog - Dialog del Chat AI controlado externamente
 *
 * Wrapper del ChatButton que permite control externo del estado del Dialog
 */

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chat } from '@/components/AI/Chat';
import { Sparkles } from 'lucide-react';

export function ChatDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] w-[95vw] max-w-[95vw] flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            Asistente AI
          </DialogTitle>
        </DialogHeader>
        <div className="h-full flex-1 overflow-hidden px-6 pb-6">
          <Chat />
        </div>
      </DialogContent>
    </Dialog>
  );
}

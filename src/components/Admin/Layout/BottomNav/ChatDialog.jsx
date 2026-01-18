"use client";

/**
 * ChatDialog - Dialog del Chat AI controlado externamente
 * 
 * Wrapper del ChatButton que permite control externo del estado del Dialog
 */

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chat } from '@/components/AI/Chat';
import { Sparkles } from 'lucide-react';

export function ChatDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] h-[90vh] flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Asistente AI
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-hidden h-full">
          <Chat />
        </div>
      </DialogContent>
    </Dialog>
  );
}


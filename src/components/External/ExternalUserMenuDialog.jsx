'use client';

import * as React from 'react';
import { LogOut, MoonStar, Warehouse, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';
import { cn } from '@/lib/utils';

function getInitials(name) {
  return name
    ? name
        .split(' ')
        .map((chunk) => chunk[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'UE';
}

export function ExternalUserMenuDialog({ open, onOpenChange, user }) {
  const initials = getInitials(user?.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          '!fixed !inset-0 !z-50 !m-0 !h-screen !w-screen !max-w-none !rounded-none',
          '!translate-x-0 !translate-y-0',
          'flex flex-col p-0',
          '[&>button]:hidden',
          MOBILE_SAFE_AREAS.BOTTOM
        )}
      >
        <DialogHeader className="px-4 pt-2 pb-2">
          <DialogTitle className="sr-only">Menu de usuario externo</DialogTitle>
          <DialogDescription className="sr-only">
            Menu de sesion y preferencias del usuario externo
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 px-4 py-3">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarImage src={user?.image} alt={user?.name} />
            <AvatarFallback className="rounded-xl text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{user?.name}</p>
            <p className="text-muted-foreground truncate text-sm">{user?.email}</p>
            <p className="text-muted-foreground mt-1 text-xs tracking-[0.18em] uppercase">
              Acceso externo
            </p>
          </div>
          <div className="mr-2 scale-150">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="bg-card space-y-3 rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-xl p-2">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Alcance de la cuenta</p>
                <p className="text-muted-foreground text-sm">
                  Tienes acceso a {user?.allowedStoreIds?.length || 0} almacenes asignados y a sus
                  movimientos permitidos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-muted rounded-xl p-2">
                <MoonStar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tema</p>
                <p className="text-muted-foreground text-sm">
                  Mantiene el mismo sistema visual y tokens que el resto de la aplicacion.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                user?.logout?.();
                onOpenChange(false);
              }}
              className={cn(
                'border-destructive/20 bg-destructive/5 text-destructive flex min-h-[56px] w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium',
                'hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-150'
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="flex-1">Cerrar sesion</span>
            </button>
          </div>

          <div className="pt-3">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="min-h-[56px] w-full text-base"
            >
              <X className="mr-2 h-5 w-5" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

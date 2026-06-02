'use client';

/**
 * UserMenuDialog - Diálogo de pantalla completa con menú de usuario
 *
 * Contenido del menú de cuenta (configuración, perfil, cerrar sesión, etc.).
 * Se usa desde BottomNav en mobile en lugar del botón flotante.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BadgeCheck,
  Bell,
  LogOut,
  Settings,
  Sparkles,
  MessageSquare,
  CircleHelp,
  User,
  X,
} from 'lucide-react';
import { ChatButton } from '@/components/AI/ChatButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';

/**
 * UserMenuDialog - Diálogo controlado del menú de usuario
 *
 * @param {object} props
 * @param {boolean} props.open - Si el diálogo está abierto
 * @param {Function} props.onOpenChange - Callback (open) => void
 * @param {object} props.user - Objeto usuario con name, email, logout, avatar
 */
export function UserMenuDialog({ open, onOpenChange, user }) {
  const router = useRouter();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const menuItems = [
    {
      icon: Sparkles,
      label: 'Planes',
      onClick: () => onOpenChange(false),
    },
    {
      icon: MessageSquare,
      label: 'Asistente AI',
      isChatButton: true,
    },
    {
      icon: User,
      label: 'Perfil',
      onClick: () => onOpenChange(false),
    },
    {
      icon: BadgeCheck,
      label: 'Cuenta',
      onClick: () => onOpenChange(false),
    },
    {
      icon: Bell,
      label: 'Notificaciones',
      onClick: () => onOpenChange(false),
    },
    {
      icon: Settings,
      label: 'Configuración',
      onClick: () => {
        router.push('/admin/settings');
        onOpenChange(false);
      },
    },
    {
      icon: CircleHelp,
      label: 'Centro de ayuda',
      onClick: () => onOpenChange(false),
    },
  ];

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
        <DialogHeader className="flex-shrink-0 px-4 pt-2 pb-2">
          <DialogTitle className="sr-only">Menú de usuario</DialogTitle>
          <DialogDescription className="sr-only">
            Menú con opciones de cuenta, configuración y preferencias del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="flex-shrink-0 px-4 py-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-lg after:rounded-lg">
              <AvatarImage src={user?.avatar} alt={user?.name} className="rounded-lg" />
              <AvatarFallback className="rounded-lg text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-lg font-semibold">{user?.name || 'Usuario'}</span>
              <span className="text-muted-foreground truncate text-sm">{user?.email || ''}</span>
            </div>
            <div className="mr-2 scale-150">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {menuItems.map((item) => {
              const Icon = item.icon;
              if (item.isChatButton) {
                return (
                  <ChatButton key={item.label} asMenuItem>
                    <button
                      className={cn(
                        'flex w-full items-center gap-3',
                        'min-h-[56px] px-4 py-3',
                        'text-left text-base',
                        'hover:bg-accent active:bg-accent/80',
                        'transition-colors duration-150',
                        'border-border/50 border-b last:border-b-0'
                      )}
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  </ChatButton>
                );
              }
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'flex w-full items-center gap-3',
                    'min-h-[56px] px-4 py-3',
                    'text-left text-base',
                    'hover:bg-accent active:bg-accent/80',
                    'transition-colors duration-150',
                    'border-border/50 border-b last:border-b-0'
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2">
            <button
              onClick={() => {
                user?.logout?.();
                onOpenChange(false);
              }}
              className={cn(
                'flex w-full items-center gap-3',
                'min-h-[56px] px-4 py-3',
                'text-left text-base font-medium',
                'text-destructive',
                'border-destructive/20 rounded-lg border-2',
                'bg-destructive/5',
                'hover:bg-destructive/10 hover:border-destructive/30',
                'active:bg-destructive/15 active:border-destructive/40',
                'transition-all duration-150'
              )}
            >
              <LogOut className="h-6 w-6 shrink-0" />
              <span className="flex-1">Cerrar Sesión</span>
            </button>
          </div>

          <div className="my-2 border-t" />

          <div className="px-4 py-3">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="min-h-[56px] w-full text-base"
            >
              <X className="mr-2 h-6 w-6" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

/**
 * FloatingUserMenu - Avatar de usuario flotante sobre el contenido (solo desktop u otros usos)
 *
 * En mobile el menú de usuario se abre desde el BottomNav; este componente
 * se mantiene por si se usa en otros contextos.
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { UserMenuDialog } from "./UserMenuDialog";

/**
 * FloatingUserMenu - Avatar flotante de usuario
 *
 * @param {object} props
 * @param {object} props.user - Objeto usuario con name, email, logout, avatar
 * @param {React.RefObject<HTMLElement>} props.scrollContainerRef - Ref del contenedor scrollable
 */
export function FloatingUserMenu({ user, scrollContainerRef }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [scrollY, setScrollY] = React.useState(0);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  React.useEffect(() => {
    const mainElement = scrollContainerRef?.current;
    if (!mainElement) return;
    const handleScroll = () => setScrollY(mainElement.scrollTop);
    handleScroll();
    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const opacity = React.useMemo(() => {
    if (scrollY < 50) return 1;
    if (scrollY > 150) return 0;
    return 1 - (scrollY - 50) / 100;
  }, [scrollY]);

  return (
    <>
      <div
        className={cn("relative z-50 pointer-events-auto transition-opacity duration-200 ease-out")}
        style={{ opacity }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          className={cn(
            "h-12 w-12 shrink-0 rounded-full",
            "bg-background/95 backdrop-blur-md",
            "border border-border",
            "shadow-lg shadow-black/10",
            "hover:bg-background hover:shadow-xl",
            "transition-all duration-200",
            "active:scale-95"
          )}
          aria-label="Menú de usuario"
        >
          <Avatar className="h-11 w-11 ring-2 ring-background/50">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-sm font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
      <UserMenuDialog open={dialogOpen} onOpenChange={setDialogOpen} user={user} />
    </>
  );
}

export { UserMenuDialog } from "./UserMenuDialog";


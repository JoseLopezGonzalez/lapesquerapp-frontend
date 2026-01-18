"use client";

/**
 * CenterActionButton - Botón central de acción en BottomNav
 * 
 * Botón prominente con icono "+" que mostrará un dropdown con acciones
 */

import * as React from "react";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { feedbackPop } from "@/lib/motion-presets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CenterActionButton() {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);

  const itemTransition = React.useMemo(() => {
    if (prefersReducedMotion) {
      return { duration: 0 };
    }
    return {
      ...feedbackPop.transition,
    };
  }, [prefersReducedMotion]);

  return (
    <motion.div
      initial={feedbackPop.initial}
      animate={feedbackPop.animate}
      exit={feedbackPop.exit}
      transition={itemTransition}
      whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
      className="flex items-center justify-center -mt-4" // Elevar el botón ligeramente
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "relative flex items-center justify-center",
              "w-14 h-14 rounded-full", // Botón más grande y circular
              "bg-primary text-primary-foreground",
              "shadow-lg shadow-primary/50",
              "transition-all duration-200",
              "touch-none",
              "hover:bg-primary/90 active:bg-primary/80",
              "hover:scale-105 active:scale-95"
            )}
            aria-label="Acciones rápidas"
          >
            <Plus className="w-6 h-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="top"
          sideOffset={12}
          className="w-56"
        >
          {/* Placeholder - Las acciones se configurarán más tarde */}
          <div className="p-4 text-center text-sm text-muted-foreground">
            Acciones rápidas
            <br />
            <span className="text-xs">(Por configurar)</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}


'use client';

/**
 * CenterActionButton - Botón central de acción en BottomNav
 *
 * Botón prominente que abre el NavigationSheet
 */

import * as React from 'react';
import { Menu } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { feedbackPop } from '@/lib/motion-presets';

export function CenterActionButton({ onOpenSheet }) {
  const prefersReducedMotion = useReducedMotion();

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
      className="flex items-center justify-center"
    >
      <button
        onClick={() => onOpenSheet?.(true)}
        className={cn(
          'relative flex items-center justify-center',
          'h-14 w-14 rounded-md',
          'bg-primary text-primary-foreground',
          'shadow-md',
          'transition-all duration-200',
          'touch-none',
          'hover:bg-primary/90 active:bg-primary/80',
          'hover:scale-[1.02] active:scale-[0.98]'
        )}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-6 w-6" />
      </button>
    </motion.div>
  );
}

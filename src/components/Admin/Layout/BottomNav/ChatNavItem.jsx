"use client";

/**
 * ChatNavItem - Item especial para Chat IA en BottomNav
 * 
 * Item especial que no navega, sino que abre el Dialog del Chat AI
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_ICON_SIZES } from "@/lib/design-tokens-mobile";
import { feedbackPop } from "@/lib/motion-presets";
import { ChatDialog } from "./ChatDialog";

export function ChatNavItem({ index }) {
  const prefersReducedMotion = useReducedMotion();
  const [chatOpen, setChatOpen] = React.useState(false);

  // Transición con delay para stagger (entrada escalonada)
  const itemTransition = React.useMemo(() => {
    if (prefersReducedMotion) {
      return { duration: 0 };
    }
    return {
      ...feedbackPop.transition,
      delay: index * 0.03,
    };
  }, [index, prefersReducedMotion]);

  return (
    <>
      <motion.div
        initial={feedbackPop.initial}
        animate={feedbackPop.animate}
        exit={feedbackPop.exit}
        transition={itemTransition}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        className="flex flex-col items-center justify-center flex-shrink-0"
      >
        <button
          onClick={() => setChatOpen(true)}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1",
            "min-h-[44px] min-w-[44px]",
            "px-2 py-1.5 rounded-lg",
            "transition-all duration-200",
            "touch-none",
            "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent"
          )}
          aria-label="Chat IA"
        >
          <MessageSquare 
            className="w-5 h-5"
          />
          <span className="text-[10px] font-medium leading-tight text-muted-foreground">
            Chat IA
          </span>
        </button>
      </motion.div>

      {/* Chat AI Dialog - Controlado externamente */}
      <ChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}


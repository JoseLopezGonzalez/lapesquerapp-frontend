'use client';
// Necesita 'use client': framer-motion (whileInView) es solo de cliente. Puede envolver
// Server Components como children (patrón válido de App Router). El reduced-motion se
// gestiona a nivel de MotionConfig en src/app/[locale]/layout.tsx (ver GAP-135) — no aquí.

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

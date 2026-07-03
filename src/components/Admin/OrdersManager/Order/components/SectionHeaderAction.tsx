'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const SECTION_HEADER_ACTION_SLOT_ID = 'order-mobile-section-header-slot';

/**
 * Renderiza `children` dentro del slot vacío de la cabecera de sección mobile
 * (Order/index.tsx, a la derecha del título) sin mover el estado/diálogos del
 * componente de la sección — evita levantar hooks/estado solo para exponer un
 * botón de acción en la barra de navegación.
 */
export function SectionHeaderAction({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(SECTION_HEADER_ACTION_SLOT_ID));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}

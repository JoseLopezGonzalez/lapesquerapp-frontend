// react-dom no trae tipos propios en esta versión y @types/react-dom no está
// instalado en el proyecto. Shim mínimo solo para lo que usamos (createPortal).
declare module 'react-dom' {
  import type { ReactNode } from 'react';

  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
    key?: string | null
  ): ReactNode;
}

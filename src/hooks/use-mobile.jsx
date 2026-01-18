import * as React from "react"

/**
 * Hook useIsMobile - Detección de dispositivos móviles
 * 
 * Breakpoint: 768px (< 768px = mobile)
 * 
 * ⚠️ IMPORTANTE: Este hook puede causar hydration mismatch si se usa para render condicional.
 * Para render condicional (cambios estructurales), usa `useIsMobileSafe()` en su lugar.
 * 
 * Para la mayoría de casos, prefiere usar clases Tailwind responsive (CSS-first).
 * Solo usa este hook para lógica condicional, no para render condicional.
 * 
 * @returns {boolean} true si es móvil, false si no
 */
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Establecer valor inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Escuchar cambios
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return isMobile
}

/**
 * Hook useIsMobileSafe - Detección de móvil con protección contra hydration mismatch
 * 
 * Usa esta variante cuando necesites hacer render condicional (cambios estructurales)
 * como bottom nav vs sidebar, o master-detail alternado vs split view.
 * 
 * Retorna un objeto con:
 * - `isMobile`: true/false (solo después de mounted)
 * - `mounted`: true cuando el componente está montado en el cliente
 * 
 * Patrón de uso para render condicional:
 * ```jsx
 * const { isMobile, mounted } = useIsMobileSafe();
 * 
 * // Render neutro hasta que esté mounted
 * if (!mounted) {
 *   return <div>Loading...</div>; // o render desktop por defecto
 * }
 * 
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 * 
 * @returns {{ isMobile: boolean, mounted: boolean }}
 */
export function useIsMobileSafe() {
  const [isMobile, setIsMobile] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof window === 'undefined') return;

    setMounted(true)
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Establecer valor inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Escuchar cambios
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return { 
    isMobile: mounted ? isMobile : false, 
    mounted 
  }
}

/**
 * Breakpoint móvil (exportado para uso externo)
 */
export const MOBILE_BREAKPOINT_PX = MOBILE_BREAKPOINT

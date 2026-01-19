"use client";

import * as React from "react";
import { Loader2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * LogoutOverlay - Pantalla completa que muestra el progreso del logout
 * 
 * Se muestra cuando se está ejecutando un logout para informar al usuario.
 * Cubre toda la pantalla con un overlay y muestra un mensaje visual fluido.
 */
export function LogoutDialog({ open = false }) {
  // ✅ Estado para controlar si el componente está montado en el cliente
  // Esto es crítico para evitar errores de hidratación
  const [mounted, setMounted] = React.useState(false);
  
  // Función para verificar bandera de logout en sessionStorage
  const checkLogoutFlag = React.useCallback(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('__is_logging_out__') === 'true';
  }, []);
  
  // ✅ Estado inicial: Solo usar la prop, NO verificar sessionStorage
  // El servidor siempre renderiza con open=false, el cliente puede cambiar después
  const [isVisible, setIsVisible] = React.useState(false);
  
  // Efecto para montaje: Solo después de montar en cliente verificamos sessionStorage
  React.useEffect(() => {
    setMounted(true);
    
    // ✅ Verificar sessionStorage SOLO después del montaje (solo en cliente)
    // Esto evita errores de hidratación porque el servidor nunca ejecuta esto
    if (checkLogoutFlag()) {
      setIsVisible(true);
    } else if (open) {
      setIsVisible(true);
    }
  }, []); // Solo ejecutar una vez al montar
  
  // Efecto para actualizar cuando cambia la prop `open`
  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else if (mounted && !checkLogoutFlag()) {
      // Solo ocultar si no hay bandera de logout
      setIsVisible(false);
    }
  }, [open, mounted, checkLogoutFlag]);
  
  // ✅ Efecto para detectar cuando el flag se limpia y ocultar el diálogo
  React.useEffect(() => {
    if (!mounted || typeof sessionStorage === 'undefined') return;
    
    const checkFlagRemoved = () => {
      const hasFlag = checkLogoutFlag();
      // Si el flag fue removido y el diálogo está visible, ocultarlo
      if (!hasFlag && isVisible && !open) {
        setIsVisible(false);
      }
    };
    
    // Verificar periódicamente si el flag fue removido
    const flagCheckInterval = setInterval(checkFlagRemoved, 200);
    
    return () => clearInterval(flagCheckInterval);
  }, [mounted, isVisible, open, checkLogoutFlag]);
  
  // Verificar periódicamente sessionStorage para mantener visible durante redirecciones
  React.useEffect(() => {
    if (!mounted || typeof sessionStorage === 'undefined') return;
    
    // Verificar inmediatamente si hay flag de logout
    if (checkLogoutFlag() && !isVisible) {
      setIsVisible(true);
    }
    
    let cleanupTimer = null;
    
    const interval = setInterval(() => {
      const hasLogoutFlag = checkLogoutFlag();
      
      // Si hay flag y no está visible, mostrarlo
      if (hasLogoutFlag && !isVisible) {
        setIsVisible(true);
      }
      
      // ✅ Si NO hay flag y está visible, ocultarlo inmediatamente
      if (!hasLogoutFlag && isVisible && !open) {
        setIsVisible(false);
        if (cleanupTimer) {
          clearTimeout(cleanupTimer);
          cleanupTimer = null;
        }
      }
      
      // ✅ NO limpiar el flag aquí - eso lo hace page.js
      // Solo ocultar el diálogo si el flag fue removido
      // La limpieza del flag se hace en page.js para mantener la lógica centralizada
    }, 150); // Verificar cada 150ms para respuesta más rápida
    
    return () => {
      clearInterval(interval);
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
      }
    };
  }, [isVisible, checkLogoutFlag, mounted, open]);

  // ✅ NO renderizar nada en el servidor para evitar errores de hidratación
  // Solo renderizar después de que el componente esté montado en el cliente
  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed inset-0 z-[99999]",
            "bg-background",
            "flex items-center justify-center",
            "overflow-hidden"
          )}
          style={{ 
            pointerEvents: 'auto',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            zIndex: 99999,
            isolation: 'isolate',
          }}
        >
          {/* Contenido centrado con animación */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-6 px-4"
          >
            {/* Icono de logout animado */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className={cn(
                "w-24 h-24 rounded-full",
                "bg-primary/10 flex items-center justify-center",
                "border-2 border-primary/30 shadow-lg",
                "relative z-10"
              )}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <LogOut className="w-12 h-12 text-primary" />
                </motion.div>
              </div>
              {/* Spinner decorativo alrededor del icono */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Loader2 className="w-32 h-32 text-primary/20 absolute" />
              </motion.div>
            </motion.div>

            {/* Texto principal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <h2 className={cn(
                "text-2xl font-semibold",
                "text-foreground"
              )}>
                Cerrando sesión...
              </h2>
              <p className={cn(
                "text-muted-foreground text-center max-w-md",
                "text-base"
              )}>
                Por favor espera mientras cerramos tu sesión de forma segura.
              </p>
            </motion.div>

            {/* Indicador de progreso animado */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="w-64 h-1 bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ width: "40%" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


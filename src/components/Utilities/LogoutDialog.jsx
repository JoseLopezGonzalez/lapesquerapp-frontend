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
  // Función para verificar bandera de logout en sessionStorage
  const checkLogoutFlag = React.useCallback(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('__is_logging_out__') === 'true';
  }, []);
  
  // Estado inicial: solo usar la prop para evitar errores de hidratación
  // NO verificar sessionStorage aquí para evitar diferencias servidor/cliente
  const [isVisible, setIsVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  // Efecto para montaje: verificar sessionStorage solo después de montar en cliente
  React.useEffect(() => {
    setMounted(true);
    
    // Verificar sessionStorage después del montaje
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
  
  // Verificar periódicamente sessionStorage para mantener visible durante redirecciones
  React.useEffect(() => {
    if (!mounted || typeof sessionStorage === 'undefined') return;
    
    const interval = setInterval(() => {
      if (checkLogoutFlag() && !isVisible) {
        setIsVisible(true);
      }
    }, 100);
    
    // Si estamos en la página de login/home después de logout, mantener visible brevemente
    const checkLoginPage = () => {
      if (typeof window !== 'undefined') {
        const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
        if (isLoginPage && checkLogoutFlag() && isVisible) {
          // Mantener visible durante la transición
          const timer = setTimeout(() => {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem('__is_logging_out__');
              sessionStorage.removeItem('__is_logging_out_time__');
            }
            setIsVisible(false);
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    };
    
    checkLoginPage();
    const pageCheckInterval = setInterval(checkLoginPage, 300);
    
    return () => {
      clearInterval(interval);
      clearInterval(pageCheckInterval);
    };
  }, [isVisible, checkLogoutFlag, mounted]);

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


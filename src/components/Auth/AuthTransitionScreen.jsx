"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { useAuthTransition, AUTH_TRANSITION_STATES } from '@/hooks/useAuthTransition';
import { 
  logoEntrance, 
  textStagger, 
  successCheckmark, 
  errorShake,
  iconRotation
} from '@/lib/auth-transition-presets';
import { CheckCircle2, XCircle, LogOut, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * AuthTransitionScreen - Pantalla de transición a pantalla completa
 * 
 * Experiencia tipo App Launch para procesos de autenticación.
 * Bloquea toda interacción y sustituye loaders/toasts.
 * 
 * Características:
 * - Pantalla completa con overlay
 * - Animaciones suaves y progresivas
 * - Branding dinámico por tenant
 * - Soporte para dark mode
 * - Respeto a prefers-reduced-motion
 */
export function AuthTransitionScreen() {
  const { state, errorMessage, isActive } = useAuthTransition();
  const prefersReducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [brandingImageUrl, setBrandingImageUrl] = useState('/images/landing.png');

  // Textos por estado
  const stateTexts = {
    [AUTH_TRANSITION_STATES.LOGIN]: [
      'Iniciando sesión...',
      'Validando credenciales...',
      'Casi listo...',
    ],
    [AUTH_TRANSITION_STATES.LOGOUT]: [
      'Cerrando sesión...',
      'Finalizando...',
      'Redirigiendo...',
    ],
    [AUTH_TRANSITION_STATES.SUCCESS]: [
      '¡Bienvenido de nuevo!',
    ],
    [AUTH_TRANSITION_STATES.ERROR]: [
      errorMessage || 'Error de autenticación',
    ],
  };

  // Obtener branding dinámico
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    const brandingPath = `/images/tenants/${subdomain}/image.png`;
    setBrandingImageUrl(brandingPath);
  }, []);

  // Simular progreso para estados async
  useEffect(() => {
    if (state === AUTH_TRANSITION_STATES.LOGIN || state === AUTH_TRANSITION_STATES.LOGOUT) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // No llegar al 100% hasta completar
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    } else if (state === AUTH_TRANSITION_STATES.SUCCESS) {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [state]);

  // Rotar textos en estados de carga
  useEffect(() => {
    if (state === AUTH_TRANSITION_STATES.LOGIN || state === AUTH_TRANSITION_STATES.LOGOUT) {
      const texts = stateTexts[state];
      if (!texts || texts.length === 0) return;
      
      let index = 0;
      setCurrentText(texts[0]);

      const interval = setInterval(() => {
        index = (index + 1) % texts.length;
        setCurrentText(texts[index]);
      }, 2000);

      return () => clearInterval(interval);
    } else {
      setCurrentText(stateTexts[state]?.[0] || '');
    }
  }, [state]);

  if (!isActive) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className={cn(
          "fixed inset-0 z-[99999]",
          "bg-background/95 backdrop-blur-sm",
          "flex items-center justify-center",
          "overflow-hidden",
          "pointer-events-auto"
        )}
        style={{
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
        <div className="flex flex-col items-center justify-center gap-8 px-4 max-w-md w-full">
          {/* Logo/Icono Principal */}
          <motion.div
            {...(prefersReducedMotion ? {} : logoEntrance)}
            className="relative"
          >
            {state === AUTH_TRANSITION_STATES.SUCCESS ? (
              <motion.div
                {...(prefersReducedMotion ? {} : successCheckmark)}
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-lg"
              >
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </motion.div>
            ) : state === AUTH_TRANSITION_STATES.ERROR ? (
              <motion.div
                {...(prefersReducedMotion ? {} : errorShake)}
                className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/30 shadow-lg"
              >
                <XCircle className="w-12 h-12 text-destructive" />
              </motion.div>
            ) : state === AUTH_TRANSITION_STATES.LOGOUT ? (
              <motion.div
                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                transition={prefersReducedMotion ? {} : {
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-lg"
              >
                <LogOut className="w-12 h-12 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                className="relative w-32 h-32"
              >
                <Image
                  src={brandingImageUrl}
                  alt="La PesquerApp"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/images/landing.png';
                  }}
                />
                {state === AUTH_TRANSITION_STATES.LOGIN && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={prefersReducedMotion ? {} : { rotate: 360 }}
                    transition={prefersReducedMotion ? {} : {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Loader2 className="w-40 h-40 text-primary/20 absolute" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Texto Principal */}
          <motion.div
            key={currentText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <h2 className={cn(
              "text-2xl font-semibold",
              state === AUTH_TRANSITION_STATES.ERROR ? "text-destructive" : "text-foreground"
            )}>
              {currentText}
            </h2>
            {state === AUTH_TRANSITION_STATES.SUCCESS && (
              <p className="text-muted-foreground text-sm">
                Redirigiendo...
              </p>
            )}
          </motion.div>

          {/* Barra de Progreso (solo para login/logout) */}
          {(state === AUTH_TRANSITION_STATES.LOGIN || state === AUTH_TRANSITION_STATES.LOGOUT) && (
            <motion.div
              className="w-full max-w-xs h-1 bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


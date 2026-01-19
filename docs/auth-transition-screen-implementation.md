# Implementación: Pantalla de Transición Auth (App Launch Experience)

## 📋 Resumen Ejecutivo

Este documento describe la implementación de una **pantalla de transición a pantalla completa** para los flujos de login y logout de La PesquerApp, diseñada como una experiencia visual tipo **App Launch / Auth Experience Screen** que sustituye completamente cualquier loader o toast durante los procesos de autenticación.

### Objetivos

- ✅ Pantalla de transición a pantalla completa que bloquea toda interacción
- ✅ Sustituir completamente loaders y toasts durante login/logout
- ✅ Animaciones suaves y progresivas con Framer Motion
- ✅ Diseño minimalista, branded y elegante (enterprise modern)
- ✅ Arquitectura reutilizable y controlada por estado
- ✅ Integración fluida con NextAuth y sistema existente
- ✅ Experiencia tipo App Launch, no loader tradicional

---

## 🎯 Análisis del Estado Actual

### Flujo de Login Actual

**Archivo**: `src/components/LoginPage/index.js`

```javascript
// Estado actual:
1. Usuario envía credenciales
2. setLoading(true) → Muestra botón "Entrando..."
3. signIn("credentials", { redirect: false })
4. toast.success("Inicio de sesión exitoso")
5. window.location.href = redirectTo
```

**Problemas identificados**:
- ❌ No hay transición visual durante el proceso
- ❌ Toast aparece brevemente antes de redirección
- ❌ No hay feedback visual del progreso
- ❌ Experiencia fragmentada

### Flujo de Logout Actual

**Archivos**: Múltiples puntos de entrada (Sidebar, Navbar, etc.)

```javascript
// Estado actual:
1. logoutBackend() → Revoca token
2. signOut({ redirect: false })
3. toast.success("Sesión cerrada correctamente")
4. window.location.replace('/')
```

**Problemas identificados**:
- ❌ LogoutDialog existe pero es básico
- ❌ Aparecen loaders genéricos durante redirección
- ❌ No hay transición fluida
- ❌ Experiencia no cohesiva

### Componentes Existentes

- ✅ `LogoutDialog.jsx` - Básico, solo para logout
- ✅ `Loader` - Genérico, no branded
- ✅ Framer Motion ya instalado (v11.18.2)
- ✅ Motion presets en `src/lib/motion-presets.js`
- ✅ Sistema de branding por tenant

---

## 🏗️ Arquitectura Propuesta

### Componente Principal: `AuthTransitionScreen`

**Ubicación**: `src/components/Auth/AuthTransitionScreen.jsx`

**Responsabilidades**:
- Renderizar pantalla completa con overlay
- Gestionar estados: `login`, `logout`, `success`, `error`
- Coordinar animaciones progresivas
- Bloquear interacción completamente
- Integrar branding dinámico

### Hook de Control: `useAuthTransition`

**Ubicación**: `src/hooks/useAuthTransition.js`

**Responsabilidades**:
- Gestionar estado global de transición
- Sincronizar con sessionStorage para persistencia
- Proporcionar API simple para activar/desactivar
- Integrar con NextAuth

### Integración con NextAuth

**Estrategia**:
- Interceptar `signIn()` y `signOut()` de NextAuth
- Activar transición antes de operaciones async
- Mantener transición durante todo el proceso
- Limpiar estado al completar

---

## 🎨 Diseño Visual y Estados

### Estados de la Transición

#### 1. **LOGIN** - Iniciando Sesión

**Elementos visuales**:
- Logo de La PesquerApp (entrada desde abajo con fade)
- Texto: "Iniciando sesión..." → "Validando credenciales..." → "Casi listo..."
- Indicador de progreso animado (barra progresiva)
- Fondo: Gradiente sutil con branding

**Animaciones**:
- Logo: `scale: 0.8 → 1` con `opacity: 0 → 1` (400ms)
- Texto: Stagger animation (cada cambio de texto)
- Barra: Progreso de 0% → 100% (sincronizado con estados)

#### 2. **LOGOUT** - Cerrando Sesión

**Elementos visuales**:
- Icono de logout (rotación suave)
- Texto: "Cerrando sesión..." → "Finalizando..." → "Redirigiendo..."
- Indicador circular animado
- Fondo: Gradiente más oscuro

**Animaciones**:
- Icono: Rotación continua + pulso
- Texto: Fade in/out entre cambios
- Indicador: Spinner circular con gradiente

#### 3. **SUCCESS** - Sesión Iniciada Exitosamente

**Elementos visuales**:
- Checkmark animado (scale + fade)
- Texto: "¡Bienvenido de nuevo!"
- Logo con brillo sutil
- Transición rápida antes de redirección

**Animaciones**:
- Checkmark: `scale: 0 → 1.2 → 1` (spring)
- Logo: Brillo pulsante
- Fade out completo antes de redirección

#### 4. **ERROR** - Error de Autenticación

**Elementos visuales**:
- Icono de error (shake animation)
- Texto: Mensaje de error específico
- Botón "Reintentar" (opcional)
- Fondo: Tono ligeramente rojizo

**Animaciones**:
- Icono: Shake horizontal
- Texto: Fade in con slide up
- Botón: Aparece después de 500ms

### Paleta de Colores y Branding

**Colores base**:
- Fondo: `bg-background` (soporta dark mode)
- Primary: `text-primary` (color de marca)
- Overlay: `bg-background/95 backdrop-blur-sm`

**Branding dinámico**:
- Logo: `/images/tenants/{subdomain}/image.png` (fallback a `/images/landing.png`)
- Nombre: "La PesquerApp" (configurable)
- Gradientes: Basados en colores primarios del tenant

### Responsive y Accesibilidad

- ✅ Pantalla completa en todos los dispositivos
- ✅ Soporte para `prefers-reduced-motion`
- ✅ Contraste adecuado (WCAG AA)
- ✅ Focus trap durante transición
- ✅ ARIA labels apropiados

---

## 📐 Estructura de Archivos

```
src/
├── components/
│   └── Auth/
│       ├── AuthTransitionScreen.jsx      # Componente principal
│       ├── AuthTransitionStates.jsx      # Componentes por estado
│       └── AuthTransitionProvider.jsx    # Context provider (opcional)
│
├── hooks/
│   ├── useAuthTransition.js              # Hook de control
│   └── useAuthTransitionState.js         # Hook de estado interno
│
├── lib/
│   └── auth-transition-presets.js        # Presets de animación específicos
│
└── services/
    └── authTransitionService.js          # Servicio de gestión de estado
```

---

## 🔧 Implementación Detallada

### Fase 1: Presets de Animación Específicos

**Archivo**: `src/lib/auth-transition-presets.js`

```javascript
/**
 * Presets de animación específicos para AuthTransitionScreen
 * Extiende motion-presets.js con animaciones más elaboradas
 */

import { useReducedMotion } from 'framer-motion';

/**
 * Logo entrance - Entrada del logo principal
 */
export const logoEntrance = {
  initial: { 
    opacity: 0, 
    scale: 0.8, 
    y: 30 
  },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: -20 
  },
  transition: { 
    type: "spring",
    damping: 20,
    stiffness: 300,
    duration: 0.4
  }
};

/**
 * Text stagger - Animación de texto con stagger
 */
export const textStagger = {
  initial: { 
    opacity: 0, 
    y: 10 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    y: -10 
  },
  transition: { 
    duration: 0.3, 
    ease: "easeOut" 
  }
};

/**
 * Progress bar - Barra de progreso animada
 */
export const progressBar = {
  initial: { 
    scaleX: 0 
  },
  animate: { 
    scaleX: 1 
  },
  transition: { 
    duration: 0.6, 
    ease: "easeInOut" 
  }
};

/**
 * Success checkmark - Checkmark de éxito
 */
export const successCheckmark = {
  initial: { 
    scale: 0, 
    opacity: 0 
  },
  animate: { 
    scale: [0, 1.2, 1], 
    opacity: 1 
  },
  transition: { 
    type: "spring",
    damping: 15,
    stiffness: 400,
    duration: 0.5
  }
};

/**
 * Error shake - Shake para errores
 */
export const errorShake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
  },
  transition: {
    duration: 0.5,
    ease: "easeInOut"
  }
};

/**
 * Hook para obtener transición respetando prefers-reduced-motion
 */
export function useAuthTransition(preset) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return {
      ...preset,
      transition: { duration: 0 }
    };
  }
  
  return preset;
}
```

---

### Fase 2: Hook de Control

**Archivo**: `src/hooks/useAuthTransition.js`

```javascript
"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Estados posibles de la transición
 */
export const AUTH_TRANSITION_STATES = {
  IDLE: 'idle',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Hook para controlar la pantalla de transición de autenticación
 * 
 * @returns {object} { state, setState, isActive, showLogin, showLogout, showSuccess, showError, hide }
 */
export function useAuthTransition() {
  const [state, setState] = useState(AUTH_TRANSITION_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState(null);

  // Verificar sessionStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    const storedState = sessionStorage.getItem('__auth_transition_state__');
    if (storedState && Object.values(AUTH_TRANSITION_STATES).includes(storedState)) {
      setState(storedState);
    }
  }, []);

  // Sincronizar con sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    if (state === AUTH_TRANSITION_STATES.IDLE) {
      sessionStorage.removeItem('__auth_transition_state__');
    } else {
      sessionStorage.setItem('__auth_transition_state__', state);
    }
  }, [state]);

  const showLogin = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.LOGIN);
    setErrorMessage(null);
  }, []);

  const showLogout = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.LOGOUT);
    setErrorMessage(null);
  }, []);

  const showSuccess = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.SUCCESS);
    setErrorMessage(null);
  }, []);

  const showError = useCallback((message = 'Error de autenticación') => {
    setState(AUTH_TRANSITION_STATES.ERROR);
    setErrorMessage(message);
  }, []);

  const hide = useCallback(() => {
    setState(AUTH_TRANSITION_STATES.IDLE);
    setErrorMessage(null);
  }, []);

  return {
    state,
    setState,
    errorMessage,
    isActive: state !== AUTH_TRANSITION_STATES.IDLE,
    showLogin,
    showLogout,
    showSuccess,
    showError,
    hide,
  };
}
```

---

### Fase 3: Componente Principal

**Archivo**: `src/components/Auth/AuthTransitionScreen.jsx`

```javascript
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { useAuthTransition, AUTH_TRANSITION_STATES } from '@/hooks/useAuthTransition';
import { 
  logoEntrance, 
  textStagger, 
  progressBar, 
  successCheckmark, 
  errorShake 
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
 */
export function AuthTransitionScreen() {
  const { state, errorMessage, isActive } = useAuthTransition();
  const prefersReducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('');

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

  // Simular progreso para estados async
  useEffect(() => {
    if (state === AUTH_TRANSITION_STATES.LOGIN || state === AUTH_TRANSITION_STATES.LOGOUT) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // No llegar al 100% hasta completar
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [state]);

  // Rotar textos en estados de carga
  useEffect(() => {
    if (state === AUTH_TRANSITION_STATES.LOGIN || state === AUTH_TRANSITION_STATES.LOGOUT) {
      const texts = stateTexts[state];
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

  // Obtener branding
  const [brandingImageUrl, setBrandingImageUrl] = useState('/images/landing.png');
  
  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    const brandingPath = `/images/tenants/${subdomain}/image.png`;
    setBrandingImageUrl(brandingPath);
  }, []);

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
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30"
              >
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </motion.div>
            ) : state === AUTH_TRANSITION_STATES.ERROR ? (
              <motion.div
                {...(prefersReducedMotion ? {} : errorShake)}
                className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/30"
              >
                <XCircle className="w-12 h-12 text-destructive" />
              </motion.div>
            ) : state === AUTH_TRANSITION_STATES.LOGOUT ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30"
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
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 2,
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
```

---

### Fase 4: Integración con LoginPage

**Archivo**: `src/components/LoginPage/index.js`

**Modificaciones**:

```javascript
// 1. Importar hook y componente
import { useAuthTransition } from '@/hooks/useAuthTransition';
import { AuthTransitionScreen } from '@/components/Auth/AuthTransitionScreen';

export default function LoginPage() {
  // ... estados existentes ...
  const { showLogin, showSuccess, showError, hide } = useAuthTransition();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!tenantActive) {
      toast.error("La suscripción está caducada o no ha sido renovada", getToastTheme());
      return;
    }

    // ✅ Activar transición ANTES de iniciar proceso
    showLogin();
    
    // ❌ NO usar setLoading(true) - la transición lo reemplaza
    // setLoading(true); // ELIMINAR
    
    try {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("from") || "/admin/home";

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        setEmail("");
        setPassword("");
        
        // ✅ Mostrar error en transición
        showError(
          result?.error === "CredentialsSignin"
            ? "Datos de acceso incorrectos"
            : result?.error || "Error al iniciar sesión"
        );
        
        // Esperar 2 segundos antes de ocultar
        setTimeout(() => {
          hide();
        }, 2000);
        
        return;
      }

      // ✅ Mostrar éxito en transición
      showSuccess();
      
      // ❌ NO usar toast - la transición lo reemplaza
      // toast.success("Inicio de sesión exitoso", getToastTheme()); // ELIMINAR
      
      // Redirigir después de mostrar éxito brevemente
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1000);
      
    } catch (err) {
      // ✅ Mostrar error en transición
      showError(err.message);
      
      setTimeout(() => {
        hide();
      }, 2000);
    } finally {
      // ❌ NO usar setLoading(false) - la transición lo reemplaza
      // setLoading(false); // ELIMINAR
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ✅ Renderizar pantalla de transición */}
      <AuthTransitionScreen />
      
      {/* ... resto del componente ... */}
    </div>
  );
}
```

---

### Fase 5: Integración con Logout

**Archivo**: `src/components/Admin/Layout/SideBar/index.js` (y otros puntos de logout)

**Modificaciones**:

```javascript
// 1. Importar hook y componente
import { useAuthTransition } from '@/hooks/useAuthTransition';
import { AuthTransitionScreen } from '@/components/Auth/AuthTransitionScreen';

export function AppSidebar() {
  // ... código existente ...
  const { showLogout } = useAuthTransition();

  const handleLogout = async () => {
    // ✅ Activar transición INMEDIATAMENTE
    showLogout();
    
    try {
      // Importar servicio de logout
      const { logout: logoutBackend } = await import('@/services/authService');
      
      // Ejecutar logout backend
      await logoutBackend();
      
      // Cerrar sesión NextAuth
      await signOut({ redirect: false });
      
      // ❌ NO usar toast - la transición lo reemplaza
      // toast.success('Sesión cerrada correctamente'); // ELIMINAR
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        window.location.replace('/');
      }, 800);
      
    } catch (error) {
      console.error('Error en logout:', error);
      // Continuar con logout incluso si falla
      await signOut({ redirect: false });
      setTimeout(() => {
        window.location.replace('/');
      }, 800);
    }
  };

  return (
    <>
      {/* ✅ Renderizar pantalla de transición */}
      <AuthTransitionScreen />
      
      {/* ... resto del componente ... */}
    </>
  );
}
```

---

### Fase 6: Integración Global en Layout

**Archivo**: `src/app/ClientLayout.jsx` (o layout principal)

**Modificaciones**:

```javascript
import { AuthTransitionScreen } from '@/components/Auth/AuthTransitionScreen';

export default function ClientLayout({ children }) {
  return (
    <>
      {/* ✅ Renderizar pantalla de transición globalmente */}
      <AuthTransitionScreen />
      
      {children}
    </>
  );
}
```

---

### Fase 7: Limpieza de Estado en page.js

**Archivo**: `src/app/page.js`

**Modificaciones**:

```javascript
import { useAuthTransition } from '@/hooks/useAuthTransition';
import { AuthTransitionScreen } from '@/components/Auth/AuthTransitionScreen';

export default function HomePage() {
  const { state, hide } = useAuthTransition();
  // ... resto del código ...

  // Limpiar estado de transición cuando se carga la página de login
  useEffect(() => {
    if (isSubdomain && status === "unauthenticated") {
      // Si llegamos a la página de login, limpiar cualquier transición activa
      const timer = setTimeout(() => {
        hide();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSubdomain, status, hide]);

  return (
    <>
      <AuthTransitionScreen />
      {/* ... resto del componente ... */}
    </>
  );
}
```

---

## 🔄 Flujos Completos

### Flujo de Login

```
1. Usuario envía credenciales
   ↓
2. showLogin() → AuthTransitionScreen aparece (pantalla completa)
   ↓
3. Animación: Logo entra, texto "Iniciando sesión..."
   ↓
4. signIn("credentials") se ejecuta
   ↓
5. Texto cambia a "Validando credenciales..." (progreso 30%)
   ↓
6. Texto cambia a "Casi listo..." (progreso 70%)
   ↓
7a. Si éxito:
    → showSuccess() → Checkmark aparece
    → Texto: "¡Bienvenido de nuevo!"
    → Redirección después de 1s
   
7b. Si error:
    → showError(message) → Icono de error + shake
    → Texto: Mensaje de error
    → hide() después de 2s
```

### Flujo de Logout

```
1. Usuario hace click en "Cerrar Sesión"
   ↓
2. showLogout() → AuthTransitionScreen aparece (pantalla completa)
   ↓
3. Animación: Icono de logout con rotación
   ↓
4. Texto: "Cerrando sesión..."
   ↓
5. logoutBackend() se ejecuta
   ↓
6. Texto cambia a "Finalizando..." (progreso 50%)
   ↓
7. signOut() se ejecuta
   ↓
8. Texto cambia a "Redirigiendo..." (progreso 90%)
   ↓
9. window.location.replace('/')
   ↓
10. Página '/' se carga
    ↓
11. AuthTransitionScreen permanece visible (sessionStorage)
    ↓
12. hide() se ejecuta después de 500ms
    ↓
13. LoginPage se muestra
```

---

## 🎨 Personalización y Branding

### Configuración por Tenant

El componente detecta automáticamente el subdominio y carga la imagen de branding correspondiente:

```javascript
// Ruta esperada: /images/tenants/{subdomain}/image.png
// Fallback: /images/landing.png
```

### Personalización de Textos

Los textos pueden personalizarse mediante props o configuración:

```javascript
<AuthTransitionScreen
  loginTexts={[
    'Conectando...',
    'Verificando...',
    'Listo!',
  ]}
  logoutTexts={[
    'Desconectando...',
    'Limpiando datos...',
    'Hasta pronto!',
  ]}
/>
```

### Personalización de Colores

Los colores se adaptan automáticamente al tema (light/dark) y usan los tokens de Tailwind:

- `bg-background` - Fondo
- `text-primary` - Color principal
- `text-destructive` - Errores
- `bg-primary/10` - Fondos sutiles

---

## ✅ Checklist de Implementación

### Fase 1: Presets de Animación
- [ ] Crear `src/lib/auth-transition-presets.js`
- [ ] Implementar `logoEntrance`
- [ ] Implementar `textStagger`
- [ ] Implementar `progressBar`
- [ ] Implementar `successCheckmark`
- [ ] Implementar `errorShake`
- [ ] Agregar soporte para `prefers-reduced-motion`

### Fase 2: Hook de Control
- [ ] Crear `src/hooks/useAuthTransition.js`
- [ ] Implementar estados: IDLE, LOGIN, LOGOUT, SUCCESS, ERROR
- [ ] Implementar sincronización con sessionStorage
- [ ] Implementar métodos: showLogin, showLogout, showSuccess, showError, hide
- [ ] Probar persistencia entre recargas

### Fase 3: Componente Principal
- [ ] Crear `src/components/Auth/AuthTransitionScreen.jsx`
- [ ] Implementar renderizado por estado
- [ ] Implementar animaciones con Framer Motion
- [ ] Implementar barra de progreso
- [ ] Implementar rotación de textos
- [ ] Implementar branding dinámico
- [ ] Agregar soporte para dark mode
- [ ] Agregar accesibilidad (ARIA labels)

### Fase 4: Integración Login
- [ ] Modificar `src/components/LoginPage/index.js`
- [ ] Reemplazar `setLoading` con `showLogin`
- [ ] Reemplazar `toast` con transición
- [ ] Integrar manejo de errores
- [ ] Probar flujo completo

### Fase 5: Integración Logout
- [ ] Modificar `src/components/Admin/Layout/SideBar/index.js`
- [ ] Modificar otros puntos de logout (Navbar, etc.)
- [ ] Reemplazar `toast` con transición
- [ ] Integrar con `logoutBackend()`
- [ ] Probar flujo completo

### Fase 6: Integración Global
- [ ] Agregar `AuthTransitionScreen` a layout principal
- [ ] Verificar que funciona en todas las rutas
- [ ] Probar transiciones entre páginas

### Fase 7: Limpieza y Optimización
- [ ] Limpiar estado en `src/app/page.js`
- [ ] Eliminar `LogoutDialog` antiguo (opcional)
- [ ] Eliminar toasts de login/logout
- [ ] Optimizar rendimiento
- [ ] Probar en diferentes navegadores

### Fase 8: Testing
- [ ] Probar login exitoso
- [ ] Probar login con error
- [ ] Probar logout desde diferentes ubicaciones
- [ ] Probar en mobile
- [ ] Probar en desktop
- [ ] Probar con `prefers-reduced-motion`
- [ ] Probar dark mode
- [ ] Probar diferentes tenants

---

## 🚀 Próximos Pasos

1. **Implementar Fase 1** - Crear presets de animación
2. **Implementar Fase 2** - Crear hook de control
3. **Implementar Fase 3** - Crear componente principal
4. **Implementar Fase 4** - Integrar con login
5. **Implementar Fase 5** - Integrar con logout
6. **Implementar Fase 6** - Integración global
7. **Implementar Fase 7** - Limpieza
8. **Testing completo** - Fase 8

---

## 📚 Referencias

- **Framer Motion**: https://www.framer.com/motion/
- **NextAuth.js**: https://next-auth.js.org/
- **Motion Presets Existentes**: `src/lib/motion-presets.js`
- **LogoutDialog Actual**: `src/components/Utilities/LogoutDialog.jsx`
- **LoginPage Actual**: `src/components/LoginPage/index.js`

---

**Fecha de creación**: 2024  
**Última actualización**: 2024  
**Autor**: Sistema de Documentación


# Plan de Implementación: Pantalla de Cierre de Sesión

## 📋 Resumen Ejecutivo

Este documento analiza en profundidad el flujo de logout y propone una solución completa para que **únicamente** se muestre la pantalla de "Cerrando sesión..." durante todo el proceso, sin que aparezcan loaders genéricos u otros elementos visuales.

---

## 🔍 Análisis del Problema

### 1. Flujo Actual del Logout

```
Usuario hace click en "Cerrar Sesión"
    ↓
1. flushSync(() => setIsLoggingOut(true)) → Muestra LogoutDialog
    ↓
2. sessionStorage.setItem('__is_logging_out__', 'true')
    ↓
3. logoutBackend() → Revoca token en backend
    ↓
4. signOut({ redirect: false }) → Cierra sesión NextAuth
    ↓
5. window.location.replace('/') → Redirige a página de login
    ↓
6. Página '/' se carga → Aquí aparecen los loaders genéricos
    ↓
7. useEffect verifica sessionStorage → Detecta logout flag
    ↓
8. Muestra LogoutDialog → Pero ya se vieron loaders antes
```

### 2. Puntos Críticos Donde Aparecen Loaders

#### **A. Página Principal (`src/app/page.js`)**

**Problema:** La verificación del logout flag ocurre en un `useEffect`, lo que significa que hay un **render inicial** donde se ejecutan las condiciones antes de que el efecto se dispare.

```javascript
// ❌ PROBLEMA: Render inicial antes del useEffect
if (isSubdomain === null) return <Loader />; // Se muestra aquí
if (status === 'loading') return <Loader />; // O aquí
if (status === 'authenticated') return <Loader />; // O aquí

// ✅ SOLUCIÓN: Verificar logout flag ANTES de cualquier render
```

**Loaders que aparecen:**

1. **Línea 77-80:** Cuando `isSubdomain === null` (mientras se determina el subdominio)
2. **Línea 84-87:** Cuando `status === "loading"` (mientras NextAuth verifica la sesión)
3. **Línea 89-92:** Cuando `status === "authenticated"` (mientras se procesa la redirección)

#### **B. Componente LoginPage (`src/components/LoginPage/index.js`)**

**Problema:** Muestra un loader mientras verifica el tenant.

```javascript
// ❌ PROBLEMA: Se muestra antes de verificar logout
if (!tenantChecked) {
  return <Loader />; // Se muestra aquí durante la verificación del tenant
}
```

**Loader que aparece:**

- **Línea 97-100:** Cuando `!tenantChecked` (mientras se verifica el tenant activo)

#### **C. Next.js Loading States**

**Problema:** Next.js tiene archivos `loading.js` en varias rutas que se renderizan automáticamente durante transiciones.

**Archivos encontrados:**

- `src/app/admin/home/loading.js`
- `src/app/admin/orders-manager/loading.js`
- `src/app/admin/stores-manager/loading.js`
- Y muchos más...

**Comportamiento:** Estos archivos se renderizan durante la navegación, incluso si hay una redirección en curso.

#### **D. SessionProvider y useSession**

**Problema:** `useSession()` puede estar en estado `"loading"` durante la transición, causando que componentes que dependen de él muestren loaders.

**Componentes afectados:**

- `AdminRouteProtection` muestra loader cuando `status === "loading"`
- `SettingsProvider` puede estar cargando settings
- Cualquier componente que use `useSession()` y verifique `status === "loading"`

---

## 🎯 Solución Propuesta

### Principio Fundamental

**"La pantalla de logout debe tener la máxima prioridad y debe verificarse ANTES de cualquier otro render condicional."**

### Estrategia de Implementación

#### **1. Verificación Temprana del Logout Flag**

**Objetivo:** Verificar `sessionStorage.__is_logging_out__` **antes** de cualquier render condicional.

**Implementación:**

- Mover la verificación del logout flag al inicio del componente, antes de cualquier `if` o `return`
- Usar un estado inicial que se calcule de forma síncrona (sin `useEffect`)
- Asegurar que el LogoutDialog se renderice inmediatamente si hay un logout en curso

#### **2. Interceptación Global de Loaders**

**Objetivo:** Prevenir que cualquier loader se muestre durante un logout.

**Implementación:**

- Crear un hook `useIsLoggingOut()` que verifique el flag globalmente
- Modificar componentes de Loader para que no se rendericen si hay logout en curso
- Interceptar los archivos `loading.js` de Next.js para verificar el logout antes de renderizar

#### **3. Prioridad de Renderizado**

**Objetivo:** Asegurar que el LogoutDialog siempre esté por encima de todo.

**Implementación:**

- Z-index máximo (`z-[99999]`)
- Renderizado en el nivel más alto de la aplicación (`ClientLayout`)
- Verificación en múltiples puntos de entrada

---

## 📝 Plan de Implementación Detallado

### **Fase 1: Hook Global de Logout**

#### **1.1. Crear Hook `useIsLoggingOut`**

**Archivo:** `src/hooks/useIsLoggingOut.js`

```javascript
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook que verifica si hay un logout en curso
 * Verifica sessionStorage de forma síncrona para evitar renders intermedios
 */
export function useIsLoggingOut() {
  const [isLoggingOut, setIsLoggingOut] = useState(() => {
    // Verificación síncrona en el estado inicial
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return false;
    }
    return sessionStorage.getItem('__is_logging_out__') === 'true';
  });

  useEffect(() => {
    // Verificar periódicamente para mantener sincronizado
    const checkLogout = () => {
      if (typeof sessionStorage !== 'undefined') {
        const flag = sessionStorage.getItem('__is_logging_out__') === 'true';
        setIsLoggingOut(flag);
      }
    };

    checkLogout();
    const interval = setInterval(checkLogout, 100);
    return () => clearInterval(interval);
  }, []);

  return isLoggingOut;
}
```

**Beneficios:**

- Verificación síncrona en el estado inicial
- Disponible en cualquier componente
- Se actualiza automáticamente

---

### **Fase 2: Modificar Página Principal**

#### **2.1. Actualizar `src/app/page.js`**

**Cambios:**

1. Verificar logout flag **antes** de cualquier render condicional
2. Usar el hook `useIsLoggingOut()` para verificación temprana
3. Retornar solo `LogoutDialog` si hay logout en curso

**Código propuesto:**

```javascript
'use client';

import LandingPage from '@/components/LandingPage';
import LoginPage from '@/components/LoginPage';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Utilities/Loader';
import { LogoutDialog } from '@/components/Utilities/LogoutDialog';
import { useIsLoggingOut } from '@/hooks/useIsLoggingOut';

export default function HomePage() {
  // ✅ PRIORIDAD 1: Verificar logout ANTES de cualquier otra lógica
  const isLoggingOut = useIsLoggingOut();

  const [isSubdomain, setIsSubdomain] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Si hay logout en curso, mostrar SOLO el diálogo
  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }

  // ... resto de la lógica ...

  // ✅ Verificar logout también en los estados de carga
  if (isSubdomain === null) {
    // Verificar logout antes de mostrar loader
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('__is_logging_out__') === 'true'
    ) {
      return <LogoutDialog open={true} />;
    }
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isSubdomain) {
    if (status === 'loading') {
      // Verificar logout antes de mostrar loader
      if (
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('__is_logging_out__') === 'true'
      ) {
        return <LogoutDialog open={true} />;
      }
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader />
        </div>
      );
    }

    // ... resto de la lógica ...
  }

  return <LandingPage />;
}
```

---

### **Fase 3: Modificar LoginPage**

#### **3.1. Actualizar `src/components/LoginPage/index.js`**

**Cambios:**

1. Verificar logout flag antes de mostrar el loader de tenant
2. Usar el hook `useIsLoggingOut()` si está disponible

**Código propuesto:**

```javascript
import { useIsLoggingOut } from '@/hooks/useIsLoggingOut';
import { LogoutDialog } from '@/components/Utilities/LogoutDialog';

export default function LoginPage() {
  const isLoggingOut = useIsLoggingOut();
  // ... otros estados ...

  // ✅ Verificar logout antes de mostrar loader de tenant
  if (!tenantChecked) {
    if (
      isLoggingOut ||
      (typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('__is_logging_out__') === 'true')
    ) {
      return <LogoutDialog open={true} />;
    }
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  // ... resto del componente ...
}
```

---

### **Fase 4: Interceptar Loaders Genéricos**

#### **4.1. Modificar Componente Loader**

**Archivo:** `src/components/Utilities/Loader/index.js`

**Cambios:**

1. Verificar logout flag antes de renderizar
2. Retornar `null` si hay logout en curso

**Código propuesto:**

```javascript
import { Loader2 } from 'lucide-react';
import React from 'react';
import { useIsLoggingOut } from '@/hooks/useIsLoggingOut';

const Loader = () => {
  const isLoggingOut = useIsLoggingOut();

  // ✅ No mostrar loader si hay logout en curso
  if (isLoggingOut) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className="text-primary animate-spin" />
      <p className="text-muted-foreground text-sm">Cargando</p>
    </div>
  );
};

export default Loader;
```

---

### **Fase 5: Interceptar Loading States de Next.js**

#### **5.1. Crear Wrapper para Loading States**

**Archivo:** `src/components/Utilities/LogoutAwareLoader.jsx`

**Propósito:** Componente wrapper que verifica logout antes de mostrar cualquier loader.

```javascript
'use client';

import { useIsLoggingOut } from '@/hooks/useIsLoggingOut';
import { LogoutDialog } from '@/components/Utilities/LogoutDialog';
import Loader from '@/components/Utilities/Loader';

/**
 * Wrapper que verifica logout antes de mostrar loaders
 * Útil para archivos loading.js de Next.js
 */
export function LogoutAwareLoader({ children = null }) {
  const isLoggingOut = useIsLoggingOut();

  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }

  return (
    children || (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    )
  );
}
```

#### **5.2. Actualizar Archivos loading.js**

**Ejemplo:** `src/app/admin/home/loading.js`

```javascript
import { LogoutAwareLoader } from '@/components/Utilities/LogoutAwareLoader';

export default function Loading() {
  return <LogoutAwareLoader />;
}
```

---

### **Fase 6: Modificar AdminRouteProtection**

#### **6.1. Actualizar `src/components/AdminRouteProtection/index.js`**

**Cambios:**

1. Verificar logout antes de mostrar loaders
2. Usar `useIsLoggingOut()` hook

**Código propuesto:**

```javascript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsLoggingOut } from '@/hooks/useIsLoggingOut';
import { LogoutDialog } from '@/components/Utilities/LogoutDialog';

export default function AdminRouteProtection({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggingOut = useIsLoggingOut();

  // ✅ Si hay logout en curso, mostrar solo el diálogo
  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }

  // ... resto de la lógica ...

  // ✅ Verificar logout también en estados de loading
  if (status === 'loading') {
    if (isLoggingOut) {
      return <LogoutDialog open={true} />;
    }
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  // ... resto del componente ...
}
```

---

### **Fase 7: Mejorar LogoutDialog**

#### **7.1. Asegurar Render Inmediato**

**Archivo:** `src/components/Utilities/LogoutDialog.jsx`

**Mejoras:**

1. Verificar sessionStorage de forma síncrona en el estado inicial
2. Asegurar que se renderice inmediatamente si hay flag de logout
3. Mantener z-index máximo y aislamiento

**Cambios clave:**

```javascript
export function LogoutDialog({ open = false }) {
  // ✅ Verificación síncrona en estado inicial (solo en cliente)
  const [isVisible, setIsVisible] = React.useState(() => {
    if (typeof window === 'undefined') return open;
    if (typeof sessionStorage === 'undefined') return open;
    return open || sessionStorage.getItem('__is_logging_out__') === 'true';
  });

  // ... resto del componente ...
}
```

---

## 🔧 Implementación Técnica

### **Orden de Prioridad de Verificación**

1. **Nivel 1 - Hook Global:** `useIsLoggingOut()` verifica sessionStorage
2. **Nivel 2 - Componente:** Cada componente verifica antes de renderizar loaders
3. **Nivel 3 - LogoutDialog:** Se renderiza con máxima prioridad si hay flag

### **Estrategia de Verificación**

```javascript
// ✅ CORRECTO: Verificación temprana
function Component() {
  const isLoggingOut = useIsLoggingOut();

  if (isLoggingOut) {
    return <LogoutDialog open={true} />;
  }

  // Resto de la lógica...
}

// ❌ INCORRECTO: Verificación tardía
function Component() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <Loader />; // Se muestra antes de verificar logout
  }

  useEffect(() => {
    // Verificación aquí es demasiado tarde
    if (sessionStorage.getItem('__is_logging_out__')) {
      // ...
    }
  }, []);
}
```

---

## 📊 Checklist de Implementación

### **Fase 1: Hook Global**

- [ ] Crear `src/hooks/useIsLoggingOut.js`
- [ ] Implementar verificación síncrona en estado inicial
- [ ] Agregar actualización periódica con `useEffect`

### **Fase 2: Página Principal**

- [ ] Modificar `src/app/page.js`
- [ ] Agregar verificación temprana con `useIsLoggingOut()`
- [ ] Retornar `LogoutDialog` antes de cualquier otro render

### **Fase 3: LoginPage**

- [ ] Modificar `src/components/LoginPage/index.js`
- [ ] Verificar logout antes del loader de tenant
- [ ] Usar `useIsLoggingOut()` hook

### **Fase 4: Componente Loader**

- [ ] Modificar `src/components/Utilities/Loader/index.js`
- [ ] Agregar verificación de logout
- [ ] Retornar `null` si hay logout en curso

### **Fase 5: Loading States de Next.js**

- [ ] Crear `src/components/Utilities/LogoutAwareLoader.jsx`
- [ ] Actualizar archivos `loading.js` principales
- [ ] Verificar que funcionen correctamente

### **Fase 6: AdminRouteProtection**

- [ ] Modificar `src/components/AdminRouteProtection/index.js`
- [ ] Agregar verificación de logout
- [ ] Retornar `LogoutDialog` si hay logout

### **Fase 7: LogoutDialog**

- [ ] Mejorar verificación síncrona
- [ ] Asegurar z-index máximo
- [ ] Verificar que se renderice inmediatamente

### **Fase 8: Testing**

- [ ] Probar logout desde diferentes ubicaciones
- [ ] Verificar que no aparezcan loaders genéricos
- [ ] Confirmar transición fluida al login
- [ ] Probar en diferentes navegadores

---

## 🎯 Resultado Esperado

### **Flujo Ideal:**

```
Usuario hace click en "Cerrar Sesión"
    ↓
1. LogoutDialog aparece INMEDIATAMENTE (flushSync)
    ↓
2. sessionStorage.__is_logging_out__ = 'true'
    ↓
3. Proceso de logout (backend + NextAuth)
    ↓
4. window.location.replace('/')
    ↓
5. Página '/' se carga
    ↓
6. useIsLoggingOut() detecta flag → Retorna true INMEDIATAMENTE
    ↓
7. LogoutDialog se muestra (sin loaders intermedios)
    ↓
8. Página de login se carga completamente
    ↓
9. LogoutDialog desaparece después de 600ms
    ↓
10. Usuario ve página de login
```

### **Características:**

✅ **Sin loaders genéricos** durante toda la transición  
✅ **Pantalla de logout visible** desde el inicio hasta el final  
✅ **Transición fluida** sin parpadeos  
✅ **Sin contenido visible** debajo del diálogo  
✅ **Funciona en todas las rutas** y puntos de entrada

---

## 🔍 Análisis de Casos Edge

### **Caso 1: Logout durante carga de página**

**Escenario:** Usuario hace logout mientras una página está cargando.

**Solución:** `useIsLoggingOut()` detecta el flag y previene que se muestren loaders.

### **Caso 2: Múltiples redirecciones**

**Escenario:** El logout causa múltiples redirecciones (ej: `/admin/home` → `/` → `/login`).

**Solución:** El flag persiste en sessionStorage y se verifica en cada página.

### **Caso 3: Error durante logout**

**Escenario:** El logout falla pero el flag queda activo.

**Solución:** `ClientLayout` limpia flags antiguos (>10 segundos) al iniciar.

### **Caso 4: Navegación durante logout**

**Escenario:** Usuario intenta navegar mientras se está cerrando sesión.

**Solución:** El LogoutDialog bloquea la interacción (z-index máximo, pointer-events).

---

## 📚 Referencias

- **Next.js Loading States:** https://nextjs.org/docs/app/api-reference/file-conventions/loading
- **React Hydration:** https://react.dev/reference/react-dom/client/hydrateRoot
- **SessionStorage API:** https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
- **Framer Motion AnimatePresence:** https://www.framer.com/motion/animate-presence/

---

## 🚀 Próximos Pasos

1. **Implementar Fase 1** (Hook Global)
2. **Implementar Fase 2** (Página Principal)
3. **Implementar Fase 3** (LoginPage)
4. **Implementar Fase 4** (Componente Loader)
5. **Implementar Fase 5** (Loading States)
6. **Implementar Fase 6** (AdminRouteProtection)
7. **Implementar Fase 7** (LogoutDialog)
8. **Testing completo** (Fase 8)

---

**Fecha de creación:** 2024  
**Última actualización:** 2024  
**Autor:** Sistema de Documentación

# Plan de Implementación: Layout y Navegación Principal

## 📋 Descripción

Adaptación del layout principal y sistema de navegación para mobile. Incluye:
- Sidebar desktop → Bottom Navigation mobile
- Layout responsive (desktop/mobile)
- Navegación adaptativa
- Integración con layout actual

---

## 🎯 Objetivos

1. ✅ **Sidebar en desktop** (mantener actual)
2. ✅ **Bottom Navigation en mobile** (nueva implementación)
3. ✅ **Layout responsive** que se adapta según dispositivo
4. ✅ **Navegación consistente** entre desktop y mobile
5. ✅ **Respetar safe areas** iOS (notch, etc.)
6. ✅ **Patrón Master-Detail** preparado para mobile

---

## 📊 Estado Actual

### Layout Actual (`src/app/admin/layout.js`)

**Estructura**:
```jsx
<AdminRouteProtection>
  <SidebarProvider>
    <AppSidebar /> {/* Sidebar izquierda */}
    <main>
      <SidebarTrigger /> {/* Botón hamburguesa */}
      {children}
    </main>
  </SidebarProvider>
</AdminRouteProtection>
```

**Características**:
- ✅ Sidebar de ShadCN UI (`collapsible="icon"`, `variant='floating'`)
- ✅ Sidebar width: 18rem desktop, 16rem mobile
- ✅ Sidebar con:
  - `AppSwitcher` (header con logo/app)
  - `NavManagers` (gestores: Orders, Stores, etc.)
  - `NavMain` (navegación principal)
  - `NavUser` (footer con usuario y logout)

### Sidebar Actual (`src/components/Admin/Layout/SideBar/index.js`)

**Componentes**:
- ✅ `AppSwitcher` - Selector de app/logo
- ✅ `NavManagers` - Gestores principales
- ✅ `NavMain` - Navegación con submenús
- ✅ `NavUser` - Usuario y logout

**Navegación**:
- ✅ Configurada en `src/configs/navgationConfig.js`
- ✅ Filtrada por roles del usuario
- ✅ Rutas activas detectadas automáticamente

### Comportamiento Mobile Actual

- ✅ Sidebar se convierte en Sheet en mobile (ShadCN UI)
- ✅ `SidebarTrigger` abre/cierra el Sheet
- ⚠️ **Problema**: Usuario tiene que abrir Sheet cada vez para navegar
- ⚠️ **Problema**: No hay navegación visible permanente en mobile

---

## 🎨 Diseño Propuesto

### Desktop (≥768px)

**Layout**:
```
┌─────────────────────────────────────────┐
│  Sidebar  │  Main Content              │
│  (fixed)  │  (flexible)                │
│           │                             │
│  [Logo]   │  [SidebarTrigger]          │
│  [Nav]    │  [Children]                │
│  [User]   │                             │
└─────────────────────────────────────────┘
```

**Características**:
- Sidebar fija a la izquierda
- Ancho: 18rem (colapsada: iconos)
- Main content flexible
- SidebarTrigger visible (colapsar/expandir)

### Mobile (<768px)

**Layout**:
```
┌─────────────────────────┐
│  [Top Bar]              │
│  (logo, menu, user)     │
├─────────────────────────┤
│                         │
│  Main Content           │
│  (children)             │
│                         │
├─────────────────────────┤
│  Bottom Navigation      │
│  [Home] [Orders] [... ] │
│  (4-5 items máximo)     │
└─────────────────────────┘
```

**Características**:
- Top bar: Logo, botón menú (Sheet), usuario
- Main content: Área flexible
- Bottom Navigation: Fija abajo (4-5 items principales)
- Safe areas: `pb-[env(safe-area-inset-bottom)]`

---

## 🔄 Cambios Necesarios

### 1. Crear Bottom Navigation Component

**Archivo**: `src/components/Admin/Layout/BottomNav/index.jsx`

**Componentes necesarios**:
- `BottomNav` - Componente principal
- `BottomNavItem` - Item individual
- `BottomNavBadge` - Badge para notificaciones (opcional)

**Características**:
- ✅ Máximo 4-5 items
- ✅ Iconos + labels cortos
- ✅ Indicador de ruta activa
- ✅ Safe areas iOS
- ✅ Animación con Framer Motion (`feedbackPop`)
- ✅ Touch targets mínimo 44x44px

**Items principales** (sugeridos):
1. Home/Dashboard
2. Orders (gestor principal)
3. Stores/Almacenes (gestor principal)
4. Más... (menu secundario en Sheet)

**⚠️ Regla importante: Qué NO va en BottomNav**

BottomNav **solo** navegación primaria:
- ✅ Solo rutas principales (Home, Orders, Stores, etc.)
- ❌ **NUNCA** acciones destructivas (eliminar, desactivar, etc.)
- ❌ **NUNCA** configuraciones o ajustes
- ❌ **NUNCA** logout o sesión
- ❌ **NUNCA** acciones contextuales

Todo lo anterior va siempre al **Sheet del TopBar** (navegación completa).

### 2. Crear Top Bar Component

**Archivo**: `src/components/Admin/Layout/TopBar/index.jsx`

**Características**:
- ✅ Logo (izquierda)
- ✅ Botón menú (Sheet con navegación completa) - izquierda
- ✅ Usuario/Dropdown - derecha
- ✅ Altura fija (h-14 o h-16)
- ✅ Safe areas iOS (`pt-[env(safe-area-inset-top)]`)

**⚠️ Regla importante: TopBar Sheet vs BottomNav**

**Coherencia cognitiva**:
- **Sheet del TopBar** = "todo" (navegación completa)
- **BottomNav** = "rápido" (acceso rápido a principales)

**Principio**:
- Si un item está en **BottomNav**, **también debe estar** en el Sheet
- **Pero no al revés**: El Sheet puede tener más items que BottomNav

**Razón**: Esto mantiene coherencia mental - el usuario siempre puede encontrar todo en el Sheet, y BottomNav es solo un atajo.

### 3. Modificar Admin Layout

**Archivo**: `src/app/admin/layout.js`

**Cambios**:
- ✅ Detectar mobile/desktop (`useIsMobileSafe`)
- ✅ Renderizar Sidebar en desktop
- ✅ Renderizar TopBar + BottomNav en mobile
- ✅ Main content con padding adecuado (top bar + bottom nav)

### 4. Modificar Sidebar

**Archivo**: `src/components/Admin/Layout/SideBar/index.js`

**Cambios**:
- ✅ Mantener funcionalidad actual
- ✅ Opcional: Ajustar para que se abra como Sheet en mobile
- ✅ Reutilizar componentes de navegación (`NavMain`, `NavManagers`, `NavUser`)

### 5. Crear Layout Wrapper

**Archivo**: `src/components/Admin/Layout/ResponsiveLayout/index.jsx`

**⚠️ Responsabilidad clara de ResponsiveLayout**

ResponsiveLayout **NO decide estilos**, solo:
- ✅ Qué layout renderizar (desktop vs mobile)
- ✅ Qué navegación mostrar (Sidebar vs TopBar + BottomNav)
- ✅ Safe areas estructurales (padding top/bottom)

**ResponsiveLayout NO hace**:
- ❌ Estilos visuales (eso lo hacen los componentes hijos)
- ❌ Lógica de negocio
- ❌ Gestión de estado compleja

**Razón**: Evita que se convierta en un "Dios componente". ResponsiveLayout es solo un **router de layouts**, no un componente de presentación.

---

## 📐 Design Tokens a Usar

### Bottom Navigation
- **Altura**: `h-16` (64px) + safe area
- **Padding**: `px-4 py-2`
- **Gap entre items**: `gap-1`
- **Icono**: `w-6 h-6`
- **Texto**: `text-xs`
- **Fondo**: `bg-background border-t`

### Top Bar
- **Altura**: `h-14` (56px) + safe area
- **Padding**: `px-4 py-2`
- **Logo**: `h-10` o `h-12`
- **Fondo**: `bg-background border-b`

### Main Content
- **Padding mobile**: `pt-16 pb-20` (top bar + bottom nav)
- **Padding desktop**: `p-2` (actual)

**⚠️ Importante: Scroll y overflow**

**Regla de scroll**:
- ✅ **Main content** debe ser **scrollable**
- ✅ **TopBar** y **BottomNav** son **fixed** (no scroll)
- ❌ **NO** aplicar `overflow-hidden` al main en mobile
- ❌ **NO** romper scroll en iOS

**Consideraciones iOS**:
- El scroll debe funcionar nativamente
- No interferir con momentum scrolling
- Respetar safe areas sin afectar scroll

---

## 🎬 Motion Presets a Usar

**⚠️ Fase inicial: Menos es más**

**En esta fase**:
- ✅ `feedbackPop` - Solo en BottomNav (feedback al tocar items)
- ❌ `pageTransition` - **NO en esta fase** (implementar en siguiente fase)
- ❌ `sheetTransition` - **NO necesario** (Sheet de ShadCN ya tiene animación)

**Razón**: Reducir superficie de bugs. Empezar simple y añadir animaciones después.

---

## 📝 Pasos de Implementación

**⚠️ Orden recomendado (reduce superficie de bugs)**

### Fase 1: Estructura Base (Sin animaciones)

1. ✅ **Crear componente `BottomNav`** (sin animaciones)
   - Estructura básica
   - Items principales (4-5)
   - Estilos básicos
   - Indicador de ruta activa

2. ✅ **Crear componente `TopBar`** (sin Sheet aún)
   - Logo, botón placeholder, usuario
   - Estilos básicos
   - Safe areas

3. ✅ **Crear componente `ResponsiveLayout`**
   - Detección mobile/desktop con `useIsMobileSafe()`
   - Renderizado condicional simple
   - Manejo de `null` state (no renderizar navegación hasta montado)

### Fase 2: Integración

4. ✅ **Integrar `AdminLayout`**
   - Integrar `ResponsiveLayout` en `AdminLayout`
   - Ajustar main content padding (pt-16 pb-20 mobile, p-2 desktop)
   - **Verificar que desktop NO se ve afectado**

5. ✅ **Configurar navegación**
   - Items principales en BottomNav
   - Items completos para Sheet (preparar)

### Fase 3: Sheet y Navegación Completa

6. ✅ **Añadir Sheet al TopBar**
   - Sheet con navegación completa
   - Reutilizar `NavMain`, `NavManagers`, `NavUser` del Sidebar
   - Incluir logout, configuraciones, etc.

7. ✅ **Ajustar Sidebar** (si es necesario)
   - Asegurar que sigue funcionando en desktop
   - Verificar que mobile usa TopBar + BottomNav

### Fase 4: Pulido y Animaciones

8. ✅ **Añadir animaciones**
   - `feedbackPop` en BottomNav items
   - **NO añadir** `pageTransition` aún (siguiente fase)

9. ✅ **Safe areas iOS**
   - Padding superior (notch) en TopBar
   - Padding inferior (home indicator) en BottomNav
   - Verificar que scroll funciona correctamente

10. ✅ **Testing**
    - Probar en diferentes dispositivos
    - Verificar navegación
    - Verificar touch targets (44x44px mínimo)
    - **Verificar que desktop NO cambió visualmente**

---

## 🔍 Consideraciones Técnicas

### Navegación Config

**Revisar**: `src/configs/navgationConfig.js`

**Items principales** (BottomNav) - Máximo 4-5:
1. **Home/Dashboard** (`/admin/home`)
2. **Orders** (`/admin/orders`) - Gestor principal
3. **Stores/Almacenes** (`/admin/stores` o similar) - Gestor principal
4. **Más...** - Abre Sheet con resto de navegación

**Items secundarios** (Sheet del TopBar):
- Resto de navegación principal
- Gestores adicionales (si no caben en BottomNav)
- Configuración
- Perfil/Usuario
- Logout

**Nota**: Revisar `navigationConfig` y `navigationManagerConfig` para determinar items prioritarios.

### useIsMobileSafe - Contrato claro

**⚠️ Definición del contrato**:

`useIsMobileSafe()` devuelve:
- `null` = no montado aún (no renderizar navegación)
- `true` = es mobile
- `false` = es desktop

**Regla crítica**:
- **Mientras `isMobile === null`, NO renderizar navegación**
- Esto evita hydration mismatch
- Renderizar layout "neutro" hasta que `mounted === true`

**Ejemplo**:
```jsx
const { isMobile, mounted } = useIsMobileSafe();

if (!mounted) {
  // Renderizar layout neutro (solo desktop por defecto)
  return <DesktopLayout>{children}</DesktopLayout>;
}

return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

### Rutas Activas

- ✅ Usar `usePathname()` para detectar ruta actual
- ✅ Comparar con rutas de BottomNav
- ✅ Highlight visual en item activo

### Safe Areas

- ✅ `pt-[env(safe-area-inset-top)]` - Top bar
- ✅ `pb-[env(safe-area-inset-bottom)]` - Bottom nav
- ✅ Usar `MOBILE_SAFE_AREAS` de design tokens

### Breakpoint

- ✅ Usar `MOBILE_BREAKPOINT_PX` (768px)
- ✅ `useIsMobileSafe()` para evitar hydration mismatch
- ✅ CSS-first para estilos, JS solo para estructura

---

## 📋 Checklist de Implementación

### Estructura Base
- [ ] Crear `BottomNav` component
- [ ] Crear `TopBar` component
- [ ] Crear `ResponsiveLayout` wrapper
- [ ] Definir items principales de navegación

### Integración
- [ ] Modificar `AdminLayout` para usar `ResponsiveLayout`
- [ ] Configurar navegación en BottomNav
- [ ] Configurar navegación en TopBar Sheet
- [ ] Ajustar padding del main content

### Pulido
- [ ] Añadir animaciones (Framer Motion)
- [ ] Implementar safe areas iOS
- [ ] Verificar touch targets (44x44px mínimo)
- [ ] Testing en dispositivos reales

### Documentación
- [ ] Documentar componentes creados
- [ ] Documentar cambios en layout
- [ ] Actualizar README si es necesario

---

## 🧪 Testing

### ⚠️ Regla de No Regresión (CRÍTICA)

**Principio explícito**:
> **Desktop NO debe verse afectado visualmente por ningún cambio mobile.**

**Verificación obligatoria**:
- [ ] Desktop mantiene exactamente el mismo layout visual
- [ ] Sidebar funciona igual que antes
- [ ] Navegación desktop no cambió
- [ ] No hay cambios visuales inesperados en desktop
- [ ] ResponsiveLayout solo afecta mobile (<768px)

**Razón**: Esto evita bugs sutiles y regresiones visuales.

### Desktop (≥768px)
- [ ] Sidebar funciona correctamente (igual que antes)
- [ ] Navegación funciona (igual que antes)
- [ ] Layout se ve **exactamente igual** que antes
- [ ] No hay cambios visuales inesperados

### Mobile (<768px)
- [ ] TopBar se ve correctamente
- [ ] BottomNav se ve y funciona
- [ ] Navegación funciona
- [ ] Sheet se abre correctamente
- [ ] Safe areas respetadas (iOS)
- [ ] Touch targets adecuados (44x44px)
- [ ] Scroll funciona correctamente (iOS momentum)
- [ ] Main content es scrollable
- [ ] TopBar y BottomNav no scrollan (fixed)

### Dispositivos
- [ ] iPhone (notch, safe areas)
- [ ] Android
- [ ] iPad (tablet) - debe usar layout desktop

---

## 📚 Referencias

- [Plan General Mobile](../00-PLAN-GENERAL.md)
- [Design Tokens Mobile](../../src/lib/design-tokens-mobile.js)
- [Motion Presets](../../src/lib/motion-presets.js)
- [ShadCN Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [ShadCN Sheet](https://ui.shadcn.com/docs/components/sheet)

---

**Estado**: 📝 En planificación
**Prioridad**: 🔴 Alta (Base para todo lo demás)
**Última actualización**: Creación del plan


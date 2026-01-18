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
- ✅ Animación con Framer Motion
- ✅ Touch targets mínimo 44x44px

**Items principales** (sugeridos):
1. Home/Dashboard
2. Orders (gestor principal)
3. Stores/Almacenes (gestor principal)
4. Más... (menu secundario en Sheet)

### 2. Crear Top Bar Component

**Archivo**: `src/components/Admin/Layout/TopBar/index.jsx`

**Características**:
- ✅ Logo (izquierda)
- ✅ Botón menú (Sheet con navegación completa) - izquierda
- ✅ Usuario/Dropdown - derecha
- ✅ Altura fija (h-14 o h-16)
- ✅ Safe areas iOS (`pt-[env(safe-area-inset-top)]`)

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

**Funcionalidad**:
- ✅ Wrapper que detecta mobile/desktop
- ✅ Renderiza layout apropiado
- ✅ Maneja safe areas
- ✅ Integra TopBar, Sidebar, BottomNav

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

---

## 🎬 Motion Presets a Usar

- ✅ `pageTransition` - Transiciones entre páginas
- ✅ `feedbackPop` - Feedback al tocar items
- ✅ `sheetTransition` - Cuando se abre el Sheet de navegación

---

## 📝 Pasos de Implementación

### Fase 1: Estructura Base

1. ✅ Crear componente `BottomNav`
   - Estructura básica
   - Items principales (4-5)
   - Estilos básicos

2. ✅ Crear componente `TopBar`
   - Logo, menú, usuario
   - Estilos básicos

3. ✅ Crear componente `ResponsiveLayout`
   - Detección mobile/desktop
   - Renderizado condicional

### Fase 2: Integración

4. ✅ Modificar `AdminLayout`
   - Integrar `ResponsiveLayout`
   - Ajustar main content padding

5. ✅ Configurar navegación
   - Items principales en BottomNav
   - Items secundarios en Sheet (TopBar menú)

6. ✅ Ajustar Sidebar
   - Que funcione como Sheet en mobile (si se usa)

### Fase 3: Pulido

7. ✅ Añadir animaciones
   - Transiciones con Framer Motion
   - Feedback visual

8. ✅ Safe areas iOS
   - Padding superior (notch)
   - Padding inferior (home indicator)

9. ✅ Testing
   - Probar en diferentes dispositivos
   - Verificar navegación
   - Verificar touch targets

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

### Desktop (≥768px)
- [ ] Sidebar funciona correctamente
- [ ] Navegación funciona
- [ ] Layout se ve bien

### Mobile (<768px)
- [ ] TopBar se ve correctamente
- [ ] BottomNav se ve y funciona
- [ ] Navegación funciona
- [ ] Sheet se abre correctamente
- [ ] Safe areas respetadas (iOS)
- [ ] Touch targets adecuados (44x44px)

### Dispositivos
- [ ] iPhone (notch, safe areas)
- [ ] Android
- [ ] iPad (tablet)

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


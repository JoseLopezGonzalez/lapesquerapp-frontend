# Guía Completa: Replicación del Menú Principal para Expo/React Native

**Fecha de Creación**: 2024  
**Versión del Documento**: 1.0  
**Proyecto Origen**: brisapp-nextjs (Next.js + shadcn/ui)  
**Proyecto Destino**: Expo/React Native

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura y Estructura](#arquitectura-y-estructura)
3. [Componentes Principales](#componentes-principales)
4. [Dependencias y Librerías](#dependencias-y-librerías)
5. [Sistema de Estilos](#sistema-de-estilos)
6. [Configuración y Datos](#configuración-y-datos)
7. [Funcionalidades Clave](#funcionalidades-clave)
8. [Mapeo de Componentes Web → Native](#mapeo-de-componentes-web--native)
9. [Consideraciones y Diferencias Web vs Native](#consideraciones-y-diferencias-web-vs-native)
10. [Requisitos de Implementación](#requisitos-de-implementación)

---

## 📖 Resumen Ejecutivo

El menú principal de la aplicación es un **sidebar de navegación lateral** construido con **shadcn/ui** y **Radix UI**, que proporciona:

- **Navegación principal** con elementos expandibles/collapsibles
- **Sección de gestores** (NavManagers)
- **Selector de aplicaciones** (AppSwitcher)
- **Perfil de usuario** con menú dropdown (NavUser)
- **Soporte responsive**: Sidebar fijo en desktop, drawer/modal en mobile
- **Tema claro/oscuro** con variables CSS
- **Filtrado por roles** de usuario
- **Detección de rutas activas**

### Características Técnicas

- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui (estilo "new-york")
- **Primitivos UI**: Radix UI
- **Estilos**: Tailwind CSS con variables CSS
- **Estado**: React Context API
- **Iconos**: Lucide React, Heroicons, React Icons
- **Autenticación**: NextAuth.js
- **Notificaciones**: react-hot-toast

---

## 🏗️ Arquitectura y Estructura

### Estructura de Directorios

```
src/components/Admin/Layout/SideBar/
├── index.js              # Componente principal AppSidebar (129 líneas)
├── nav-main.js           # Navegación principal con items colapsables (70 líneas)
├── nav-managers.js       # Sección de gestores (32 líneas)
├── nav-user.js           # Perfil de usuario con dropdown (127 líneas)
└── app-switcher.js       # Selector de aplicaciones (97 líneas)

Dependencias externas:
├── src/components/ui/sidebar.jsx     # Componentes base del sidebar (630 líneas)
├── src/configs/navgationConfig.js    # Configuración de navegación (239 líneas)
├── src/utils/navigationUtils.js      # Utilidades de navegación (40 líneas)
└── src/hooks/use-mobile.jsx          # Hook para detección mobile (19 líneas)
```

### Flujo de Datos

```
AppSidebar (index.js)
  │
  ├── Obtiene sesión de usuario (useSession)
  ├── Obtiene configuraciones (useSettings)
  ├── Filtra navegación por roles (filterNavigationByRoles)
  ├── Marca rutas activas (isActiveRoute)
  │
  ├── SidebarHeader
  │   └── AppSwitcher (apps data)
  │
  ├── SidebarContent
  │   ├── NavManagers (navigationManagersItems)
  │   └── NavMain (navigationItems)
  │
  └── SidebarFooter
      └── NavUser (user data)
```

---

## 🧩 Componentes Principales

### 1. AppSidebar (Componente Principal)

**Archivo**: `src/components/Admin/Layout/SideBar/index.js`

**Responsabilidades**:
- Orquestación general del sidebar
- Obtención de datos de usuario y configuración
- Filtrado de navegación por roles
- Detección de rutas activas
- Preparación de datos para subcomponentes

**Props**: Ninguno (usa hooks internos)

**Hooks utilizados**:
- `usePathname()` - Next.js navigation
- `useSession()` - NextAuth
- `useSettings()` - Context personalizado
- `React.useCallback()` - Optimización
- `React.useMemo()` - Optimización

**Estructura de datos generada**:

```javascript
{
  user: {
    name: string,
    email: string,
    logout: function
  },
  apps: [
    {
      name: string,
      logo: Component,
      description: string,
      current: boolean
    }
  ],
  navigationItems: [
    {
      name: string,
      icon: Component,
      href: string,
      childrens?: Array,
      current?: boolean,
      allowedRoles?: Array
    }
  ],
  navigationManagersItems: Array (misma estructura)
}
```

**Características clave**:
- Filtrado por roles recursivo (incluye hijos)
- Detección de rutas activas (soporta rutas anidadas)
- Memoización de datos para optimización
- Manejo de logout con toast notifications

---

### 2. NavMain (Navegación Principal)

**Archivo**: `src/components/Admin/Layout/SideBar/nav-main.js`

**Responsabilidades**:
- Renderizar items de navegación principal
- Manejar items con/sin hijos (colapsables)
- Mostrar iconos y labels
- Gestionar estado activo/inactivo

**Props**:
```javascript
{
  items: Array<{
    name: string,
    icon: React.Component,
    href: string,
    childrens?: Array,
    current?: boolean
  }>
}
```

**Componentes utilizados**:
- `SidebarGroup` (shadcn/ui)
- `SidebarMenu` (shadcn/ui)
- `SidebarMenuItem` (shadcn/ui)
- `SidebarMenuButton` (shadcn/ui)
- `SidebarMenuSub` (shadcn/ui)
- `SidebarMenuSubButton` (shadcn/ui)
- `Collapsible` (Radix UI)
- `Link` (Next.js)
- `ChevronRight` (Lucide React)

**Lógica**:
- Si item tiene `childrens`: Renderiza como Collapsible con trigger
- Si item NO tiene `childrens`: Renderiza como Link directo
- Usa `defaultOpen={item.isActive}` para abrir items activos
- Animación de rotación para ChevronRight (90deg cuando abierto)

**Estilos clave**:
- Tooltip en modo colapsado (iconos solo)
- Transición de rotación para chevron
- Estilos hover/active del sidebar

---

### 3. NavManagers (Gestores)

**Archivo**: `src/components/Admin/Layout/SideBar/nav-managers.js`

**Responsabilidades**:
- Renderizar sección especial de "Gestores"
- Items sin hijos (navegación simple)
- Ocultarse en modo icono colapsado

**Props**:
```javascript
{
  items: Array<{
    name: string,
    icon: React.Component,
    href: string,
    current?: boolean
  }>
}
```

**Componentes utilizados**:
- `SidebarGroup`
- `SidebarGroupLabel` ("Gestores")
- `SidebarMenu`
- `SidebarMenuItem`
- `SidebarMenuButton`
- `Link` (Next.js)

**Características**:
- Se oculta en modo colapsado: `className="group-data-[collapsible=icon]:hidden"`
- Label fijo: "Gestores"
- Estilos activos: `font-medium bg-foreground-200`

---

### 4. NavUser (Perfil de Usuario)

**Archivo**: `src/components/Admin/Layout/SideBar/nav-user.js`

**Responsabilidades**:
- Mostrar información del usuario (avatar, nombre, email)
- Menú dropdown con opciones
- Toggle de tema claro/oscuro
- Logout

**Props**:
```javascript
{
  user: {
    name: string,
    email: string,
    avatar?: string,
    logout: function
  }
}
```

**Componentes utilizados**:
- `SidebarMenu`
- `SidebarMenuItem`
- `SidebarMenuButton`
- `DropdownMenu` (Radix UI)
- `Avatar` (Radix UI)
- `ThemeToggle` (componente personalizado)
- `useRouter` (Next.js)

**Estructura del dropdown**:
1. **Header**: Avatar + nombre + email
2. **Separador**
3. **Grupo 1**: Planes (Sparkles icon)
4. **Separador**
5. **Grupo 2**: 
   - Cuenta (BadgeCheck icon)
   - Notificaciones (Bell icon)
   - Configuración (Settings icon, navega a /admin/settings)
6. **Separador**
7. **Grupo 3**: Tema (ThemeToggle component)
8. **Separador**
9. **Footer**: Cerrar Sesión (LogOut icon)

**Características**:
- Iniciales del nombre como fallback del avatar
- Posicionamiento del dropdown: `bottom` en mobile, `right` en desktop
- Toggle de tema integrado
- Navegación a configuración

---

### 5. AppSwitcher (Selector de Aplicaciones)

**Archivo**: `src/components/Admin/Layout/SideBar/app-switcher.js`

**Responsabilidades**:
- Mostrar aplicación actual
- Dropdown para cambiar entre aplicaciones
- Loading state mientras carga nombre de empresa

**Props**:
```javascript
{
  apps: Array<{
    name: string,
    logo: React.Component,
    description: string,
    current: boolean
  }>,
  loading: boolean
}
```

**Componentes utilizados**:
- `SidebarMenu`
- `SidebarMenuItem`
- `SidebarMenuButton`
- `DropdownMenu` (Radix UI)
- `Skeleton` (shadcn/ui)
- `ChevronsUpDown` (Lucide React)
- `CircleHelp` (Lucide React)

**Características**:
- Logo renderizado en contenedor cuadrado blanco con icono negro
- Skeleton mientras carga (`loading` prop)
- Lista de apps en dropdown
- Opción "Solicitar más módulos" al final
- Estado sincronizado con `useEffect`

---

### 6. Sidebar (Componente Base de shadcn/ui)

**Archivo**: `src/components/ui/sidebar.jsx`

Este es el componente base que proporciona toda la funcionalidad del sidebar. **No es necesario replicarlo completamente** en Expo, pero es importante entender su arquitectura.

**Constantes importantes**:
```javascript
const SIDEBAR_WIDTH = "16rem"           // 256px
const SIDEBAR_WIDTH_MOBILE = "18rem"    // 288px
const SIDEBAR_WIDTH_ICON = "3rem"       // 48px
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
const MOBILE_BREAKPOINT = 768           // pixels
```

**Variantes**:
- `collapsible`: "none" | "icon" | "offcanvas"
- `variant`: "sidebar" | "floating" | "inset"
- `side`: "left" | "right"

**Funcionalidad móvil**:
- Detecta mobile con `useIsMobile()`
- En mobile: Renderiza como `Sheet` (drawer lateral)
- En desktop: Renderiza como sidebar fijo

**Context API**:
```javascript
SidebarContext proporciona:
- state: "expanded" | "collapsed"
- open: boolean
- setOpen: function
- isMobile: boolean
- openMobile: boolean
- setOpenMobile: function
- toggleSidebar: function
```

---

## 📦 Dependencias y Librerías

### Dependencias Principales

#### React y Next.js
```json
{
  "react": "19.0.0-rc-66855b96-20241106",
  "react-dom": "19.0.0-rc-66855b96-20241106",
  "next": "^16.0.7"
}
```

#### Radix UI (Primitivos)
```json
{
  "@radix-ui/react-avatar": "^1.1.3",
  "@radix-ui/react-collapsible": "^1.1.3",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-tooltip": "^1.1.8",
  "@radix-ui/react-separator": "^1.1.2"
}
```

#### UI y Estilos
```json
{
  "tailwindcss": "^3.4.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.0.1",
  "tailwindcss-animate": "^1.0.7"
}
```

#### Iconos
```json
{
  "lucide-react": "^0.475.0",
  "@heroicons/react": "^2.2.0",
  "react-icons": "^5.3.0"
}
```

#### Utilidades
```json
{
  "next-auth": "^4.24.13",
  "next-themes": "^0.4.6",
  "react-hot-toast": "^2.5.1"
}
```

### Equivalencias para Expo/React Native

| Web (Next.js) | Expo/React Native | Notas |
|---------------|-------------------|-------|
| `@radix-ui/react-*` | `react-native` + librerías nativas | Usar componentes nativos o librerías específicas |
| `tailwindcss` | `nativewind` o `react-native-tailwindcss` | Tailwind para React Native |
| `class-variance-authority` | Implementación propia | Lógica de variantes |
| `clsx` + `tailwind-merge` | `clsx` + merge manual | `clsx` funciona igual |
| `lucide-react` | `lucide-react-native` | Mismo set de iconos |
| `@heroicons/react` | `@expo/vector-icons` o `react-native-vector-icons` | Iconos alternativos |
| `next-auth` | `expo-auth-session` o `@react-native-async-storage/async-storage` | Autenticación |
| `next-themes` | `react-native-dark-mode` o `@react-native-community/async-storage` | Tema claro/oscuro |
| `react-hot-toast` | `react-native-toast-message` o `react-native-flash-message` | Notificaciones |
| `next/navigation` | `@react-navigation/native` | Navegación |

---

## 🎨 Sistema de Estilos

### Variables CSS (Tema)

El sistema usa **variables CSS** definidas en `globals.css` para el tema claro/oscuro.

#### Variables del Sidebar

**Tema Claro** (`:root`):
```css
--sidebar-background: 0 0% 98%;           /* neutral-50 */
--sidebar-foreground: 0 0% 26.1%;         /* neutral-800 */
--sidebar-primary: 0 0% 10%;              /* neutral-900 */
--sidebar-primary-foreground: 0 0% 98%;   /* neutral-50 */
--sidebar-accent: 0 0% 95.9%;             /* neutral-100 */
--sidebar-accent-foreground: 0 0% 10%;    /* neutral-900 */
--sidebar-border: 0 0% 91%;               /* neutral-200 */
--sidebar-ring: 217.2 91.2% 59.8%;        /* base ring color */
```

**Tema Oscuro** (`.dark`):
```css
--sidebar-background: 0 0% 7%;            /* neutral-900 */
--sidebar-foreground: 0 0% 95.9%;         /* neutral-100 */
--sidebar-primary: 224.3 76.3% 48%;       /* blue-600 */
--sidebar-primary-foreground: 0 0% 100%;  /* white */
--sidebar-accent: 0 0% 15.9%;             /* neutral-800 */
--sidebar-accent-foreground: 0 0% 95.9%;  /* neutral-100 */
--sidebar-border: 0 0% 15.9%;             /* neutral-800 */
--sidebar-ring: 217.2 91.2% 59.8%;        /* base ring color */
```

**Formato**: Valores HSL sin la función `hsl()`, solo números separados por espacios.

### Colores Generales (Base)

**Tema Claro**:
```css
--background: 0 0% 100%;
--foreground: 0 0% 5%;
--primary: 0 0% 19%;
--primary-foreground: 0 0% 98%;
--secondary: 0 0% 96%;
--muted: 0 0% 96%;
--muted-foreground: 0 0% 45%;
--accent: 0 0% 96%;
--border: 0 0% 92%;
--ring: 0 0% 76%;
--radius: 0.5rem;
```

**Tema Oscuro**:
```css
--background: 0 0% 6%;
--foreground: 0 0% 98%;
--primary: 0 0% 100%;
--primary-foreground: 0 0% 2%;
--secondary: 0 0% 15%;
--muted: 0 0% 22%;
--muted-foreground: 0 0% 49%;
--accent: 0 0% 15%;
--border: 0 0% 12%;
--ring: 0 0% 40%;
```

### Utilidad `cn()` (Class Name)

```javascript
// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

**Uso**: Combina clases de Tailwind, eliminando conflictos y permitiendo condicionales.

---

## ⚙️ Configuración y Datos

### Configuración de Navegación

**Archivo**: `src/configs/navgationConfig.js`

**Estructura de un item de navegación**:
```javascript
{
  name: string,                    // Nombre visible
  icon: React.Component,           // Componente de icono
  href: string,                    // Ruta (opcional si tiene childrens)
  allowedRoles: Array<string>,     // Roles permitidos
  childrens?: Array<{              // Items hijos (opcional)
    name: string,
    href: string,
    allowedRoles: Array<string>
  }>
}
```

**Ejemplo real**:
```javascript
{
  name: 'Almacenes',
  icon: ArchiveBoxIcon,
  allowedRoles: ["admin", "manager", "superuser"],
  childrens: [
    {
      name: 'Cajas',
      href: '/admin/boxes',
      allowedRoles: ["admin", "manager", "superuser"],
    },
    {
      name: 'Palets',
      href: '/admin/pallets',
      allowedRoles: ["admin", "manager", "superuser"],
    }
  ]
}
```

**Nota**: El proyecto usa `childrens` (incorrecto gramaticalmente) en lugar de `children`.

### Utilidades de Navegación

**Archivo**: `src/utils/navigationUtils.js`

#### `filterNavigationByRoles(items, userRoles)`

Filtra items de navegación basándose en roles del usuario.

```javascript
export function filterNavigationByRoles(items, userRoles) {
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
    
    return items
        .filter((item) =>
            item.allowedRoles?.some((role) => roles.includes(role))
        )
        .map((item) => ({
            ...item,
            childrens: item.childrens
                ? item.childrens.filter((child) =>
                    child.allowedRoles?.some((role) => roles.includes(role))
                )
                : null,
        }));
}
```

**Lógica**:
1. Normaliza `userRoles` a array
2. Filtra items principales que tengan roles permitidos
3. Filtra recursivamente `childrens` de cada item
4. Retorna items filtrados

#### `isActiveRoute(itemHref, currentPath)`

Verifica si una ruta está activa (incluye rutas anidadas).

```javascript
export function isActiveRoute(itemHref, currentPath) {
    if (!itemHref) return false;
    if (itemHref === currentPath) return true;
    if (currentPath.startsWith(itemHref + '/')) return true;
    return false;
}
```

**Lógica**:
- Compara exacto: `/admin/products` === `/admin/products`
- Compara prefijo: `/admin/products` === `/admin/products/123` (ruta anidada)

---

## 🔑 Funcionalidades Clave

### 1. Filtrado por Roles

**Ubicación**: `AppSidebar` → `filterNavigationByRoles()`

**Flujo**:
1. Obtiene roles del usuario desde `session.user.role`
2. Normaliza roles a array
3. Filtra `navigationConfig` y `navigationManagerConfig`
4. Filtra recursivamente `childrens` de cada item
5. Pasa items filtrados a componentes

---

### 2. Detección de Ruta Activa

**Ubicación**: `AppSidebar` → `isActiveRoute()`

**Flujo**:
1. Obtiene ruta actual con `usePathname()` (Next.js)
2. Compara cada item con ruta actual
3. Marca item como `current: true` si coincide
4. Soporta rutas anidadas (prefijo)

---

### 3. Modo Colapsado (Iconos)

**Ubicación**: `Sidebar` base component

**Comportamiento**:
- En desktop: Sidebar se colapsa a ancho de iconos (`3rem`)
- Tooltips aparecen al hover en modo colapsado
- Labels y grupos se ocultan
- Solo iconos visibles

---

### 4. Responsive (Mobile)

**Ubicación**: `Sidebar` base component → `useIsMobile()`

**Comportamiento**:
- Breakpoint: `768px`
- En mobile: Renderiza como `Sheet` (drawer lateral)
- En desktop: Renderiza como sidebar fijo

**Hook `useIsMobile()`**:
```javascript
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}
```

---

### 5. Tema Claro/Oscuro

**Ubicación**: `NavUser` → `ThemeToggle`

**Componente**: `src/components/ui/theme-toggle.jsx`

**Funcionalidad**:
- Usa `next-themes` para gestión de tema
- Toggle visual con animación
- Persistencia en localStorage
- Variables CSS cambian automáticamente

---

### 6. Logout

**Ubicación**: `AppSidebar` → `handleLogout`

**Flujo**:
1. Llama `signOut()` de NextAuth
2. Redirige a `/`
3. Muestra toast de éxito/error

**Código**:
```javascript
const handleLogout = React.useCallback(async () => {
    try {
        await signOut({ redirect: false });
        window.location.href = '/';
        toast.success('Sesión cerrada correctamente', getToastTheme());
    } catch (err) {
        toast.error(err.message || 'Error al cerrar sesión', getToastTheme());
    }
}, []);
```

---

## 🔄 Mapeo de Componentes Web → Native

### Componentes Base

| Componente Web | Componente Native | Notas |
|----------------|-------------------|-------|
| `div` | `View` | Contenedor base |
| `ul` / `li` | `View` | Listas como Views |
| `button` | `Pressable` o `TouchableOpacity` | Botones |
| `span` | `Text` | Texto |
| `img` | `Image` | Imágenes |
| `a` (Link) | `TouchableOpacity` + `navigation.navigate()` | Links |

### Componentes shadcn/ui → Native

| shadcn/ui | Alternativa Native | Librería |
|-----------|-------------------|----------|
| `Sidebar` | `Drawer` de React Navigation | `@react-navigation/drawer` |
| `Collapsible` | `Accordion` o implementar con `Animated` | Custom o `react-native-collapsible` |
| `DropdownMenu` | `Modal` + `View` o librería | `react-native-dropdown-picker` o custom |
| `Avatar` | `Image` + `View` o librería | `react-native-avatar` o custom |
| `Tooltip` | Librería o custom | `react-native-tooltip` o custom |
| `Skeleton` | `View` animado o librería | `react-native-skeleton-placeholder` |
| `Separator` | `View` con altura 1px | Custom |

### Iconos

| Web | Native | Notas |
|-----|--------|-------|
| `lucide-react` | `lucide-react-native` | Mismo set de iconos |
| `@heroicons/react` | `@expo/vector-icons` | Iconos alternativos |
| `react-icons` | `@expo/vector-icons` | Varios sets de iconos |

---

## ⚠️ Consideraciones y Diferencias Web vs Native

### 1. Navegación

**Web (Next.js)**:
- Usa rutas basadas en archivos (`/admin/products`)
- `usePathname()` obtiene ruta actual
- `Link` componente para navegación

**Native (Expo)**:
- Usa nombres de pantallas (`Products`, `ProductDetail`)
- `useRoute()` obtiene ruta actual
- `navigation.navigate()` para navegar

**Consideraciones**:
- Se debe mapear rutas a nombres de pantallas
- La función `isActiveRoute()` debe adaptarse para trabajar con nombres de pantallas
- Los valores `href` deben convertirse a llamadas de navegación

---

### 2. Estilos

**Web (Tailwind CSS)**:
- Clases utility: `flex`, `p-2`, `bg-sidebar`
- Variables CSS para colores
- Responsive con breakpoints

**Native (StyleSheet)**:
- Objetos de estilo: `{ flex: 1, padding: 8 }`
- Colores como valores JS
- Media queries no disponibles (usar `Dimensions` de React Native)

**Consideraciones**:
- Los colores del tema deben definirse como objetos JavaScript
- Las clases Tailwind deben convertirse a objetos StyleSheet
- Los valores de colores HSL deben convertirse a RGB/hex

---

### 3. Animaciones

**Web (CSS)**:
- Transiciones CSS: `transition-transform duration-200`
- Animaciones con `@keyframes`
- Radix UI maneja animaciones automáticamente

**Native (Animated API)**:
- `Animated.Value` y `Animated.timing()`
- `LayoutAnimation` para transiciones automáticas
- `react-native-reanimated` para animaciones avanzadas

**Consideraciones**:
- Las animaciones de colapso/expansión del sidebar requieren implementación con Animated API
- Las animaciones de dropdown/modal deben implementarse manualmente
- Las duraciones y curvas de animación deben definirse en código

---

### 4. Estado del Sidebar

**Web**:
- Estado en Context API
- Persistencia en cookies del navegador
- Keyboard shortcut (Cmd/Ctrl + B) para abrir/cerrar

**Native**:
- Estado en Context API (mismo patrón)
- Persistencia en AsyncStorage
- Keyboard shortcut no aplicable (opcional con librería)

**Consideraciones**:
- La persistencia del estado debe usar AsyncStorage en lugar de cookies
- El estado colapsado/expandido debe persistirse localmente
- Los gestures nativos pueden usarse para abrir/cerrar el sidebar

---

### 5. Tooltips

**Web (Radix UI)**:
- Tooltips nativos con hover del mouse
- Posicionamiento automático
- Animaciones incluidas

**Native**:
- No existe hover, se debe usar press largo o librería
- Posicionamiento manual o mediante librería
- Alternativas: `react-native-tooltip`, `react-native-popover-view`, o custom con `Modal`

**Consideraciones**:
- Los tooltips solo aparecen en modo colapsado del sidebar
- Requiere implementación manual o librería especializada

---

### 6. Dropdown Menu

**Web (Radix UI)**:
- Portal para posicionamiento
- Overlay automático
- Animaciones incluidas

**Native**:
- `Modal` con posicionamiento absoluto
- Overlay manual
- Animaciones con `Animated`

**Consideraciones**:
- El dropdown de usuario debe implementarse como Modal o componente especializado
- El posicionamiento debe calcularse manualmente
- Las animaciones de entrada/salida deben implementarse

**Alternativas**:
- `react-native-dropdown-picker`
- `react-native-modal-dropdown`
- Custom con `Modal` + `Animated`

---

## ✅ Requisitos de Implementación

### Componentes a Implementar

El menú principal debe incluir los siguientes componentes:

1. **AppSidebar** - Componente principal que orquesta todo el sidebar
2. **NavMain** - Navegación principal con items colapsables
3. **NavManagers** - Sección de gestores
4. **NavUser** - Perfil de usuario con dropdown
5. **AppSwitcher** - Selector de aplicaciones

### Funcionalidades Requeridas

1. **Filtrado por Roles**: Debe filtrar items de navegación según roles del usuario
2. **Detección de Ruta Activa**: Debe marcar visualmente la ruta/pantalla actual
3. **Colapso/Expansión**: Sidebar debe poder colapsar a modo iconos
4. **Dropdown de Usuario**: Menú desplegable con opciones (Cuenta, Configuración, Tema, Logout)
5. **Selector de Aplicaciones**: Dropdown para cambiar entre aplicaciones
6. **Tema Claro/Oscuro**: Soporte para ambos temas con toggle
7. **Loading States**: Skeleton/loading mientras cargan datos

### Estilos y Dimensiones

**Dimensiones del Sidebar**:
- Ancho expandido: `256px` (16rem)
- Ancho colapsado: `48px` (3rem)
- Ancho mobile: `288px` (18rem)

**Colores del Tema**: Ver sección [Sistema de Estilos](#-sistema-de-estilos) para valores HSL completos

**Espaciado**:
- Padding general: `8px` (0.5rem)
- Gap entre items: `4px` (0.25rem)
- Border radius: `6px` (0.375rem)

### Datos y Configuración

**Estructura de Datos**: Ver sección [Configuración y Datos](#-configuración-y-datos)

**Utilidades Necesarias**:
- `filterNavigationByRoles()` - Filtrado por roles
- `isActiveRoute()` - Detección de rutas activas

### Integraciones Requeridas

1. **Sistema de Autenticación**: Obtener usuario y roles
2. **Sistema de Navegación**: Navegación entre pantallas
3. **Sistema de Configuración**: Obtener nombre de empresa (settings)
4. **Sistema de Notificaciones**: Mostrar toasts/mensajes
5. **Sistema de Tema**: Gestión de tema claro/oscuro

---

## 📄 Conclusión

Este documento describe completamente el menú principal de la aplicación Next.js para su replicación en Expo/React Native. Proporciona:

- **Arquitectura completa**: Estructura de componentes y flujo de datos
- **Detalles técnicos**: Dependencias, estilos, colores, dimensiones
- **Funcionalidades**: Descripción detallada de cada característica
- **Configuración**: Estructuras de datos y utilidades necesarias
- **Diferencias**: Consideraciones entre plataformas web y nativa

La lógica de negocio (filtrado por roles, detección de rutas activas, etc.) se mantiene igual, solo cambia la capa de presentación y las APIs nativas utilizadas.

---

**Fin del Documento**

*Última actualización: 2024*


# Plan General: Adaptación Mobile y Armonización con Desktop

## 📋 Resumen Ejecutivo

Este documento recoge el plan general de cambios necesarios para adaptar nuestra web app (actualmente diseñada para desktop) a una experiencia fluida y nativa para dispositivos móviles, manteniendo ShadCN UI como base del design system y armonizando ambos entornos cuando sea necesario.

**Decisión clave**: ✅ **Mantener ShadCN UI** y crear adaptaciones mobile manteniendo armonía con la versión desktop existente.

---

## 🎯 Filosofía del Cambio

### Por qué NO cambiar de librería

Cambiar de librería solo para mobile trae más problemas que beneficios:

- ❌ Rompes consistencia visual (desktop vs mobile)
- ❌ Duplicas lógica, estilos y mantenimiento
- ❌ Aumentas la complejidad (dos sistemas de diseño)
- ❌ Acabas "forzando" armonía que nunca es perfecta

### Por qué ShadCN es la opción correcta

ShadCN no es solo desktop. Es **Radix + Tailwind**, y eso es perfecto para crear adaptaciones mobile manteniendo consistencia:

- ✅ Componentes accesibles (Radix UI)
- ✅ Estilos flexibles (Tailwind CSS)
- ✅ Totalmente personalizable y adaptable
- ✅ Permite crear variantes mobile manteniendo el mismo design system
- ✅ Consistencia visual garantizada entre desktop y mobile

---

## 🧠 El Enfoque Correcto: Crear Mobile y Armonizar con Desktop

No es cambiar de librería, es **crear adaptaciones mobile** manteniendo consistencia con el desktop existente.

### 1️⃣ Contexto Real del Proyecto

**Situación actual**: 
- ✅ Web app ya diseñada y funcionando en desktop
- ✅ ShadCN UI como design system establecido
- 🔄 Necesitamos crear la experiencia mobile ahora

**Enfoque práctico**:
- Crear versiones mobile de componentes existentes
- Mantener la misma lógica de negocio
- Adaptar layouts y patrones de interacción para mobile
- Armonizar cuando sea necesario para mantener consistencia

**Principios para Mobile**:
- Pantallas simples y enfocadas
- Jerarquía clara de información
- Acciones grandes (mínimo 44x44px para toques)
- Menos ruido visual que en desktop
- Patrones de interacción nativos de mobile

**Implicación**: Adaptar los componentes existentes para mobile, manteniendo la funcionalidad desktop y asegurando armonía entre ambas versiones.

### 2️⃣ Estrategia de Armonización

**¿Qué significa armonizar?**

Cuando creamos la versión mobile, puede que surjan inconsistencias o que sea necesario ajustar ambas versiones:

**Armonización necesaria cuando**:
- Hay inconsistencias visuales entre desktop y mobile (colores, espaciados, tamaños)
- La experiencia de usuario difiere demasiado entre plataformas (causa confusión)
- Se identifican mejoras que benefician a ambas versiones
- Los componentes base necesitan ajustes para funcionar bien en ambos entornos

**Armonización NO necesaria cuando**:
- Los patrones son diferentes pero coherentes (ej: sidebar vs bottom bar)
- Los layouts son diferentes pero ambos efectivos
- Los tamaños de touch targets son mayores en mobile (es correcto)

**Principio**: Armonizar cuando mejore la experiencia, no por uniformidad ciega.

---

## 🧩 Patrones "Nativos" con ShadCN

### 🔹 Bottom Sheets (Clave para Mobile)

**Componentes disponibles**:
- `Sheet` de ShadCN con `side="bottom"`
- `Dialog` con animaciones personalizadas
- `react-spring-bottom-sheet` (opción externa, si se necesita más funcionalidad)

**Uso recomendado**:
- Formularios secundarios
- Filtros y opciones de búsqueda
- Acciones que requieren input del usuario
- Detalles expandibles
- Confirmaciones de acciones

**Impacto**: Cambia la mentalidad de "modal centrado" a "bottom sheet" en mobile.

---

### 🔹 Navegación Inferior (Bottom Navigation)

**En mobile**:
- Bottom bar fija (máximo 4-5 acciones principales)
- Iconos grandes y claros
- Sin textos largos (solo iconos o iconos + labels cortos)
- Área de toque generosa (mínimo 44x44px)

**En desktop**:
- Sidebar / Topbar clásica (actualmente implementada)

**Estrategia**:
- Mismo routing, distinto layout según dispositivo
- Componente condicional que renderiza:
  - Bottom bar en mobile (`< 768px`)
  - Sidebar en desktop (`≥ 768px`)

**Impacto**: Navegación nativa en mobile, familiar en desktop.

---

### 🔹 Inputs "Mobile-Friendly"

**Ajustes críticos**:
- Altura mínima: `h-12` / `h-14` (48-56px)
- Tamaño de texto: `text-base` (16px mínimo para evitar zoom en iOS)
- Labels claros y visibles
- Placeholders informativos
- Feedback visual inmediato
- Teclado adecuado según input (email, tel, number)

**Implementación**:
- Variantes de componentes Input de ShadCN para mobile
- Clases condicionales según breakpoint
- Mismo componente, estilos adaptados

**Impacto**: Formularios usables sin zoom forzado en iOS.

---

## 🎨 Layouts Condicionales

### Estrategia General

**Mismos componentes de negocio, distinto envoltorio visual**:

- No cambias la UI library (ShadCN)
- Adaptas la composición según dispositivo
- Mantienes armonía visual entre ambas versiones

**Patrón de adaptación**:
```
Desktop (existente) → sidebar, tablas, vistas densas
Mobile (crear)      → cards, listas, bottom actions
```

**Enfoque**: 
- Desktop ya existe y funciona
- Mobile se crea ahora adaptando el contenido existente
- Armonización cuando haya inconsistencias visuales o de UX

### Implementación Técnica

**📌 Regla oficial responsive**: **CSS-first, JS solo para cambios estructurales**

**Decisión**: Usar clases Tailwind responsive para el 80% de los casos, y `useIsMobile()` únicamente cuando haya cambios estructurales fuertes (ej. bottom nav, master-detail split view).

**Breakpoint**: 768px (`md` en Tailwind)

**Hook disponible**: `useIsMobile()` (en `src/hooks/use-mobile.jsx`)

#### Patrón CSS-First (Recomendado - 80% de casos)

```jsx
// ✅ CORRECTO: Usar clases Tailwind
<div className="flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
  <div className="w-full md:w-1/2">
    {/* Contenido */}
  </div>
</div>
```

#### Patrón JS-First (Solo para cambios estructurales)

```jsx
// ✅ CORRECTO: Solo para cambios estructurales (bottom nav, master-detail)
const isMobile = useIsMobile();

return (
  <>
    {isMobile ? (
      <MobileLayout>{children}</MobileLayout> // Bottom nav + lista/detalle alternado
    ) : (
      <DesktopLayout>{children}</DesktopLayout> // Sidebar + split view
    )}
  </>
);
```

**⚠️ Nota importante**: Si usas `useIsMobile()` para render condicional, **evitar hydration mismatch**:
- Render "neutro" hasta `mounted`
- O separar en Client Components
- O preferir CSS-first siempre que sea posible

**Componentes afectados**:
- Todos los gestores principales (OrdersManager, StoresManager, etc.)
- Layouts de admin
- Formularios complejos
- Dashboards y vistas de resumen

---

## 📊 Transformación de Componentes Críticos

### Tablas ≠ Mobile (pero ShadCN no es el problema)

**En móvil**:
- ❌ Tablas grandes con scroll horizontal
- ✅ Cards con información clave
- ✅ Filas colapsables/expandibles
- ✅ Drill-down (lista → detalle)

**Estrategia**:
- Misma fuente de datos
- Renderizado condicional:
  - **Desktop**: Tabla (ShadCN Table)
  - **Mobile**: Cards (ShadCN Card) con la misma data

**Ventaja**: ShadCN encaja perfecto en ambos enfoques.

**Componentes a transformar**:
- Listas de pedidos (OrdersList)
- Tablas de productos
- Vistas de almacenes
- Reportes y dashboards

---

## 🔄 Cambios por Área de la Aplicación

### 1. Navegación Principal

**Estado actual**: Sidebar siempre visible en desktop, Sheet en mobile (ya implementado parcialmente)

**Cambios necesarios**:
- ✅ Verificar que el Sheet mobile funcione correctamente
- 🔄 Implementar navegación inferior para secciones críticas
- 🔄 Identificar 4-5 acciones principales para bottom bar
- 🔄 **Implementar safe area**: `pb-[env(safe-area-inset-bottom)]` para iPhone
- 🔄 **No tapar contenido**: Bottom nav nunca debe tapar contenido (añadir padding inferior al contenido cuando sea necesario)

---

### 2. Gestores y Managers

**Estado actual**: Layouts desktop-first con problemas en mobile

**📌 Patrón oficial Master → Detail**:

- **Mobile** (`< 768px`): Lista → Detalle (pantalla completa alternada)
  - Lista ocupa pantalla completa
  - Al seleccionar item → Detalle ocupa pantalla completa
  - Botón "Volver" para regresar a lista
  - Acciones secundarias en bottom sheet

- **Desktop** (`≥ 768px`): Lista + Detalle en split view
  - Side-by-side si ya existe
  - Misma data, vista optimizada

**Cambios necesarios**:
- 🔄 Transformar layouts side-by-side a navegación alternada (lista ↔ detalle)
- 🔄 Implementar Sheets para listas y detalles en mobile
- 🔄 Convertir tablas a cards en mobile
- 🔄 Añadir botones de navegación móvil (volver, menú)

**Ejemplo**: OrdersManager (ya existe análisis detallado en `docs/analisis/ANALISIS_OrdersManager_Responsive.md`)

---

### 3. Formularios

**Estado actual**: Formularios diseñados para desktop

**Cambios necesarios**:
- 🔄 Aumentar tamaños de inputs (h-12 mínimo)
- 🔄 Usar bottom sheets para formularios secundarios
- 🔄 Implementar navegación entre pasos visible
- 🔄 Botones de acción sticky en bottom

---

### 4. Dashboards y Vistas de Resumen

**Estado actual**: Grids complejos que no escalan bien en mobile

**Cambios necesarios**:
- 🔄 Simplificar métricas mostradas en mobile
- 🔄 Cards apiladas verticalmente
- 🔄 Gráficos adaptativos (scroll horizontal si es necesario)
- 🔄 Priorizar información crítica

---

### 5. Modales y Diálogos

**Estado actual**: Diálogos centrados (no ideales en mobile)

**Cambios necesarios**:
- 🔄 Bottom sheets para contenido largo
- 🔄 Diálogos centrados solo para confirmaciones simples
- 🔄 Animaciones suaves (ya disponibles en ShadCN)

---

### 6. PWA - Base Técnica "App"

**Estado actual**: 
- ✅ Manifest básico existe (`public/site.webmanifest`)
- ✅ Tiene configuración básica (nombre, display standalone, theme_color)
- ❌ Falta iconos completos (solo tiene 180x180 para iOS)
- ❌ No hay Service Worker implementado
- ❌ No hay install prompt ni guía de instalación

**Cambios necesarios**:

#### 6.1. Manifest.json Completo

**Actualizar `public/site.webmanifest`** con configuración completa:

- ✅ Nombre y short_name (ya existe)
- ✅ Theme color y background color (ya existe)
- ✅ Display standalone (ya existe)
- 🔄 **Iconos completos**: 192x192 y 512x512 (requeridos para PWA)
- 🔄 **Start URL**: Verificar que sea correcta
- 🔄 **Scope**: Definir correctamente
- 🔄 **Orientación**: Preferencias de pantalla (preferir portrait o landscape)

**Archivo**: `public/site.webmanifest` (o `public/manifest.webmanifest` - mantener consistencia)

**Estructura recomendada**:
```json
{
  "name": "La PesquerApp ERP",
  "short_name": "PesquerApp",
  "description": "ERP para empresas pesqueras",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0E1E2A",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

**Nota**: Decidir si usar `site.webmanifest` o `manifest.webmanifest` y mantener consistencia en toda la app.

#### 6.2. Service Worker

**Crear Service Worker** (`public/sw.js` o `src/sw.js`) para:

**Funcionalidades básicas**:
- 🔄 **Cache de estáticos**: JS, CSS, fonts
- 🔄 **Cache de navegación básica**: Páginas principales
- 🔄 **Estrategia de cache**: Cache-first para estáticos, Network-first para API (o viceversa según necesidad)

**Implementación**:
- Usar Workbox (recomendado) o Service Worker manual
- Registrar en el layout principal o ClientLayout
- Manejar actualizaciones del Service Worker

**Estrategia recomendada**:
- **Estáticos** (JS/CSS/fonts): Cache-first con fallback a network
- **Páginas HTML**: Network-first con fallback a cache
- **API calls**: Network-first (o según lógica de negocio)

#### 6.3. Iconos Correctos

**Crear iconos necesarios**:

- 🔄 **192x192** (Android, Chrome)
- 🔄 **512x512** (Android, Chrome)
- ✅ **180x180** (iOS, ya existe como apple-touch-icon.png)
- 🔄 **Maskable icons**: Versiones que funcionen con "maskable" purpose

**iOS adicional**:
- 🔄 **Splash screens**: Para diferentes tamaños de iPhone/iPad
- ✅ **apple-touch-icon.png**: Ya existe, verificar que sea correcto

#### 6.4. Install Prompt y Guía de Instalación

**Implementar install prompt**:

- 🔄 **beforeinstallprompt event**: Capturar evento nativo de instalación
- 🔄 **Componente de instalación**: Botón/UI para mostrar el prompt
- 🔄 **Detección de instalación**: Verificar si la app está instalada
- 🔄 **Guía visual**: Instrucciones para "Añadir a pantalla de inicio"

**Guía de instalación para iOS** (especial, porque no tiene prompt nativo):

- 🔄 **Modal/Sheet con instrucciones**: 
  1. Tocar botón "Compartir" (share)
  2. Seleccionar "Añadir a pantalla de inicio"
  3. Confirmar

**Guía de instalación para Android**:

- 🔄 **Prompt automático** cuando sea posible
- 🔄 **Botón manual** como alternativa
- 🔄 **Banner informativo** opcional

#### 6.5. Meta Tags Adicionales

**Añadir en `src/app/layout.js`** o HTML:

```html
<!-- iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="PesquerApp">

<!-- Android/Chrome -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0E1E2A">
```

**📌 Alcance real de PWA - Gobierno claro**:

- ✅ **Offline**: Solo lectura de pantallas recientes / listas cacheadas
- ✅ **Operaciones críticas**: Requieren red (crear, editar, eliminar)
- 🔄 **Operaciones encoladas**: Fase futura (no implementado aún)
- ✅ **Cache**: Estáticos (JS/CSS/fonts) y navegación básica

**Objetivo**: Mejorar rendimiento y experiencia de instalación, **NO** proporcionar funcionalidad offline completa.

**Impacto**: Convierte la web app en una experiencia tipo app nativa, mejorando:
- ✅ Rendimiento (cache de estáticos)
- ✅ Fiabilidad (pantallas cacheadas para lectura)
- ✅ Experiencia de usuario (instalación, icono en home)
- ✅ Engagement (se siente como app nativa)

---

## 🎬 Framer Motion - Animaciones con Propósito Mobile

**Estado actual**: ✅ `framer-motion` ya está instalado en el proyecto

### 🧠 Filosofía de Uso

**Framer Motion no es para "animar por animar"**. En mobile se usa para:

- ✅ Dar continuidad espacial (esto viene de aquí → va allí)
- ✅ Reforzar jerarquía visual
- ✅ Reducir fricción cognitiva
- ❌ NO para decorar sin propósito

**Regla general**: Si la animación acelera la comprensión → bien. Si distrae → fuera.

### ✅ Dónde SÍ usar Framer Motion (Recomendado)

#### 1️⃣ Navegación y Transiciones de Pantalla

**Esto es lo más importante en mobile.**

**Usos**:
- Entrada/salida de vistas
- Cambios entre secciones del bottom nav
- Drill-down: lista → detalle

**Patrón conceptual**:
- Lista entra desde la derecha
- Volver → sale a la derecha
- Bottom nav mantiene contexto

**Ejemplo de transición drill-down**:
```jsx
// Lista → Detalle
<motion.div
  initial={{ x: 300, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 300, opacity: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {/* Contenido */}
</motion.div>
```

**Impacto**: Sensación 100% app nativa

---

#### 2️⃣ Bottom Sheets y Modales

**Aunque ShadCN ya anima**, Framer Motion permite:

- Transiciones más suaves
- Spring physics (sensación más natural)
- Mejor "peso" visual

**Usos**:
- Filtros
- Acciones rápidas
- Formularios cortos

**Ejemplo**:
```jsx
<motion.div
  initial={{ y: "100%" }}
  animate={{ y: 0 }}
  exit={{ y: "100%" }}
  transition={{ type: "spring", damping: 25, stiffness: 200 }}
>
  {/* Bottom Sheet content */}
</motion.div>
```

---

#### 3️⃣ Lists & Cards (Microinteracciones)

**Usos concretos**:
- Aparecer items al cargar (stagger)
- Expandir/colapsar cards
- Confirmar acciones (check, success)

**⚠️ Regla importante**:
- NO animar 100 filas simultáneamente
- Solo animar:
  - Entrada inicial
  - Cambios importantes (selección, eliminación)

**Ejemplo de entrada staggerada**:
```jsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {/* Card content */}
  </motion.div>
))}
```

---

#### 4️⃣ Feedback de Acciones

**Ideal para**:
- Guardado OK
- Errores
- Cambio de estado

**Patrón recomendado**:
```
Botón → loader → check animado
```

**Ejemplo**:
```jsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring" }}
>
  <CheckCircle className="text-green-500" />
</motion.div>
```

**Impacto**: Reduce ansiedad del usuario con feedback visual inmediato y claro.

---

### ❌ Dónde NO usarlo (Muy Importante)

**🚫 Animar todo**:
- Inputs (solo si es crítico para UX)
- Cada hover (en mobile no hay hover)
- Cada render

**🚫 Animaciones largas**:
- >300ms en mobile es demasiado lento
- Máximo 250ms para transiciones

**🚫 Efectos "bonitos" sin significado**:
- Animaciones decorativas innecesarias
- Efectos que no comunican nada

**🚫 Layout shifts innecesarios**:
- Evitar animaciones que causan reflows
- Preferir transform y opacity sobre width/height

**Regla para ERP**:
> La animación debe acelerar la comprensión, no distraer.

---

### ⚙️ Cómo Integrarlo con ShadCN (La Clave)

**ShadCN + Framer Motion encajan perfecto porque**:

- **ShadCN** = Estructura + accesibilidad
- **Framer Motion** = Movimiento

**Patrón recomendado**:

1. **Componentes ShadCN "puros"** (mantener estructura)
2. **Envoltorios `motion.div`** solo cuando sea necesario
3. **NO mezclar** lógica de animación dentro de componentes base

**Ejemplo de integración**:
```jsx
// ✅ CORRECTO: Envolver componente ShadCN
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <Card>
    {/* Contenido ShadCN */}
  </Card>
</motion.div>

// ❌ EVITAR: Mezclar animación dentro del componente
<Card className="animate-in"> {/* Mejor usar motion wrapper */}
```

---

### 🎯 Motion System - Presets Globales

**Define 3 presets globales** para mantener consistencia:

#### 1. `pageTransition` - Transiciones de Pantalla

```jsx
// src/lib/motion-presets.js
export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2, ease: "easeOut" }
};
```

**Uso**: Navegación entre páginas, drill-down (lista → detalle)

#### 2. `sheetTransition` - Bottom Sheets y Modales

```jsx
export const sheetTransition = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { 
    type: "spring", 
    damping: 25, 
    stiffness: 200,
    duration: 0.24
  }
};
```

**Uso**: Bottom sheets, modales que aparecen desde abajo

#### 3. `feedbackPop` - Feedback de Acciones

```jsx
export const feedbackPop = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { 
    type: "spring", 
    damping: 15, 
    stiffness: 300,
    duration: 0.18
  }
};
```

**Uso**: Confirmaciones (check, success), errores, cambios de estado

**Regla del Motion System**:
- ✅ Duración: 0.18–0.24s (máximo)
- ✅ Solo `transform` + `opacity` (nunca width/height/top/left)
- ✅ Respetar `prefers-reduced-motion` (desactivar si está activado)
- ✅ Usar estos presets consistentemente (no crear variaciones)

**Ejemplo de uso**:
```jsx
import { pageTransition } from '@/lib/motion-presets';
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();

<motion.div
  {...pageTransition}
  transition={prefersReducedMotion ? { duration: 0 } : pageTransition.transition}
>
  {/* Contenido */}
</motion.div>
```

---

### 🎯 Recomendación Final para la App

**✔ Sí a Framer Motion** como herramienta complementaria

**✔ Usarlo como "pegamento visual"** en:
- ✅ Transiciones de pantalla
- ✅ Bottom sheets mejoradas
- ✅ Drill-down (lista → detalle)
- ✅ Feedback de acciones críticas

**❌ No como sistema decorativo**:
- No animar todo "porque queda bonito"
- Cada animación debe tener propósito UX
- En ERP: funcionalidad > decoración

**Integración**:
- Mantener componentes ShadCN puros
- Envolver con `motion.*` cuando sea necesario
- Respetar `prefers-reduced-motion`
- Animaciones rápidas (<250ms)

---

## 🛠️ Componentes ShadCN a Utilizar

### Ya Disponibles (verificar uso)

- ✅ `Sheet` - Para bottom sheets y drawers laterales
- ✅ `Dialog` - Para modales (usar con precaución en mobile)
- ✅ `Card` - Para vistas de cards en mobile
- ✅ `Button` - Con variantes mobile-friendly
- ✅ `Input` - Necesita ajustes de tamaño
- ✅ `Sidebar` - Ya tiene soporte mobile con Sheet

### Potencialmente Necesarios

- 🔄 `Drawer` - Si se necesita más control que Sheet
- 🔄 Variantes mobile de componentes existentes

### Librerías Complementarias (Opcional)

- `react-spring-bottom-sheet` - Si se necesita funcionalidad avanzada de bottom sheets
- ✅ `framer-motion` - Ya instalado (ver sección específica de uso)

---

## 🎨 Design Tokens Mobile

**Valores estándar** para mantener coherencia visual en toda la app mobile:

### Alturas de Componentes

| Componente | Valor Mobile | Clase Tailwind |
|------------|--------------|----------------|
| Inputs | 48px / 56px | `h-12` / `h-14` |
| Botones | 44px mínimo | `h-11` mínimo |
| Touch targets | 44x44px mínimo | `min-h-[44px] min-w-[44px]` |
| Bottom nav items | 56px | `h-14` |

### Padding y Spacing

| Uso | Valor Mobile | Clase Tailwind |
|-----|--------------|----------------|
| Padding horizontal pantalla | 16px | `px-4` |
| Padding vertical pantalla | 12px | `py-3` |
| Espaciado entre cards | 12px | `gap-3` |
| Espaciado vertical entre secciones | 24px | `space-y-6` |
| Padding interno de cards | 16px | `p-4` |

### Border Radius

| Uso | Valor Mobile | Clase Tailwind | Nota |
|-----|--------------|----------------|------|
| Cards | 16px | `rounded-2xl` | Más "app-like" |
| Botones | 8px | `rounded-lg` | |
| Inputs | 8px | `rounded-lg` | |
| Bottom sheets | 24px (top) | `rounded-t-3xl` | |

### Iconos

| Uso | Valor Mobile | Clase Tailwind |
|-----|--------------|----------------|
| Iconos en bottom nav | 24px | `w-6 h-6` |
| Iconos en botones | 20px | `w-5 h-5` |
| Iconos en cards | 20px | `w-5 h-5` |

### Safe Areas (iOS)

| Uso | Valor | Clase Tailwind |
|-----|-------|----------------|
| Bottom padding (safe area) | Variable | `pb-[env(safe-area-inset-bottom)]` |
| Top padding (notch) | Variable | `pt-[env(safe-area-inset-top)]` |

**Ejemplo de uso**:
```jsx
// Bottom nav con safe area
<div className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] bg-background border-t">
  {/* Bottom nav content */}
</div>

// Card con spacing estándar
<div className="p-4 rounded-2xl gap-3">
  {/* Card content */}
</div>
```

**Regla**: Usar estos valores consistentemente en toda la app mobile para lograr uniformidad visual.

---

## 📐 Breakpoints y Estrategia Responsive

### Breakpoints Tailwind Actuales

```
sm: 640px   - Móviles grandes
md: 768px   - Tablets (PUNTO DE CORTE MÓVIL/DESKTOP)
lg: 1024px  - Tablets grandes / Desktop pequeño
xl: 1280px  - Desktop
2xl: 1536px - Desktop grande
```

### Estrategia de Breakpoints

**Hook `useIsMobile()`**: Usa `768px` como punto de corte

**Recomendación**:
- **Mobile**: `< 768px` (usar `useIsMobile()` o clases `< md:`)
- **Desktop**: `≥ 768px` (usar clases `≥ md:`)

---

## 🎯 Principios de Diseño para la Adaptación Mobile

### 1. Touch Targets

- **Mínimo**: 44x44px (Apple HIG) / 48x48px (Material Design)
- Botones siempre accesibles con pulgar
- Espaciado adecuado entre elementos interactivos

### 2. Contenido Prioritario

- Mostrar primero lo más importante
- Información secundaria en expansión/drill-down
- Evitar scroll excesivo

### 3. Gestos Nativos

- Swipe para acciones secundarias (futuro)
- Pull to refresh (futuro)
- Navegación intuitiva

### 4. Performance

- Cargar contenido crítico primero
- Lazy loading de componentes pesados
- Optimización de imágenes

---

## ♿ Accesibilidad y Ergonomía Mobile

**En ERP mobile esto se nota muchísimo**. Esta sección define requisitos específicos para accesibilidad y ergonomía en mobile.

### 1. Safe Areas (iOS)

**Problema**: iPhone con notch y sin botón home requiere respetar áreas seguras.

**Solución**:
- ✅ **Bottom padding**: Usar `pb-[env(safe-area-inset-bottom)]` en bottom nav
- ✅ **Top padding**: Usar `pt-[env(safe-area-inset-top)]` cuando sea necesario
- ✅ **No tapar contenido**: Bottom nav nunca debe tapar contenido crítico

**Ejemplo**:
```jsx
// Bottom nav con safe area
<div className="fixed bottom-0 left-0 right-0 bg-background border-t pb-[env(safe-area-inset-bottom)]">
  {/* Bottom nav content - nunca tapa contenido */}
</div>
```

### 2. Teclado Virtual

**Problema**: El teclado virtual puede tapar botones y inputs.

**Solución**:
- ✅ **Sticky actions**: Botones críticos siempre visibles (sticky bottom)
- ✅ **Scroll automático**: Usar `scrollIntoView()` cuando input recibe focus
- ✅ **Padding inferior**: Añadir padding extra cuando hay formularios

**Ejemplo**:
```jsx
// Input con scroll automático al focus
<input
  onFocus={(e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }}
/>

// Formulario con sticky actions
<div className="pb-20"> {/* Espacio para sticky buttons */}
  {/* Form fields */}
</div>
<div className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] bg-background border-t">
  <Button>Guardar</Button>
</div>
```

### 3. Focus y Scroll into View

**Requisitos**:
- ✅ **Focus visible**: Inputs deben tener focus ring claro
- ✅ **Scroll automático**: Cuando input recibe focus, hacer scroll para que sea visible
- ✅ **Prevenir zoom iOS**: Inputs con `text-base` (16px) mínimo evitan zoom automático

**Implementación**:
```jsx
// Hook para scroll on focus
const handleInputFocus = (e) => {
  setTimeout(() => {
    e.target.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'nearest'
    });
  }, 300); // Delay para que teclado aparezca primero
};
```

### 4. Contraste y Tamaños

**Requisitos WCAG**:
- ✅ **Contraste mínimo**: 4.5:1 para texto normal, 3:1 para texto grande
- ✅ **Tamaño de fuente**: Mínimo 16px (`text-base`) para evitar zoom en iOS
- ✅ **Texto legible**: Sin texto demasiado pequeño en mobile
- ✅ **Labels claros**: Siempre visibles, no solo placeholders

**Aplicación**:
- Verificar contraste en modo claro y oscuro
- Usar tamaños mínimos definidos en Design Tokens
- Labels siempre visibles (no solo placeholders)

### 5. Touch Targets y Espaciado

**Requisitos**:
- ✅ **Mínimo 44x44px**: Todos los elementos interactivos
- ✅ **Espaciado adecuado**: Mínimo 8px entre touch targets
- ✅ **Zona de pulgar**: Acciones críticas en zona accesible con pulgar

**Zona de pulgar móvil**:
```
┌─────────────────────┐
│                     │
│    Difícil          │
│                     │
│  ┌─────────────┐   │
│  │             │   │
│  │   Cómodo    │   │ ← Bottom nav aquí
│  │             │   │
│  └─────────────┘   │
│                     │
└─────────────────────┘
```

### 6. Estados y Feedback

**Requisitos**:
- ✅ **Estados claros**: Hover, active, disabled claramente diferenciados
- ✅ **Feedback inmediato**: Acciones deben tener feedback visual (< 100ms)
- ✅ **Loading states**: Indicadores claros de carga
- ✅ **Errores visibles**: Mensajes de error claros y accesibles

### 7. Navegación Accesible

**Requisitos**:
- ✅ **Navegación por teclado**: Si hay teclado físico (tablets)
- ✅ **Skip links**: En desktop, skip to main content
- ✅ **Landmarks ARIA**: Estructura semántica clara
- ✅ **Labels descriptivos**: Iconos siempre con labels o aria-labels

---

## 🎨 Aplicación Práctica

**Checklist de accesibilidad mobile**:
- [ ] Safe areas implementadas (iOS)
- [ ] Teclado no tapa botones (sticky actions)
- [ ] Scroll automático en inputs con focus
- [ ] Contraste adecuado (verificar en claro/oscuro)
- [ ] Tamaños mínimos respetados (16px texto, 44px touch)
- [ ] Feedback inmediato en acciones
- [ ] Labels siempre visibles

---

## 🚫 Cuándo SÍ Tendría Sentido Otra Librería

**Solo si**:
- Quisieras React Native / Expo para app nativa
- O una PWA ultra-nativa tipo iOS
- O gestos complejos (swipe-heavy, drag & drop complejo)

**Para adaptar una web app ERP existente a mobile, NO compensa cambiar de librería**: ShadCN + adaptaciones mobile es suficiente y mantiene armonía con el desktop existente.

---

## ✅ Recomendación Final para el Stack

### Mantener
- ✔ ShadCN UI (design system base)
- ✔ Tailwind CSS (estilos)
- ✔ Radix UI (accesibilidad, subyacente en ShadCN)
- ✔ Next.js (framework)

### Crear Versión Mobile y Armonizar
- ✔ Adaptar componentes existentes para mobile
- ✔ Crear layouts condicionales (mobile vs desktop)
- ✔ Implementar componentes adaptativos (tabla → cards en mobile)
- ✔ Armonizar diseño cuando sea necesario para consistencia

### Implementar Patrones Nativos
- ✔ Bottom sheets para formularios y acciones
- ✔ Navegación inferior para mobile
- ✔ Inputs mobile-friendly
- ✔ Cards en vez de tablas en mobile

### Resultado Esperado
- ✔ Mismo design system (ShadCN)
- ✔ Misma lógica de negocio (sin duplicación)
- ✔ Armonía visual entre desktop y mobile
- ✔ Experiencia nativa en mobile
- ✔ Desktop existente se mantiene funcionando
- ✔ Mantenimiento unificado (una librería, dos adaptaciones)

---

## 📋 Áreas de Trabajo Identificadas

### Prioridad Alta (Crítica para Mobile)

1. **Navegación Principal**
   - Bottom bar para acciones principales
   - Sidebar mejorado para mobile (ya parcialmente implementado)

2. **Gestores Principales**
   - OrdersManager (ya analizado en detalle)
   - StoresManager
   - ProductionManager
   - Cualquier gestor con layout side-by-side

3. **Formularios Complejos**
   - Inputs mobile-friendly
   - Bottom sheets para formularios secundarios
   - Navegación entre pasos

### Prioridad Media

4. **PWA - Base Técnica "App"**
   - Manifest completo con iconos correctos (192x192, 512x512)
   - Service Worker para cache de estáticos y navegación
   - Install prompt y guía de instalación (especial iOS)
   - Splash screens para iOS
   - Meta tags adicionales (apple-mobile-web-app-*)

5. **Tablas y Listas**
   - Conversión a cards en mobile
   - Implementar drill-down pattern

6. **Dashboards**
   - Simplificación de métricas
   - Cards apiladas

7. **Modales y Diálogos**
   - Bottom sheets para contenido largo
   - Optimización de diálogos simples

### Prioridad Baja (Mejoras Futuras)

8. **Gestos Avanzados**
   - Swipe actions
   - Pull to refresh
   - Drag & drop (si es necesario)

9. **PWA Features Avanzadas**
   - Offline support completo
   - Push notifications
   - Background sync

---

## 🔍 Estado Actual del Proyecto

### Ya Implementado

- ✅ Hook `useIsMobile()` en `src/hooks/use-mobile.jsx`
- ✅ Componente `Sheet` de ShadCN disponible
- ✅ Sidebar con soporte mobile (Sheet) en `src/components/ui/sidebar.jsx`
- ✅ Análisis detallado de OrdersManager responsive
- ✅ Algunos componentes ya usan `isMobile` condicionalmente
- ✅ Manifest básico (`public/site.webmanifest`) con configuración inicial
- ✅ `framer-motion` instalado (verificar uso adecuado en mobile)

### Pendiente de Implementación

#### UI/UX Mobile
- 🔄 Navegación inferior (bottom bar)
- 🔄 Crear adaptaciones mobile de layouts existentes
- 🔄 Conversión de tablas a cards en mobile
- 🔄 Bottom sheets para formularios
- 🔄 Inputs mobile-friendly en todos los formularios
- 🔄 Optimización de todos los gestores
- 🔄 Implementar animaciones con Framer Motion (transiciones, drill-down, feedback)

#### PWA y Base Técnica
- 🔄 Completar manifest.json (iconos 192x512, configuración adicional)
- 🔄 Crear Service Worker (cache de estáticos y navegación)
- 🔄 Generar iconos faltantes (192x192, 512x512, maskable)
- 🔄 Implementar install prompt y guía de instalación
- 🔄 Añadir meta tags iOS (apple-mobile-web-app-*)
- 🔄 Configurar splash screens para iOS

---

## 📝 Notas Técnicas

### Componentes Base Disponibles

- **Sheet**: `src/components/ui/sheet.jsx`
- **Dialog**: `src/components/ui/dialog.jsx`
- **Sidebar**: `src/components/ui/sidebar.jsx` (ya tiene mobile support)
- **Card**: Componente ShadCN estándar
- **Input**: Componente ShadCN estándar (necesita variantes mobile)

### Hooks Disponibles

- **useIsMobile**: `src/hooks/use-mobile.jsx` (breakpoint: 768px)

### Configuración Tailwind

- Archivo: `tailwind.config.js`
- Breakpoints personalizados disponibles además de estándar

---

## 🎬 Próximos Pasos

Este documento es un **plan general maestro**. Para facilitar la ejecución (especialmente por agentes IA), se recomienda dividirlo en 3 documentos más específicos:

### 📄 División Recomendada del Documento

1. **Guía de Patrones Mobile** 
   - Qué hace que la app se sienta "nativa"
   - Design Tokens Mobile
   - Patrones de interacción (bottom sheets, drill-down, etc.)
   - Motion System con presets
   - Accesibilidad y ergonomía

2. **Plan por Módulos**
   - OrdersManager
   - StoresManager
   - ProductionManager
   - Formularios
   - Dashboards
   - Cada módulo con su plan específico de adaptación

3. **PWA - Técnico**
   - Manifest completo
   - Service Worker
   - Install prompt
   - Iconos y splash screens
   - Solo aspectos técnicos

**Este documento actual** puede mantenerse como documento **"master"** de referencia general.

### 🔧 Próximos Pasos de Implementación

1. **Crear los 3 documentos específicos** (opcional pero recomendado)
2. **Identificar componentes específicos** a modificar por módulo
3. **Crear plan de implementación** por fases
4. **Establecer criterios de aceptación** para cada cambio
5. **Definir orden de priorización** por módulo (empezar por más críticos)

---

## 📚 Referencias

- Documentación existente sobre OrdersManager responsive: `docs/analisis/ANALISIS_OrdersManager_Responsive.md`
- Design System: `docs/10-ESTILOS-DESIGN-SYSTEM.md`
- Componentes UI: `docs/03-COMPONENTES-UI.md`
- ShadCN UI: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/
- Radix UI: https://www.radix-ui.com/

---

**Última actualización**: Documento completo - Plan general con reglas oficiales, design tokens, patrones y guías de implementación. Incluye: responsive oficial (CSS-first), design tokens mobile, patrón Master→Detail, alcance PWA, Motion System, accesibilidad y ergonomía mobile.


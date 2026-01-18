# TODO - Implementación Mobile: Tareas Generales

## 📋 Propósito

Este documento lista las tareas generales para comenzar la implementación de la adaptación mobile. Estas son tareas base que deben completarse antes o en paralelo con la adaptación de módulos específicos.

**Documento de referencia**: [00-PLAN-GENERAL.md](./00-PLAN-GENERAL.md)

---

## ✅ Estado General

**Estado**: ✅ **Fase 0, 1 y 2 Completadas** - Base técnica y design system implementados
**Progreso**: 🟢 ~85% de tareas generales completadas
**Última revisión**: Ver [RESUMEN-IMPLEMENTACION.md](./RESUMEN-IMPLEMENTACION.md) para detalles completos

---

## 🎯 Fase 0: Configuración Base y PWA

### 📱 PWA - Base Técnica "App"

#### 1. Manifest.json Completo

- [x] **Actualizar `public/site.webmanifest`** con configuración completa ✅
  - [x] Verificar/corregir `name` y `short_name`
  - [x] Añadir `description`
  - [x] Configurar `scope` y `start_url`
  - [x] Añadir `orientation: "portrait-primary"`
  - [x] Verificar `theme_color` y `background_color`

- [ ] **Iconos PWA completos** (pendiente: crear los archivos de imagen)
  - [ ] Crear icono **192x192** (`/icons/icon-192x192.png`) - Directorio creado, falta crear imagen
  - [ ] Crear icono **512x512** (`/icons/icon-512x512.png`) - Directorio creado, falta crear imagen
  - [x] Verificar icono **180x180** (`/apple-touch-icon.png`) - ya existe
  - [ ] Crear versiones **maskable** de los iconos (opcional pero recomendado)

- [x] **Añadir iconos al manifest.json** ✅ (configuración añadida, falta crear archivos de imagen)
  ```json
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
  ```

- [x] **Decidir naming**: `site.webmanifest` vs `manifest.webmanifest` ✅
  - [x] Decisión: Mantener `site.webmanifest` (ya está en uso y configurado)
  - [x] Consistencia: Usado en `src/app/layout.js` (metadata.manifest: "/site.webmanifest")

#### 2. Service Worker

- [x] **Crear Service Worker básico** ✅
  - [x] Ubicación: `public/sw.js`
  - [x] Implementar cache de estáticos (JS/CSS/fonts)
  - [x] Implementar cache de navegación básica (páginas principales)
  - [x] Estrategia: Cache-first para estáticos, Network-first para API

- [x] **Registrar Service Worker** ✅
  - [x] Creado `src/lib/sw-register.js` con utilidades de registro
  - [x] Registrado en `src/app/ClientLayout.js`
  - [x] Manejar actualizaciones del Service Worker
  - [x] Manejar instalación (primera vez)
  - [x] Solo activo en producción (NODE_ENV === 'production')

- [x] **Implementar estrategia de cache** ✅
  - [x] Estáticos: Cache-first con fallback a network
  - [x] Páginas HTML: Network-first con fallback a cache
  - [x] API calls: Network-first (operaciones críticas requieren red)
  - [x] Manejo de versiones de cache (eliminación de caches antiguos)
  - [x] Manejo de errores offline

**Archivos creados**:
- `public/sw.js` - Service Worker principal
- `src/lib/sw-register.js` - Utilidades de registro y manejo

#### 3. Install Prompt y Guía de Instalación

- [x] **Implementar install prompt (Android/Chrome)** ✅
  - [x] Hook `usePWAInstall` creado - Captura evento `beforeinstallprompt`
  - [x] Componente `InstallPrompt` creado - Botón/banner de instalación
  - [x] Componente `InstallPromptBanner` - Versión banner fija
  - [x] Detectar si la app está instalada
  - [x] Mostrar botón de instalación cuando esté disponible
  - [x] Guardar preferencia de usuario (no volver a mostrar si desestimó)

- [x] **Guía de instalación para iOS** ✅
  - [x] Componente `InstallGuideIOS` creado (Sheet bottom)
  - [x] Componente `InstallButtonIOS` - Botón simple para abrir guía
  - [x] Instrucciones visuales paso a paso:
    1. Tocar botón "Compartir" (share)
    2. Seleccionar "Añadir a pantalla de inicio"
    3. Confirmar
  - [x] Mostrar solo en iOS (detectar user agent)
  - [x] Safe areas implementadas (pb-[env(safe-area-inset-bottom)])

- [x] **Integrar en UI** ✅
  - [x] Banner inferior en mobile (`InstallPromptBanner`)
  - [x] Integrado en `ClientLayout.js`
  - [x] Visible solo en mobile (`useIsMobile()`)
  - [x] Estrategia inteligente implementada:
    - Mostrar después de 3 páginas visitadas Y 30 segundos
    - Mostrar máximo 1 vez al mes (30 días)
    - Limitar a 3 veces en total
    - Si cierra, no guardar permanentemente (vuelve a aparecer)
    - Respeta safe areas iOS

**Archivos creados**:
- `src/hooks/use-pwa-install.js` - Hook para manejo de instalación
- `src/hooks/use-pwa-install-strategy.js` - Hook con estrategia inteligente (cuándo mostrar)
- `src/components/PWA/InstallPrompt.jsx` - Componente Android/Chrome (actualizado)
- `src/components/PWA/InstallPromptBanner.jsx` - Banner con estrategia integrada
- `src/components/PWA/InstallGuideIOS.jsx` - Componente iOS
- `src/app/ClientLayout.js` - Integración del banner (actualizado)

#### 4. Meta Tags Adicionales

- [x] **Añadir meta tags iOS en `src/app/layout.js`** ✅
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="PesquerApp">
  ```

- [x] **Añadir meta tags Android/Chrome** ✅
  ```html
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0E1E2A">
  ```

- [x] **Verificar que `theme-color` esté presente** ✅ (añadido en layout.js)

#### 5. Splash Screens iOS

- [x] **Estructura creada** ✅
  - [x] Directorio `/public/splash/` creado
  - [x] README con documentación completa de tamaños y media queries
  - [x] Guías de generación con herramientas online

- [ ] **Crear splash screens** (pendiente: archivos de imagen)
  - [ ] iPhone 14 Pro Max (430x932) - `iphone-14-pro-max.png`
  - [ ] iPhone 14 Pro (393x852) - `iphone-14-pro.png`
  - [ ] iPhone 14 Plus (428x926) - `iphone-14-plus.png`
  - [ ] iPhone 14 (390x844) - `iphone-14.png`
  - [ ] iPhone 13/12 Pro Max (428x926) - `iphone-13-pro-max.png` (opcional, compatibilidad)
  - [ ] iPhone 13/12 Pro (390x844) - `iphone-13-pro.png` (opcional, compatibilidad)
  - [ ] iPhone SE 3 (375x667) - `iphone-se-3.png` (opcional)
  - [ ] iPad Pro 12.9" (1024x1366) - `ipad-pro-12.9.png`
  - [ ] iPad Pro 11" (834x1194) - `ipad-pro-11.png`
  - [ ] iPad Air (820x1180) - `ipad-air.png` (opcional)
  - [ ] iPad Mini (744x1133) - `ipad-mini.png` (opcional)

- [x] **Añadir meta tags de splash screens** en `src/app/layout.js` ✅
  - [x] Meta tags para iPhone 14 series
  - [x] Meta tags para iPhone 13/12 series (compatibilidad)
  - [x] Meta tags para iPad Pro, Air y Mini
  - [x] Fallback a `apple-touch-icon.png` si no hay splash específico

**Archivos creados**:
- `public/splash/README.md` - Documentación completa con tamaños y guías
- `src/app/layout.js` - Meta tags añadidos (actualizado)

**Nota**: Los archivos de imagen PNG deben crearse manualmente usando las herramientas documentadas en el README.

---

## 🎨 Fase 1: Design System y Configuración

### 1. Design Tokens Mobile

- [x] **Crear archivo de design tokens** ✅
  - [x] Ubicación: `src/lib/design-tokens-mobile.js`
  - [x] Exporta constantes para alturas, spacing, radius, iconos, safe areas

- [x] **Documentar valores estándar** ✅ (implementado en archivo)
  - [x] Alturas: `h-12`, `h-14` (MOBILE_HEIGHTS)
  - [x] Padding: `px-4`, `py-3`, `gap-3` (MOBILE_SPACING)
  - [x] Border radius: `rounded-2xl` para cards (MOBILE_RADIUS)
  - [x] Iconos: `w-6 h-6`, `w-5 h-5` (MOBILE_ICON_SIZES)
  - [x] Safe areas: `pb-[env(safe-area-inset-bottom)]` (MOBILE_SAFE_AREAS)

- [x] **Crear utilidades/helpers** ✅
  - [x] Helper para combinar clases mobile (`combineMobileClasses`)
  - [x] Utilidades compuestas (MOBILE_UTILITIES)

### 2. Motion System - Presets Globales

- [x] **Crear archivo de presets** `src/lib/motion-presets.js` ✅
  - [x] Implementar `pageTransition`
  - [x] Implementar `sheetTransition`
  - [x] Implementar `feedbackPop`
  - [x] Añadir soporte para `prefers-reduced-motion` (hooks y helpers)

- [x] **Presets adicionales implementados** ✅
  - [x] `drillDownTransition` - Para lista → detalle
  - [x] `drillBackTransition` - Para volver
  - [x] `listStaggerTransition` - Para listas con stagger
  - [x] `cardAppearTransition` - Para cards
  - [x] Helpers: `getTransition`, `useTransition`, `getStaggerConfig`

- [x] **Documentar uso** ✅ (comentarios JSDoc en archivo)
- [x] **Exportar constantes** ✅ (MOTION_PRESETS exportado)

### 3. Hook useIsMobile Mejorado

- [x] **Revisar hook actual** `src/hooks/use-mobile.jsx` ✅
  - [x] Verificar que funciona correctamente
  - [x] Añadir manejo de hydration mismatch
  - [x] Mejorar estado inicial (false en vez de undefined)
  - [x] Añadir verificación de window

- [x] **Crear variante `useIsMobileSafe()`** que evite hydration mismatch ✅
  - [x] Retorna objeto con `{ isMobile, mounted }`
  - [x] Solo retorna valor después de mounted
  - [x] Útil para render condicional (cambios estructurales)

- [x] **Documentar cuándo usar cada variante** ✅
  - [x] `useIsMobile()`: Para lógica condicional, no render condicional
  - [x] `useIsMobileSafe()`: Para render condicional (bottom nav, master-detail)
  - [x] Preferir CSS-first siempre que sea posible

---

## ♿ Fase 2: Accesibilidad Base

### 1. Utilidades de Accesibilidad

- [x] **Crear utilidades para safe areas** ✅
  - [x] Helper `getSafeAreaClasses()` para generar clases Tailwind
  - [x] Soporte para bottom, top, y withBottomNav
  - [x] Funciones exportadas en `src/lib/mobile-utils.js`

- [x] **Crear hook/composable para scroll on focus** ✅
  - [x] Función `scrollIntoViewOnFocus()` - Utilidad básica
  - [x] Hook `useScrollOnFocus()` - Hook React
  - [x] Manejar delay para teclado virtual (default 300ms)
  - [x] Configurar opciones (behavior, block, inline)

- [x] **Utilidades adicionales creadas** ✅
  - [x] `isValidTouchTarget()` - Verificar tamaño mínimo (44x44px)
  - [x] `getMinTouchTargetClasses()` - Clases para touch targets
  - [x] `isKeyboardVisible()` - Detectar teclado virtual
  - [x] `useKeyboardVisible()` - Hook para detectar teclado

- [ ] **Verificar contraste** (manual, no requiere código)
  - [ ] Revisar modo claro y oscuro
  - [ ] Asegurar 4.5:1 para texto normal
  - [ ] Asegurar 3:1 para texto grande

### 2. Componentes Base Mejorados

- [ ] **Inputs mobile-friendly**
  - [ ] Crear variante de Input con `h-12` mínimo
  - [ ] Asegurar `text-base` (16px) para evitar zoom iOS
  - [ ] Labels siempre visibles (no solo placeholders)
  - [ ] Añadir auto-scroll on focus

- [ ] **Botones mobile-friendly**
  - [ ] Asegurar mínimo 44x44px en todos los botones
  - [ ] Verificar espaciado adecuado entre botones
  - [ ] Estados claros (hover, active, disabled)

---

## 🧪 Fase 3: Testing y Validación

### 1. Testing PWA

- [ ] **Validar manifest.json**
  - [ ] Usar herramienta de validación (PWA Builder, Lighthouse)
  - [ ] Verificar iconos se cargan correctamente
  - [ ] Probar instalación en Android/Chrome
  - [ ] Probar instalación en iOS (guía manual)

- [ ] **Validar Service Worker**
  - [ ] Verificar registro correcto
  - [ ] Probar cache de estáticos
  - [ ] Probar cache de navegación
  - [ ] Verificar que API no se cachea incorrectamente
  - [ ] Probar actualización del Service Worker

### 2. Testing Responsive Base

- [ ] **Verificar breakpoint 768px**
  - [ ] Probar en diferentes dispositivos
  - [ ] Verificar que `useIsMobile()` funciona correctamente
  - [ ] Verificar que clases Tailwind responsive funcionan

- [ ] **Testing básico de accesibilidad**
  - [ ] Probar safe areas en iOS (iPhone con notch)
  - [ ] Probar que teclado no tapa botones
  - [ ] Probar scroll on focus en inputs
  - [ ] Verificar touch targets (mínimo 44x44px)

---

## 📚 Fase 4: Documentación

### 1. Documentación Técnica

- [ ] **Actualizar documentación** con cambios realizados
  - [ ] Documentar Service Worker
  - [ ] Documentar instalación de PWA
  - [ ] Documentar design tokens mobile
  - [ ] Documentar motion presets

### 2. Guías de Uso

- [ ] **Crear guía rápida** para desarrolladores
  - [ ] Cómo usar design tokens
  - [ ] Cómo usar motion presets
  - [ ] Cómo respetar safe areas
  - [ ] Cómo hacer componentes mobile-friendly

---

## 🎯 Priorización

### Alta Prioridad (Comenzar Aquí)

1. ✅ **PWA - Manifest completo** (iconos 192x512)
2. ✅ **Service Worker básico** (cache estáticos)
3. ✅ **Meta tags iOS/Android**
4. ✅ **Design Tokens Mobile** (valores estándar)
5. ✅ **Motion System - Presets**

### Media Prioridad

6. ✅ Install prompt y guía iOS - COMPLETADO
7. ✅ Splash screens iOS (meta tags y documentación) - COMPLETADO (falta crear imágenes)
8. ✅ Hook useIsMobile mejorado (hydration) - COMPLETADO
9. ✅ Utilidades de accesibilidad (safe areas, scroll on focus) - COMPLETADO

**Pendiente Media Prioridad**:
- ⚠️ Crear iconos PWA (192x512) - Requiere imágenes
- ⚠️ Crear splash screens iOS - Requiere imágenes
- ❌ Integrar Install Prompt en UI
- ❌ Componentes base mejorados (inputs, botones)

### Baja Prioridad (Mejoras)

10. Testing y validación completa
11. Documentación técnica detallada
12. Componentes base mejorados (inputs, botones)

---

## 📝 Notas

### Alcance PWA

**Recordatorio importante** (del plan general):
- ✅ **Offline**: Solo lectura de pantallas recientes / listas cacheadas
- ✅ **Operaciones críticas**: Requieren red (crear, editar, eliminar)
- 🔄 **Operaciones encoladas**: Fase futura (no implementado aún)

**No prometer** funcionalidad offline completa desde el inicio.

### Regla Responsive

**Recordatorio**: CSS-first, JS solo para cambios estructurales
- Clases Tailwind para el 80% de casos
- `useIsMobile()` solo para bottom nav, master-detail, etc.

---

## ✅ Checklist de Completitud

Antes de pasar a módulos específicos (OrdersManager, etc.), asegurar:

- [x] Manifest.json completo y validado ✅ (falta crear iconos 192x512)
- [ ] Iconos PWA (192, 512) creados (pendiente: archivos de imagen)
- [x] Service Worker funcionando (cache básico) ✅
- [x] Meta tags iOS/Android añadidos ✅
- [x] Design Tokens Mobile definidos ✅
- [x] Motion System presets creados ✅
- [ ] Safe areas funcionando en iOS (siguiente fase)
- [ ] Inputs básicos mobile-friendly (altura mínima, scroll on focus) (siguiente fase)

---

**Última actualización**: Fase 0, 1 y 2 completadas. Ver [RESUMEN-IMPLEMENTACION.md](./RESUMEN-IMPLEMENTACION.md) para revisión completa.


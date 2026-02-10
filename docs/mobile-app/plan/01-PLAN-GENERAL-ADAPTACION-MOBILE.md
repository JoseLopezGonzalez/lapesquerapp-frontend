# Plan General: Adaptación Mobile y Armonización con Desktop

## 📋 Resumen Ejecutivo

Este documento define el **plan maestro** para adaptar la web app (actualmente desktop-first) a una experiencia **mobile fluida, usable y con sensación de app nativa**, manteniendo **ShadCN UI** como base del design system y asegurando la **armonía entre desktop y mobile**.

**Decisión clave**: ✅ **Mantener ShadCN UI** y crear **adaptaciones mobile específicas**, sin romper la coherencia con la versión desktop existente.

---

## 🎯 Filosofía del Cambio

### Por qué **NO** cambiar de librería

Cambiar de librería solo para mobile introduce más problemas que beneficios:

- ❌ Se rompe la consistencia visual (desktop vs mobile)
- ❌ Se duplica lógica, estilos y mantenimiento
- ❌ Aumenta la complejidad del sistema
- ❌ Se acaba “forzando” una armonía que nunca es perfecta

### Por qué **ShadCN UI** es la opción correcta

ShadCN no es “solo desktop”. Es **Radix UI + Tailwind CSS**, una base ideal para crear experiencias mobile nativas manteniendo un único design system:

- ✅ Componentes accesibles por defecto (Radix)
- ✅ Estilos flexibles y composables (Tailwind)
- ✅ Totalmente personalizable
- ✅ Permite variantes mobile sin duplicar componentes
- ✅ Consistencia visual garantizada entre plataformas

---

## 🧠 Enfoque Correcto: Crear Mobile y Armonizar con Desktop

No se trata de cambiar la UI library, sino de **crear adaptaciones mobile conscientes**, alineadas con la versión desktop.

### 1️⃣ Contexto del Proyecto

**Situación actual**
- ✅ Web app estable y funcional en desktop
- ✅ ShadCN UI como design system consolidado
- 🔄 Experiencia mobile aún por construir

**Enfoque práctico**
- Crear variantes mobile de componentes existentes
- Mantener la misma lógica de negocio
- Adaptar layouts y patrones de interacción
- Armonizar solo cuando mejore la UX global

**Principios clave para Mobile**
- Pantallas simples y enfocadas
- Jerarquía clara de información
- Touch targets ≥ 44x44px
- Menos densidad visual que en desktop
- Patrones de interacción nativos de apps

### 2️⃣ Estrategia de Armonización

**Armonizar significa mejorar la experiencia, no igualar por defecto.**

**Cuándo SÍ armonizar**
- Inconsistencias visuales claras
- Confusión de UX entre plataformas
- Mejoras que benefician a ambas versiones
- Ajustes necesarios en componentes base

**Cuándo NO armonizar**
- Patrones distintos pero coherentes (sidebar vs bottom nav)
- Layouts diferentes pero eficaces
- Touch targets más grandes en mobile (correcto)

**Principio rector**
> Armonizar cuando aporte claridad y calidad de experiencia.

---

## 🧩 Patrones Mobile “Nativos” con ShadCN

### 🔹 Bottom Sheets (Patrón clave en mobile)

**Opciones disponibles**
- `Sheet` de ShadCN (`side="bottom"`)
- `Dialog` con animaciones personalizadas
- `react-spring-bottom-sheet` (solo si se necesita funcionalidad avanzada)

**Usos recomendados**
- Formularios secundarios
- Filtros y opciones
- Acciones con input
- Detalles expandibles
- Confirmaciones

**Impacto**
> Sustituye el modal centrado por un patrón mobile-natural.

---

### 🔹 Navegación Inferior (Bottom Navigation)

**En mobile**
- Barra fija inferior
- Máximo 4–5 acciones principales
- Iconos claros (con o sin labels cortos)
- Touch targets generosos

**En desktop**
- Sidebar o topbar existente

**Estrategia**
- Mismo routing
- Layout condicional según breakpoint
  - Mobile `<768px`: bottom nav
  - Desktop `≥768px`: sidebar

---

### 🔹 Inputs Mobile-Friendly

**Requisitos mínimos**
- Altura: 48–56px (`h-12` / `h-14`)
- Texto: `text-base` (16px mínimo, evita zoom iOS)
- Labels siempre visibles
- Feedback inmediato
- Teclado adecuado por tipo de input

**Implementación**
- Variantes mobile de Input ShadCN
- Clases Tailwind responsivas
- Un solo componente, estilos adaptados

---

## 🎨 Layouts Condicionales

### Estrategia General

**Misma lógica, distinta composición visual**:

```
Desktop → sidebar, tablas, vistas densas
Mobile  → cards, listas, acciones inferiores
```

Desktop ya existe y funciona.  
Mobile se construye adaptando ese contenido.

### Implementación Técnica

**Regla oficial**: **CSS-first. JS solo para cambios estructurales.**

- 80%: Tailwind responsive
- 20%: `useIsMobile()` para layouts distintos

**Breakpoint oficial**: `md = 768px`

#### CSS-first (Recomendado)

```jsx
<div className="flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
  <div className="w-full md:w-1/2" />
</div>
```

#### JS-first (Solo cuando sea necesario)

```jsx
const isMobile = useIsMobile();

return isMobile ? <MobileLayout /> : <DesktopLayout />;
```

⚠️ Evitar hydration mismatch (mounted state, client components).

---

## 📊 Transformación de Componentes Críticos

### Tablas ≠ Mobile

**Mobile**
- ❌ Tablas con scroll horizontal
- ✅ Cards
- ✅ Filas expandibles
- ✅ Drill-down lista → detalle

**Estrategia**
- Misma data
- Render condicional:
  - Desktop: `Table`
  - Mobile: `Card`

---

## 🔄 Cambios por Área

### Navegación
- Bottom nav
- Safe areas iOS
- Padding para no tapar contenido

### Gestores (Managers)
- Patrón master → detail
- Lista ↔ detalle a pantalla completa en mobile
- Split view en desktop

### Formularios
- Inputs grandes
- Bottom sheets
- Acciones sticky

### Dashboards
- Menos métricas
- Cards verticales
- Prioridad a lo crítico

### Modales
- Bottom sheets para contenido largo
- Diálogos centrados solo para confirmaciones

---

## 📱 PWA – Base Técnica

**Objetivo**
> Sentirse como app, no ser offline-first.

**Incluye**
- Manifest completo
- Iconos correctos
- Service Worker (cache básico)
- Install prompt (Android + guía iOS)
- Meta tags iOS/Android

**No incluye (por ahora)**
- Offline completo
- Sync en background
- Push notifications

---

## 🎬 Framer Motion – Animación con Propósito

**Uso correcto**
- Transiciones de pantalla
- Drill-down
- Bottom sheets
- Feedback de acciones

**Reglas**
- <250ms
- Solo `transform` y `opacity`
- Respetar `prefers-reduced-motion`
- Nada decorativo

---

## 🎨 Design Tokens Mobile (Resumen)

- Inputs: 48–56px
- Touch targets: ≥44px
- Cards: `rounded-2xl`
- Bottom nav: 56px
- Padding horizontal: 16px
- Safe areas iOS siempre respetadas

---

## ✅ Stack Final

**Mantener**
- ShadCN UI
- Tailwind CSS
- Radix UI
- Next.js

**Crear**
- Adaptaciones mobile
- Layouts condicionales
- Patrones nativos

**Resultado esperado**
- Un solo design system
- Una sola lógica de negocio
- Experiencia mobile nativa
- Desktop intacto
- Mantenimiento unificado

---

## 🎬 Próximos Pasos

Este documento es el **master**.

Se recomienda dividir en:
1. Guía de Patrones Mobile
2. Plan por Módulos
3. PWA Técnico

---

## 📚 Referencias

- ShadCN UI — https://ui.shadcn.com/
- Tailwind CSS — https://tailwindcss.com/
- Radix UI — https://www.radix-ui.com/

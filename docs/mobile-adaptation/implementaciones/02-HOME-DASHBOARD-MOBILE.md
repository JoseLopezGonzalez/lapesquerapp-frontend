# 02. Home y Dashboard Mobile

**Estado**: 📝 Planificación  
**Prioridad**: 2 (Después de Layout)  
**Estimación**: Media-Alta complejidad

---

## 📋 Resumen

Este documento detalla el plan para adaptar el Home y Dashboard a mobile, mejorando todos los cards, gráficos y componentes para que se vean naturales y usables en dispositivos móviles.

**Objetivo**: Transformar el dashboard denso de escritorio en una experiencia mobile limpia, con cards optimizados y gráficos adaptativos.

---

## 🎯 Componentes a Adaptar

### Home (`/admin/home`)
- **SpeciesInventoryOverview**: Card de inventario por especies
- **RawMaterialRadialBarChart**: Gráfico radial de materias primas
- **ProductsInventoryOverview**: Card de inventario por productos
- **RawAreaChart**: Gráfico de área de recepciones

### Dashboard (`/admin/dashboard`)
- **CurrentStockCard**: Card de stock total actual
- **TotalQuantitySoldCard**: Card de cantidad total vendida
- **TotalAmountSoldCard**: Card de importe total vendido
- **NewLabelingFeatureCard**: Card de nueva funcionalidad
- **Gráficos en Masonry**:
  - OrderRankingChart
  - SalesBySalespersonPieChart
  - StockBySpeciesCard
  - StockByProductsCard
  - SalesChart
  - ReceptionChart
  - DispatchChart
  - TransportRadarChart
  - WorkingEmployeesCard

---

## 🔍 Análisis del Estado Actual

### Home Component
```jsx
// Estructura actual: Grid de 10 columnas
<div className="grid grid-cols-10 gap-5 w-full px-6 md:px-10 xl:px-20 pb-10 pt-14">
```

**Problemas identificados**:
- Grid de 10 columnas no funciona bien en mobile
- Padding lateral (`px-6 md:px-10 xl:px-20`) demasiado grande en mobile
- Padding superior (`pt-14`) puede interferir con el avatar flotante
- Cards con gradientes complejos pueden no verse bien en pantallas pequeñas
- Gráficos pueden ser demasiado densos en mobile

### Dashboard Component
```jsx
// Estructura actual: Grid + Masonry
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
```

**Problemas identificados**:
- Grid responsive complejo puede causar saltos visuales
- Masonry breakpoint en 768px (mismo que nuestro breakpoint mobile)
- Cards con imágenes absolutas pueden desbordarse
- Texto puede ser demasiado pequeño en mobile
- Touch targets pueden ser insuficientes

### Cards Individuales
**Problemas comunes**:
- Padding fijo no se adapta bien a mobile
- Textos pequeños (`text-sm`, `text-xs`)
- Iconos pequeños (`w-4 h-4`, `w-5 h-5`)
- Botones pequeños (no cumplen 44x44px mínimo)
- Imágenes absolutas que se desbordan
- Gradientes complejos que pueden ser pesados en mobile

---

## 🎨 Diseño Propuesto

### Principios Mobile

1. **Stack Vertical**: Todo en una columna en mobile (<768px)
2. **Cards Full-Width**: Cards ocupan el 100% del ancho menos padding
3. **Espaciado Consistente**: Usar Design Tokens Mobile
4. **Touch Targets**: Mínimo 44x44px para todos los elementos interactivos
5. **Tipografía Legible**: Texto mínimo 14px, preferiblemente 16px
6. **Simplificar Gráficos**: Reducir densidad, aumentar tamaño de labels

### Layout Mobile Home

```
┌─────────────────────────┐
│  Título: Panel Control  │
│  (texto más pequeño)    │
├─────────────────────────┤
│  [Card Especies]        │
│  (Full width)           │
├─────────────────────────┤
│  [Gráfico Radial]       │
│  (Full width)           │
├─────────────────────────┤
│  [Card Productos]       │
│  (Full width)           │
├─────────────────────────┤
│  [Gráfico Área]         │
│  (Full width)           │
└─────────────────────────┘
```

### Layout Mobile Dashboard

```
┌─────────────────────────┐
│  Saludo + Nombre        │
│  (Más compacto)         │
├─────────────────────────┤
│  [Card Stock Actual]    │
│  (Full width)           │
├─────────────────────────┤
│  [Card Cantidad Vend.]  │
│  (Full width)           │
├─────────────────────────┤
│  [Card Importe Vend.]   │
│  (Full width)           │
├─────────────────────────┤
│  [Card Nueva Feature]   │
│  (Oculto en mobile)     │
├─────────────────────────┤
│  [Gráfico 1]            │
│  (Full width)           │
├─────────────────────────┤
│  [Gráfico 2]            │
│  (Full width)           │
│  ...                    │
└─────────────────────────┘
```

---

## 🔧 Cambios Necesarios

### 1. Home Component (`src/components/Admin/Home/index.jsx`)

**Cambios**:
- Cambiar grid de 10 columnas a stack vertical en mobile
- Reducir padding lateral en mobile (`px-4` en mobile, mantener responsive en desktop)
- Ajustar padding superior para mobile (`pt-4` en mobile)
- Simplificar breakpoints: solo mobile (<768px) y desktop (≥768px)

**Estructura propuesta**:
```jsx
<div className={cn(
  "w-full",
  "flex flex-col gap-4 md:gap-5", // Stack vertical en mobile
  "px-4 md:px-6 xl:px-20", // Padding responsive
  "pb-10 pt-4 md:pt-14", // Padding top reducido en mobile
  "h-full overflow-y-auto"
)}>
```

### 2. Dashboard Component (`src/components/Admin/Dashboard/index.js`)

**Cambios**:
- Simplificar grid a una sola columna en mobile
- Ajustar padding lateral
- Ocultar NewLabelingFeatureCard en mobile (ya lo hace con `hidden sm:block`)
- Ajustar Masonry breakpoints para mobile
- Reducir tamaño de título y saludo en mobile

**Estructura propuesta**:
```jsx
<div className={cn(
  "h-full w-full flex flex-col gap-4",
  "px-4 md:px-6", // Padding reducido en mobile
  "py-3"
)}>
  {/* Header más compacto en mobile */}
  <div className="w-full">
    <div className="flex flex-col items-start justify-center mb-2 md:mb-4">
      <p className="text-sm md:text-md">...</p>
      <h1 className="text-2xl md:text-4xl font-light">...</h1>
    </div>
  </div>
  
  {/* Grid simplificado */}
  <div className={cn(
    "w-full grid gap-4",
    "grid-cols-1", // Mobile: 1 columna
    "md:grid-cols-2", // Tablet: 2 columnas
    "xl:grid-cols-2 2xl:grid-cols-4" // Desktop: mantener actual
  )}>
```

### 3. Cards - Cambios Generales

**Patrón común para todos los cards**:

1. **Padding Responsive**:
   - Mobile: `p-4` o `p-3`
   - Desktop: `p-4 md:p-5` o `p-6`

2. **Tipografía Responsive**:
   - Títulos: `text-base md:text-lg` (en lugar de `text-sm`)
   - Valores principales: `text-2xl md:text-3xl` (en lugar de `text-3xl` fijo)
   - Texto secundario: `text-sm md:text-xs` (o mantener `text-sm`)

3. **Iconos Responsive**:
   - Mobile: `w-5 h-5` (en lugar de `w-4 h-4`)
   - Desktop: `w-4 h-4` o `w-5 h-5`

4. **Botones y Touch Targets**:
   - Mínimo `min-h-[44px] min-w-[44px]`
   - Padding: `px-4 py-2` mínimo

5. **Imágenes Absolutas**:
   - Ocultar o simplificar en mobile
   - Usar `hidden md:block` si es decorativa

### 4. Cards Específicos

#### SpeciesInventoryOverview
- Ajustar padding del botón "Almacenes"
- Aumentar tamaño de texto del total
- Simplificar gradiente o mantener (si funciona bien)

#### ProductsInventoryOverview
- Ajustar input de búsqueda para mobile (más grande)
- Asegurar que la lista sea scrollable
- Items de la lista con mejor touch target

#### CurrentStockCard
- Ocultar imagen en mobile (`hidden md:block`)
- Ajustar tamaño de textos
- Mejorar layout del footer

#### TotalQuantitySoldCard / TotalAmountSoldCard
- Aumentar tamaño de iconos de trend
- Aumentar tamaño de badge de porcentaje
- Mejorar legibilidad de fechas

### 5. Gráficos

**Principios**:
- Simplificar densidad de datos en mobile
- Aumentar tamaño de labels y leyendas
- Asegurar que sean touch-friendly
- Scroll horizontal si es necesario (con indicador)

**Librerías de gráficos**:
- Recharts: Ya tiene responsive, solo ajustar config
- ApexCharts: Verificar responsive config
- Cualquier otra: Verificar y ajustar

---

## 📝 Pasos de Implementación

### Fase 1: Layout Base (Home y Dashboard)
1. ✅ Ajustar padding y spacing del contenedor principal
2. ✅ Cambiar grid a stack vertical en mobile
3. ✅ Ajustar títulos y headers para mobile

### Fase 2: Cards Principales
4. ✅ CurrentStockCard - Mobile optimizado
5. ✅ TotalQuantitySoldCard - Mobile optimizado
6. ✅ TotalAmountSoldCard - Mobile optimizado
7. ✅ SpeciesInventoryOverview - Mobile optimizado
8. ✅ ProductsInventoryOverview - Mobile optimizado

### Fase 3: Gráficos
9. ✅ RawMaterialRadialBarChart - Mobile optimizado
10. ✅ RawAreaChart - Mobile optimizado
11. ✅ Gráficos de Dashboard (Masonry) - Mobile optimizados

### Fase 4: Ajustes Finales
12. ✅ Revisar todos los cards y gráficos en mobile real
13. ✅ Ajustar espaciados finales
14. ✅ Verificar touch targets
15. ✅ Optimizar rendimiento

---

## 🎨 Design Tokens Mobile a Usar

**Padding de Cards**:
- Mobile: `p-4` (16px)
- Desktop: `p-5` o `p-6` (20-24px)

**Gap entre Cards**:
- Mobile: `gap-4` (16px)
- Desktop: `gap-5` (20px)

**Tipografía**:
- Título card: `text-base md:text-lg` (16px mobile, 18px desktop)
- Valor principal: `text-2xl md:text-3xl` (24px mobile, 30px desktop)
- Texto secundario: `text-sm` (14px)

**Iconos**:
- Mobile: `w-5 h-5` (20px)
- Desktop: `w-4 h-4` o `w-5 h-5` según necesidad

---

## 🧪 Testing

### Dispositivos a Probar
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ iPad (tablet, pero también verificar)

### Aspectos a Verificar
- ✅ Cards no se desbordan horizontalmente
- ✅ Texto legible sin zoom
- ✅ Touch targets funcionan correctamente
- ✅ Gráficos se muestran correctamente
- ✅ Scroll funciona suavemente
- ✅ No hay layout shifts
- ✅ Rendimiento aceptable

---

## 🔴 Regla de No Regresión

**Desktop no debe verse afectado visualmente por ningún cambio mobile.**

Todos los cambios deben:
- Usar breakpoints de Tailwind (`md:`, `lg:`, etc.)
- Solo aplicar estilos mobile en `<768px`
- Mantener diseño desktop exactamente igual

---

## 📚 Referencias

- [Plan General](../00-PLAN-GENERAL.md)
- [Design Tokens Mobile](../../../src/lib/design-tokens-mobile.js)
- [Motion Presets](../../../src/lib/motion-presets.js)
- [Layout y Navegación](./01-LAYOUT-NAVEGACION.md)

---

**Última actualización**: Creación del plan


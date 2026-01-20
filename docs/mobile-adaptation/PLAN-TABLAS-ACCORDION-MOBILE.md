# Plan de Implementación: Tablas Genéricas con Accordion en Mobile

## 📋 Objetivo

Transformar las tablas genéricas de entidades (`EntityBody`) para que en dispositivos móviles se muestren como filas expandibles usando el componente Accordion de shadcn, manteniendo la tabla tradicional en desktop y preservando todas las funcionalidades existentes.

---

## 🎯 Alcance

### Componentes Afectados

1. **`EntityBody`** (`src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js`)
   - Componente principal que renderiza las filas de datos
   - Actualmente usa `@tanstack/react-table` con componentes Table de shadcn

2. **`generateColumns2`** (`src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/generateColumns.js`)
   - Genera las columnas de la tabla
   - Ya tiene soporte para `hideOnMobile` en headers

3. **Componentes relacionados**:
   - `EntityClient` (componente padre)
   - `EntityTable` (wrapper)
   - `EntityTableHeader` (header con filtros y acciones)

### Funcionalidades a Preservar

- ✅ Selección de filas (checkbox individual y select all)
- ✅ Acciones por fila (editar, ver)
- ✅ Estados de carga (loading skeletons)
- ✅ Estado vacío (empty state)
- ✅ Bloqueo durante operaciones (isBlocked)
- ✅ Renderizado por tipo de dato (badge, date, currency, etc.)
- ✅ Columnas con `hideOnMobile` (ya implementado)

---

## 🏗️ Arquitectura de la Solución

### Estrategia: Renderizado Condicional

**Enfoque**: Usar `useIsMobileSafe()` para detectar mobile y renderizar condicionalmente:
- **Desktop (`≥ 768px`)**: Tabla tradicional (comportamiento actual)
- **Mobile (`< 768px`)**: Accordion con filas expandibles

### Estructura del Accordion en Mobile

```
Accordion (type="single" collapsible)
  └── AccordionItem (por cada fila)
      ├── AccordionTrigger
      │   ├── Checkbox (si isSelectable)
      │   ├── Información principal (2-3 campos clave)
      │   └── Badge de estado (si existe)
      └── AccordionContent
          ├── Grid de campos secundarios
          └── Botones de acción (editar, ver)
```

---

## 📐 Diseño Visual

### Accordion Trigger (Header de cada fila)

**Contenido visible cuando está colapsado:**
- Checkbox de selección (izquierda, si `isSelectable`)
- 2-3 campos principales identificados por:
  - Campo con `type: "id"` (si existe)
  - Primer campo sin `hideOnMobile`
  - Campo con `type: "badge"` (si existe, mostrar como badge)
- ChevronDown (automático del Accordion)

**Layout:**
```
[☑] ID: 123 | Nombre del Cliente | [Badge Estado]        [▼]
```

### Accordion Content (Contenido expandido)

**Estructura:**
- Grid de 2 columnas para campos secundarios
- Cada campo muestra: `Label: Valor`
- Botones de acción al final (editar, ver)
- Campos con `hideOnMobile: true` se muestran aquí

**Layout:**
```
┌─────────────────────────────────┐
│ Fecha: 15/01/2024               │
│ Referencia: REF-123             │
│ Peso total: 1,250.50 kg         │
│ Total: €1,250.00                │
│                                 │
│ [Editar] [Ver detalles]         │
└─────────────────────────────────┘
```

---

## 🔧 Plan de Implementación

### Fase 1: Preparación y Análisis

#### 1.1 Identificar Campos Principales
- **Objetivo**: Determinar qué campos mostrar en el trigger del accordion
- **Criterios**:
  - Prioridad 1: Campo con `type: "id"` (si existe)
  - Prioridad 2: Primer campo sin `hideOnMobile`
  - Prioridad 3: Campo con `type: "badge"` (estado)
  - Máximo 3 campos en el trigger

#### 1.2 Crear Helper para Identificar Campos Principales
- **Archivo**: `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/utils/getPrimaryFields.js`
- **Función**: `getPrimaryFields(headers, maxFields = 3)`
- **Retorna**: Array de headers que se mostrarán en el trigger

#### 1.3 Crear Helper para Renderizar Campo en Accordion
- **Archivo**: `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/utils/renderAccordionField.js`
- **Función**: `renderAccordionField(header, value, row)`
- **Propósito**: Renderizar un campo con su label y valor formateado según tipo

### Fase 2: Componente AccordionBody

#### 2.1 Crear Componente Mobile Accordion
- **Archivo**: `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/AccordionBody.js`
- **Props**:
  - `data`: { rows, loading }
  - `columns`: columnas generadas
  - `headers`: headers originales de la config
  - `isSelectable`: boolean
  - `selectedRows`: array de IDs
  - `onSelectionChange`: callback
  - `onEdit`: callback
  - `onView`: callback
  - `isBlocked`: boolean
  - `emptyState`: { title, description }

#### 2.2 Estructura del Componente

```jsx
export const AccordionBody = ({ 
  data, 
  columns, 
  headers,
  isSelectable,
  selectedRows,
  onSelectionChange,
  onEdit,
  onView,
  isBlocked,
  emptyState 
}) => {
  // 1. Estados y hooks
  // 2. Helpers para identificar campos principales
  // 3. Loading state (skeletons en formato accordion)
  // 4. Empty state
  // 5. Renderizado del Accordion
}
```

#### 2.3 Loading State para Accordion
- Crear skeletons que simulen items de accordion colapsados
- Usar `Skeleton` de shadcn
- Mostrar 3-5 items de ejemplo

#### 2.4 Renderizado de Items

**Por cada fila:**
1. Identificar campos principales para el trigger
2. Renderizar trigger con checkbox (si aplica) + campos principales
3. Renderizar content con grid de campos secundarios + acciones

### Fase 3: Modificar EntityBody

#### 3.1 Integrar Detección Mobile
- Importar `useIsMobileSafe` hook
- Detectar si es mobile

#### 3.2 Renderizado Condicional
- Si `isMobile === true`: Renderizar `AccordionBody`
- Si `isMobile === false`: Renderizar tabla actual (sin cambios)

#### 3.3 Mantener Compatibilidad
- Todas las props se pasan igual a ambos componentes
- No cambiar la interfaz pública de `EntityBody`

### Fase 4: Estilos y Ajustes Visuales

#### 4.1 Estilos del Trigger
- Usar clases de shadcn Accordion sin modificar
- Ajustar padding y spacing para mobile
- Asegurar área de toque mínima (44x44px)

#### 4.2 Estilos del Content
- Grid responsive: 1 columna en mobile muy pequeño, 2 columnas en mobile normal
- Espaciado consistente entre campos
- Botones de acción con tamaño adecuado para touch

#### 4.3 Checkbox en Accordion
- Posicionar checkbox al inicio del trigger
- Mantener funcionalidad de selección individual y select all
- Estilo consistente con la tabla desktop

### Fase 5: Funcionalidades Especiales

#### 5.1 Select All en Accordion
- Agregar checkbox en header del Accordion (fuera de los items)
- Funcionalidad: seleccionar/deseleccionar todas las filas visibles

#### 5.2 Acciones por Fila
- Renderizar botones de editar/ver en el content del accordion
- Usar los mismos handlers que en desktop
- Mantener estilos de shadcn Button

#### 5.3 Estados Especiales
- **isBlocked**: Overlay similar al de la tabla, pero adaptado al accordion
- **Loading**: Skeletons en formato accordion
- **Empty**: Mismo componente EmptyState

---

## 📝 Detalles de Implementación

### Helper: getPrimaryFields

```javascript
/**
 * Identifica los campos principales para mostrar en el trigger del accordion
 * @param {Array} headers - Array de headers de la configuración
 * @param {number} maxFields - Máximo de campos a retornar (default: 3)
 * @returns {Array} Array de headers seleccionados
 */
export function getPrimaryFields(headers, maxFields = 3) {
  const primaryFields = [];
  
  // 1. Buscar campo ID
  const idField = headers.find(h => h.type === 'id');
  if (idField) primaryFields.push(idField);
  
  // 2. Buscar badge (estado)
  const badgeField = headers.find(h => h.type === 'badge');
  if (badgeField && !primaryFields.includes(badgeField)) {
    primaryFields.push(badgeField);
  }
  
  // 3. Completar con primeros campos sin hideOnMobile
  const visibleFields = headers.filter(h => 
    !h.hideOnMobile && 
    !primaryFields.includes(h) &&
    h.type !== 'id' &&
    h.type !== 'badge'
  );
  
  primaryFields.push(...visibleFields.slice(0, maxFields - primaryFields.length));
  
  return primaryFields.slice(0, maxFields);
}
```

### Helper: renderAccordionField

```javascript
/**
 * Renderiza un campo con label y valor formateado para el accordion
 * @param {Object} header - Configuración del header
 * @param {*} value - Valor del campo
 * @param {Object} row - Fila completa (para acceso a datos relacionados)
 * @returns {JSX.Element}
 */
export function renderAccordionField(header, value, row) {
  const safeValue = getSafeValue(value);
  const formattedValue = renderByType(header, value, safeValue, { row }, null, '');
  
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">
        {header.label}
      </span>
      <span className="text-sm">
        {formattedValue}
      </span>
    </div>
  );
}
```

### Estructura del AccordionItem

```jsx
<AccordionItem key={row.id} value={`row-${row.id}`}>
  <AccordionTrigger className="hover:no-underline px-4">
    <div className="flex items-center gap-3 w-full">
      {/* Checkbox */}
      {isSelectable && (
        <Checkbox
          checked={selectedRows.includes(row.id)}
          onCheckedChange={(checked) => {
            // Handle selection
          }}
          onClick={(e) => e.stopPropagation()}
          disabled={isBlocked}
        />
      )}
      
      {/* Campos principales */}
      <div className="flex-1 flex items-center gap-4 overflow-hidden">
        {primaryFields.map(header => (
          <div key={header.name} className="flex-shrink-0">
            {renderPrimaryField(header, row[header.name], row)}
          </div>
        ))}
      </div>
    </div>
  </AccordionTrigger>
  
  <AccordionContent className="px-4 pb-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {/* Campos secundarios */}
      {secondaryFields.map(header => (
        <div key={header.name}>
          {renderAccordionField(header, row[header.name], row)}
        </div>
      ))}
      
      {/* Acciones */}
      <div className="col-span-full flex gap-2 justify-end pt-2 border-t">
        {onEdit && (
          <Button size="sm" onClick={() => onEdit(row.id)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {onView && (
          <Button variant="outline" size="sm" onClick={() => onView(row.id)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver
          </Button>
        )}
      </div>
    </div>
  </AccordionContent>
</AccordionItem>
```

---

## 🎨 Consideraciones de Diseño

### Breakpoint
- **Mobile**: `< 768px` (usando `useIsMobileSafe`)
- **Desktop**: `≥ 768px`

### Espaciado
- Padding del trigger: `px-4 py-4` (área de toque generosa)
- Gap entre campos: `gap-3` o `gap-4`
- Padding del content: `px-4 pb-4`

### Tipografía
- Label en content: `text-xs text-muted-foreground font-medium`
- Valor en content: `text-sm`
- Trigger: `text-sm font-medium` (default del Accordion)

### Colores
- Usar variables de shadcn: `text-muted-foreground`, `border`, etc.
- Mantener consistencia con el tema actual

---

## ✅ Checklist de Implementación

### Preparación
- [ ] Crear helper `getPrimaryFields.js`
- [ ] Crear helper `renderAccordionField.js`
- [ ] Revisar estructura de headers en configs existentes

### Componente AccordionBody
- [ ] Crear archivo `AccordionBody.js`
- [ ] Implementar loading state (skeletons)
- [ ] Implementar empty state
- [ ] Implementar renderizado de items
- [ ] Implementar checkbox de selección
- [ ] Implementar select all
- [ ] Implementar acciones (editar, ver)
- [ ] Implementar overlay de bloqueo (isBlocked)

### Integración en EntityBody
- [ ] Importar `useIsMobileSafe`
- [ ] Agregar renderizado condicional
- [ ] Pasar todas las props necesarias
- [ ] Probar que no se rompe en desktop

### Testing
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Probar selección de filas
- [ ] Probar acciones (editar, ver)
- [ ] Probar estados de carga
- [ ] Probar estado vacío
- [ ] Probar con diferentes configuraciones de entidades
- [ ] Probar con columnas `hideOnMobile`
- [ ] Probar con diferentes tipos de datos (badge, date, currency, etc.)

### Ajustes Finales
- [ ] Ajustar espaciados y tamaños
- [ ] Verificar accesibilidad (áreas de toque, contraste)
- [ ] Optimizar rendimiento si es necesario
- [ ] Documentar cambios

---

## 🚨 Consideraciones Importantes

### 1. No Romper Desktop
- La tabla desktop debe funcionar exactamente igual que antes
- No modificar la lógica de renderizado desktop
- Solo agregar el renderizado condicional

### 2. Mantener Compatibilidad
- Todas las props de `EntityBody` deben funcionar igual
- No cambiar la interfaz pública
- Los handlers (onEdit, onView, onSelectionChange) deben funcionar igual

### 3. Performance
- El accordion puede renderizar todas las filas (no lazy loading por ahora)
- Si hay problemas de performance, considerar virtualización más adelante
- Usar `React.memo` si es necesario para los items del accordion

### 4. Accesibilidad
- Mantener áreas de toque mínimas (44x44px)
- Asegurar contraste adecuado
- Mantener navegación por teclado si es posible

### 5. Consistencia Visual
- Usar componentes de shadcn sin modificar estilos base
- Solo ajustar spacing y layout, no colores ni tipografía base
- Mantener armonía con el resto de la aplicación

---

## 📚 Referencias

- Componente Accordion: `src/components/ui/accordion.jsx`
- Hook useIsMobileSafe: `src/hooks/use-mobile.jsx`
- Plan general mobile: `docs/mobile-adaptation/00-PLAN-GENERAL.md`
- EntityBody actual: `src/components/Admin/Entity/EntityClient/EntityTable/EntityBody/index.js`

---

## 🔄 Próximos Pasos (Post-Implementación)

1. **Optimizaciones**:
   - Considerar virtualización si hay muchas filas
   - Lazy loading del content del accordion

2. **Mejoras UX**:
   - Animaciones suaves
   - Persistencia de estado expandido (localStorage)
   - Búsqueda/filtrado visual mejorado

3. **Funcionalidades Adicionales**:
   - Swipe actions (editar, eliminar con gestos)
   - Pull to refresh
   - Infinite scroll en mobile

---

**Fecha de creación**: 2024
**Estado**: Plan listo para implementación
**Prioridad**: Media-Alta (mejora UX mobile)


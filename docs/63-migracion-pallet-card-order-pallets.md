# Migración: Usar PalletCard en OrderPallets

## Situación Actual

### OrderPallets (Tabla)
- **Layout**: Tabla HTML (`<Table>`)
- **Información mostrada**:
  - ID del palet
  - Nombres de productos (texto plano)
  - Lotes (texto plano)
  - Número de cajas
  - Peso neto
  - Botones de acción (Editar, Clonar, Desvincular, Eliminar)

### Stores Manager (PalletCard)
- **Layout**: Cards con diseño visual
- **Información mostrada**:
  - ID del palet con icono
  - Badge de recepción (si tiene `receptionId`)
  - Badge de pedido (si tiene `orderId`)
  - Productos con peso y cantidad de cajas por producto
  - Lotes como badges visuales
  - Observaciones (si tiene)
  - Footer con cajas disponibles y peso disponible
  - Dropdown menu con acciones

## Cambios Necesarios

### 1. Cambiar Layout de Table a Grid/Cards

**Actual:**
```jsx
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>
    {pallets.map((pallet) => (
      <TableRow>...</TableRow>
    ))}
  </TableBody>
</Table>
```

**Nuevo:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {pallets.map((pallet) => (
    <PalletCard key={pallet.id} pallet={pallet} />
  ))}
</div>
```

O usar Masonry (como en PalletKanbanView):
```jsx
<Masonry
  breakpointCols={{
    default: 3,
    1280: 2,
    768: 1
  }}
  className="masonry-grid"
>
  {pallets.map((pallet) => (
    <PalletCard key={pallet.id} pallet={pallet} />
  ))}
</Masonry>
```

### 2. Adaptar PalletCard para OrderPallets

**Problema**: `PalletCard` usa `useStoreContext()` que no está disponible en OrderPallets.

**Solución**: Crear una versión adaptada o pasar las funciones como props.

**Opción A: Crear OrderPalletCard (Recomendado)**
- Copiar `PalletCard` y adaptarlo para usar las funciones de `useOrderContext()`
- Cambiar las acciones del dropdown:
  - ✅ Mantener: Editar, Clonar, Imprimir etiqueta
  - ❌ Eliminar: Reubicar, Quitar de posición
  - ✅ Agregar: Desvincular, Eliminar

**Opción B: Hacer PalletCard más flexible**
- Modificar `PalletCard` para aceptar props opcionales:
  - `onEdit`, `onClone`, `onUnlink`, `onDelete`
  - `onPrintLabel`, `onMove` (opcional)
  - `showMoveOption` (boolean)
  - `showRemoveFromPosition` (boolean)

### 3. Adaptar Acciones del Dropdown

**Acciones actuales en OrderPallets:**
- Editar palet
- Clonar palet
- Desvincular palet
- Eliminar palet

**Acciones en PalletCard:**
- Imprimir etiqueta
- Reubicar (no aplica en pedidos)
- Duplicar (equivalente a clonar)
- Editar
- Quitar de posición (no aplica en pedidos)

**Acciones adaptadas para OrderPalletCard:**
```jsx
<DropdownMenuContent>
  <DropdownMenuItem onClick={() => openPalletLabelDialog(pallet.id)}>
    <Printer /> Imprimir etiqueta
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => handleClonePallet(pallet.id)}>
    <Copy /> Clonar
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => handleOpenEditPallet(pallet.id)}>
    <Edit /> Editar
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem 
    onClick={() => handleUnlinkPallet(pallet.id)}
    disabled={!!pallet.receptionId}
  >
    <Unlink /> Desvincular
  </DropdownMenuItem>
  <DropdownMenuItem 
    onClick={() => handleDeletePallet(pallet.id)}
    className="text-destructive"
    disabled={!!pallet.receptionId}
  >
    <Trash2 /> Eliminar
  </DropdownMenuItem>
</DropdownMenuContent>
```

### 4. Verificar Estructura de Datos del Palet

**Campos necesarios que debe tener el palet:**
- ✅ `id` - Ya existe
- ✅ `boxes` - Array de cajas (necesario para calcular productos y disponibilidad)
- ✅ `lots` - Array de lotes (ya existe)
- ✅ `productsNames` - Array de nombres (ya existe, pero PalletCard calcula desde boxes)
- ✅ `receptionId` - Para mostrar badge (ya existe)
- ✅ `orderId` - Para mostrar badge (ya existe)
- ✅ `observations` - Para mostrar observaciones (verificar si existe)
- ✅ `netWeight` - Peso total (ya existe)
- ✅ `numberOfBoxes` - Número de cajas (ya existe)

**Helpers necesarios:**
- `getAvailableBoxes(pallet.boxes)` - Ya existe en PalletCard
- `getAvailableBoxesCount(pallet)` - Ya existe en PalletCard
- `getAvailableNetWeight(pallet)` - Ya existe en PalletCard

### 5. Imports Necesarios

```jsx
// Componentes UI
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

// Iconos
import { Layers, Package, Printer, Edit, Copy, Unlink, Trash2, ExternalLink } from 'lucide-react'

// Helpers
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers'
import { getAvailableBoxes, getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability'

// Si usas Masonry
import Masonry from 'react-masonry-css'
```

### 6. Funciones Necesarias del Contexto

**De useOrderContext:**
- ✅ `onEditingPallet` → `handleOpenEditPallet`
- ✅ `onCreatingPallet` → No necesario (solo para crear)
- ✅ `onDeletePallet` → `handleDeletePallet`
- ✅ `onUnlinkPallet` → `handleUnlinkPallet`

**Nuevas funciones necesarias:**
- `openPalletLabelDialog(palletId)` - Para imprimir etiqueta
  - Puede usar el mismo diálogo que Stores Manager o crear uno nuevo

### 7. Estado Vacío

**Actual:**
```jsx
<EmptyState
  title={'No existen palets vinculados'}
  description={'No se han añadido palets a este pedido'}
/>
```

**Nuevo:** Mantener el mismo, pero adaptado al layout de cards:
```jsx
<div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
  <EmptyState
    title={'No existen palets vinculados'}
    description={'No se han añadido palets a este pedido'}
  />
</div>
```

## Plan de Implementación

### Paso 1: Crear OrderPalletCard
1. Copiar `PalletCard` a `OrderPalletCard`
2. Cambiar `useStoreContext()` por props
3. Adaptar acciones del dropdown
4. Eliminar lógica de posición/almacén

### Paso 2: Integrar en OrderPallets
1. Importar `OrderPalletCard`
2. Reemplazar `<Table>` por grid/masonry
3. Pasar funciones necesarias como props
4. Mantener estado vacío

### Paso 3: Agregar Funcionalidad de Etiquetas
1. Crear función `openPalletLabelDialog` o usar la existente
2. Verificar si existe el diálogo de etiquetas en el contexto de pedidos

### Paso 4: Testing
1. Verificar que todos los palets se muestran correctamente
2. Verificar que las acciones funcionan
3. Verificar responsive design
4. Verificar estado vacío

## Ventajas del Cambio

✅ **Mejor UX**: Cards más visuales y fáciles de escanear
✅ **Más información**: Muestra observaciones, badges de recepción/pedido
✅ **Consistencia**: Mismo diseño que Stores Manager
✅ **Mejor responsive**: Cards se adaptan mejor a móviles
✅ **Información de disponibilidad**: Muestra cajas/peso disponibles

## Consideraciones

⚠️ **Espacio**: Los cards ocupan más espacio vertical que la tabla
⚠️ **Scroll**: Puede necesitar más scroll si hay muchos palets
⚠️ **Performance**: Masonry puede ser más pesado que una tabla simple
⚠️ **Datos**: Necesita que los palets tengan `boxes` completos (no solo resumen)

## Checklist de Verificación

- [ ] Verificar que los palets tienen `boxes` completos
- [ ] Verificar que los palets tienen `observations`
- [ ] Crear `OrderPalletCard` adaptado
- [ ] Implementar función de imprimir etiqueta
- [ ] Cambiar layout de Table a Grid/Masonry
- [ ] Adaptar acciones del dropdown
- [ ] Probar responsive design
- [ ] Verificar estado vacío
- [ ] Probar todas las acciones (editar, clonar, desvincular, eliminar)

# Auditoría: Design System Agent

# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** Design System Agent
**Scope:** Consistencia de shadcn/ui, Tailwind, tipografía, espaciado, densidad, reutilización de componentes

---

## 1. Archivos inspeccionados

| Archivo                                                                         | Componentes revisados                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------- |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/index.js`             | Card, Table, Badge, Button, Dialog             |
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js` | Dialog, Select, Table, Badge, Checkbox, Button |
| `src/components/Admin/MarketDataExtractor/index.js`                             | Tabs                                           |

---

## 2. Resumen visual de cambios

Este es un bloque existente en auditoría — no hay cambios, solo hallazgos de consistencia.

---

## 3. Componentes afectados

### 3.1 Uso de componentes shadcn/ui

| Componente                                                                | Uso en el bloque                       | Evaluación |
| ------------------------------------------------------------------------- | -------------------------------------- | ---------- |
| `Card`, `CardContent`, `CardHeader`, `CardTitle`                          | Vista de documento y ExportModal       | ✓ Correcto |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Tablas de subastas, servicios, enlaces | ✓ Correcto |
| `Button`                                                                  | Exportar, Enlazar Compras, Cancelar    | ✓ Correcto |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`  | ExportModal                            | ✓ Correcto |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`                  | Selección de software                  | ✓ Correcto |
| `Badge`                                                                   | Estado exportable / no exportable      | ⚠ Ver 4.1  |
| `Checkbox`                                                                | Selección de compras para vincular     | ✓ Correcto |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                          | Individual / Masivo                    | ✓ Correcto |

---

## 4. Hallazgos de consistencia

### 4.1 Badges con colores hardcodeados — incorrecto

```jsx
// ExportModal/index.js:517-523
<Badge variant="outline" className="bg-green-900 text-green-200 border-green-500 flex items-center gap-1">
    <Check className="h-3.5 w-3.5" />
    Exportable
</Badge>

<Badge variant="outline" className="bg-red-900 text-red-200 border-red-500 flex items-center gap-1">
    <X className="h-3.5 w-3.5" />
    No exportable
</Badge>
```

Los colores `bg-green-900`, `text-green-200`, `bg-red-900`, `text-red-200` son colores Tailwind arbitrarios, no tokens del design system. En el resto de la app, los badges de estado usan variantes de shadcn o clases CSS vars del theme.

Además, hay dos tokens de "semáforo" diferentes en la misma pantalla:

- `text-amber-500` para advertencias (sin Badge)
- `text-green-500` para OK (sin Badge)
- Badge verde/rojo para exportabilidad

Esta dualidad (texto de color + Badge) para estados similares es inconsistente.

**Recomendación**: usar `variant="default"` / `variant="destructive"` / `variant="secondary"` del Badge de shadcn, o definir variantes de estado en el design system.

### 4.2 Paleta blanco/negro forzada en AlbaranCofraWeb — intencional pero documentar

```jsx
// AlbaranCofraWeb/index.js:16
<div className="container mx-auto p-6 py-6 space-y-3 bg-white text-black rounded-md shadow-md">
```

```jsx
// AlbaranCofraWeb/index.js:20-21
<Card className='bg-white text-black border-neutral-200'>
```

La vista del documento usa `bg-white text-black` de forma explícita en todos los componentes. Esto rompe el soporte de modo oscuro (dark mode) si en algún momento la app lo implementa. La razón probable es que el documento imita la apariencia de un documento en papel — por lo que es intencional.

**Recomendación**: añadir un comentario en el componente explicando por qué se usa la paleta forzada (documento en papel). Sin documentación, un desarrollador futuro podría intentar "corregirlo" y romper la estética.

### 4.3 Espaciado inconsistente en tablas

```jsx
// AlbaranCofraWeb/index.js:77
<Table className="border-collapse [&_th]:p-2 [&_td]:p-2">
```

```jsx
// ExportModal/index.js:379
<Table>  // Sin clases de espaciado
```

Las tablas de la vista del documento tienen espaciado personalizado con selectores CSS (`[&_th]:p-2`). Las tablas del ExportModal no tienen esas clases. El resultado visual puede ser inconsistente en densidad entre las dos pantallas.

### 4.4 Texto inline sin componente `Label`

```jsx
// ExportModal/index.js:307-309
<label htmlFor="software" className="font-medium">
  Software
</label>
```

Se usa un `<label>` HTML nativo en lugar del componente `<Label>` de shadcn (`@/components/ui/label`). En el resto del sistema los labels de formulario usan el componente Label de shadcn.

**Severidad: Baja** — visual y funcionalmente equivalente, pero inconsistente.

### 4.5 Hardcoding de tamaño de DialogContent

```jsx
// ExportModal/index.js:296
<DialogContent size="4xl" className="max-h-[90vh] overflow-y-auto">
```

La prop `size="4xl"` no es estándar en el `DialogContent` de shadcn/ui. Puede ser una customización local del componente en `src/components/ui/dialog.tsx`. Si el componente shadcn se regenera o actualiza, esta prop puede perderse.

**Recomendación**: verificar que `DialogContent` en `src/components/ui/dialog.tsx` tiene implementada la prop `size`.

### 4.6 Imagen sin `alt` descriptivo

```jsx
// AlbaranCofraWeb/index.js:19
<img src="/images/logos/logo-santo-cristo.png" alt="Logo" className="mx-auto mb-4 h-32" />
```

El atributo `alt="Logo"` no es descriptivo. Debería ser `alt="Logo Cofradía de Pescadores Santo Cristo del Mar"` para accesibilidad.

---

## 5. Consistencia de riesgos

| Riesgo                             | Descripción                                                          | Severidad |
| ---------------------------------- | -------------------------------------------------------------------- | --------- |
| Badges con colores hardcodeados    | No usan tokens del design system — se rompen en futuros rebrands     | Media     |
| Paleta blanco/negro forzada        | Sin documentación de intención — riesgo de "corrección" involuntaria | Baja      |
| `label` nativo vs `<Label>` shadcn | Inconsistente con el resto del sistema                               | Baja      |
| `size="4xl"` en DialogContent      | Prop no estándar de shadcn — puede perderse en actualizaciones       | Baja      |
| Alt text de imagen no descriptivo  | Accesibilidad deficiente                                             | Baja      |

---

## 6. Comprobaciones manuales de UI

- [ ] Abrir la vista de un documento Cofra procesado — verificar que se renderiza en blanco/negro (aspecto de documento)
- [ ] Abrir el ExportModal — verificar que los badges "Exportable" / "No exportable" son visualmente claros
- [ ] Verificar que el DialogContent del modal es suficientemente ancho y scrollable en pantallas pequeñas
- [ ] Verificar en ambos modos (individual / masivo) que el Tabs component tiene el trigger seleccionado claramente visible
- [ ] Verificar accesibilidad: tabular por los checkboxes del ExportModal — deben ser seleccionables con teclado

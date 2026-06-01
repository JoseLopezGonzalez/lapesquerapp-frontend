# Guía de Implementación de Impresiones en el Frontend

## 📋 Índice

1. [Introducción](#introducción)
2. [Hook usePrintElement](#hook-useprintelement)
3. [Patrones Correctos de Implementación](#patrones-correctos-de-implementación)
4. [Patrones Incorrectos a Evitar](#patrones-incorrectos-a-evitar)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Troubleshooting](#troubleshooting)

---

## Introducción

Esta guía documenta cómo implementar correctamente funcionalidades de impresión en el frontend de la aplicación. El sistema utiliza un hook personalizado `usePrintElement` que crea un iframe oculto para imprimir contenido sin afectar la vista principal.

### ¿Por qué este sistema?

- ✅ No interfiere con otras impresiones simultáneas
- ✅ Permite control preciso del tamaño de página
- ✅ Mantiene los estilos CSS del documento
- ✅ Funciona de forma aislada y predecible

---

## Hook usePrintElement

### Ubicación

`/src/hooks/usePrintElement.js`

### Uso Básico

```javascript
import { usePrintElement } from '@/hooks/usePrintElement';

const { onPrint } = usePrintElement({
  id: 'print-area-id', // ID del elemento a imprimir (requerido)
  width: 110, // Ancho en mm (opcional, default: 100)
  height: 90, // Alto en mm (opcional, default: 150)
});

// Llamar para imprimir
onPrint();
```

### Parámetros

| Parámetro | Tipo   | Requerido | Default | Descripción                                               |
| --------- | ------ | --------- | ------- | --------------------------------------------------------- |
| `id`      | string | ✅ Sí     | -       | ID del elemento HTML que contiene el contenido a imprimir |
| `width`   | number | ❌ No     | 100     | Ancho de la página en milímetros                          |
| `height`  | number | ❌ No     | 150     | Alto de la página en milímetros                           |

### Retorno

```javascript
{
  onPrint: Function; // Función que ejecuta la impresión
}
```

### Funcionamiento Interno

1. Busca el elemento por ID en el DOM
2. Crea un iframe oculto
3. Copia todos los estilos CSS del documento actual
4. Añade estilos de impresión específicos con el tamaño de página
5. Copia el contenido del elemento al iframe
6. Ejecuta `window.print()` en el iframe
7. Limpia el iframe después de imprimir

---

## Patrones Correctos de Implementación

### ✅ Patrón 1: Impresión Simple (Una sola página)

**Ejemplo**: `PalletLabelDialog`

```javascript
import { usePrintElement } from '@/hooks/usePrintElement';
import { PALLET_LABEL_SIZE } from '@/configs/config';

export default function MyPrintDialog({ isOpen, onClose, data }) {
  const { onPrint } = usePrintElement({
    id: 'print-area-id',
    width: PALLET_LABEL_SIZE.width,
    height: PALLET_LABEL_SIZE.height,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Vista previa visible */}
        <div className="bg-orange-200 px-4">
          <div
            id="print-area-id" // ← Mismo ID que se usa en usePrintElement
            className="text-black"
            style={{
              width: PALLET_LABEL_SIZE.width,
              height: PALLET_LABEL_SIZE.height,
            }}
          >
            <MyContent data={data} />
          </div>
        </div>

        <Button onClick={onPrint}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Características clave:**

- El área de impresión (`id="print-area-id"`) está **visible** en la vista previa
- El mismo elemento se usa para vista previa e impresión
- El ID debe coincidir exactamente con el usado en `usePrintElement`

---

### ✅ Patrón 2: Impresión Múltiple (Varias páginas)

**Ejemplo**: `BoxLabelPrintDialog`, `AllPalletsLabelDialog`

```javascript
import { usePrintElement } from '@/hooks/usePrintElement';

export default function MultiplePrintDialog({ open, onClose, items = [] }) {
  const { onPrint } = usePrintElement({
    id: 'print-area-id',
    width: 110,
    height: 90,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {/* Vista previa - muestra solo el primero */}
        <div className="bg-orange-200 px-4">
          <div style={{ width: '110mm', height: '90mm' }}>
            {items[0] && <MyContent data={items[0]} />}
          </div>
        </div>

        {/* Área de impresión - oculta pero en el DOM */}
        <div id="print-area-id" className="hidden print:block">
          {items.map((item, index) => (
            <div key={index} className="page">
              <MyContent data={item} />
            </div>
          ))}
        </div>

        <Button onClick={onPrint}>
          <Printer className="h-4 w-4" />
          Imprimir ({items.length})
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Características clave:**

- El área de impresión usa `className="hidden print:block"` para estar oculta pero disponible
- Cada elemento tiene la clase `page` para separación de páginas
- La vista previa muestra solo el primer elemento
- El área de impresión contiene todos los elementos

---

### ✅ Patrón 3: Impresión de Documento Completo (A4)

**Ejemplo**: `ReceptionPrintDialog`

```javascript
import { usePrintElement } from '@/hooks/usePrintElement';

export default function DocumentPrintDialog({ isOpen, onClose, data }) {
  const { onPrint } = usePrintElement({
    id: 'document-print-content',
    width: 210, // A4 width
    height: 297, // A4 height
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Vista previa */}
        <div className="rounded-lg border bg-white p-6">
          <h1>Mi Documento</h1>
          {/* Contenido de vista previa */}
        </div>

        {/* Área de impresión - oculta */}
        <div id="document-print-content" className="hidden print:block">
          <div className="p-8" style={{ width: '210mm', minHeight: '297mm' }}>
            <h1>Mi Documento</h1>
            {/* Contenido completo para imprimir */}
          </div>
        </div>

        <Button onClick={onPrint}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Características clave:**

- Para documentos A4, usar `width: 210, height: 297`
- El área de impresión está oculta con `hidden print:block`
- Puede tener contenido diferente o adicional en el área de impresión

---

## Patrones Incorrectos a Evitar

### ❌ NO usar `window.print()` directamente con estilos que ocultan todo

```javascript
// ❌ INCORRECTO - Interfiere con otras impresiones
const handlePrint = () => {
  window.print();
};

// Con estilos CSS globales que ocultan todo excepto el contenido
<style jsx global>{`
  @media print {
    body * {
      visibility: hidden;
    }
    #my-content,
    #my-content * {
      visibility: visible;
    }
  }
`}</style>;
```

**Problemas:**

- Interfiere con otras impresiones simultáneas
- Puede causar que otras impresiones se muestren en blanco
- No permite control preciso del tamaño de página

---

### ❌ NO poner el área de impresión fuera del Dialog condicionalmente

```javascript
// ❌ INCORRECTO
return (
  <>
    <Dialog open={isOpen}>{/* contenido */}</Dialog>
    {isOpen && (
      <div id="print-area-id">
        {' '}
        {/* ← Puede no estar en el DOM cuando se necesita */}
        {/* contenido */}
      </div>
    )}
  </>
);
```

**Problema:** El elemento puede no estar en el DOM cuando `usePrintElement` intenta encontrarlo.

---

### ❌ NO usar `position: absolute` con `left: -9999px` para ocultar

```javascript
// ❌ INCORRECTO - Puede no renderizarse correctamente
<div id="print-area-id" style={{ position: 'absolute', left: '-9999px' }}>
  {/* contenido */}
</div>
```

**Problema:** Los elementos con `position: absolute` fuera de la vista pueden no renderizarse correctamente.

**Solución correcta:** Usar `className="hidden print:block"`

---

## Ejemplos Prácticos

### Ejemplo 1: Etiqueta Simple

```javascript
'use client';

import { usePrintElement } from '@/hooks/usePrintElement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const LABEL_SIZE = { width: 110, height: 90 };

export default function SimpleLabelDialog({ isOpen, onClose, labelData }) {
  const { onPrint } = usePrintElement({
    id: 'label-print-area',
    width: LABEL_SIZE.width,
    height: LABEL_SIZE.height,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Imprimir Etiqueta</DialogTitle>
        </DialogHeader>

        {/* Vista previa e impresión - mismo elemento */}
        <div className="bg-orange-200 px-4">
          <div
            id="label-print-area"
            className="text-black"
            style={{
              width: `${LABEL_SIZE.width}mm`,
              height: `${LABEL_SIZE.height}mm`,
            }}
          >
            <div className="p-4">
              <h2 className="text-2xl font-bold">{labelData.title}</h2>
              <p>{labelData.description}</p>
            </div>
          </div>
        </div>

        <Button onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Ejemplo 2: Múltiples Etiquetas

```javascript
'use client';

import { usePrintElement } from '@/hooks/usePrintElement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const LABEL_SIZE = { width: 110, height: 90 };

export default function MultipleLabelsDialog({ isOpen, onClose, labels = [] }) {
  const { onPrint } = usePrintElement({
    id: 'labels-print-area',
    width: LABEL_SIZE.width,
    height: LABEL_SIZE.height,
  });

  if (labels.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Imprimir {labels.length} Etiquetas</DialogTitle>
        </DialogHeader>

        {/* Vista previa - solo primera */}
        <div className="bg-orange-200 px-4">
          <div
            className="text-black"
            style={{
              width: `${LABEL_SIZE.width}mm`,
              height: `${LABEL_SIZE.height}mm`,
            }}
          >
            <LabelContent data={labels[0]} />
          </div>
        </div>

        {/* Área de impresión - todas las etiquetas */}
        <div id="labels-print-area" className="hidden print:block">
          {labels.map((label, index) => (
            <div key={index} className="page">
              <LabelContent data={label} />
            </div>
          ))}
        </div>

        <Button onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir ({labels.length})
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Ejemplo 3: Documento A4 Completo

```javascript
'use client';

import { usePrintElement } from '@/hooks/usePrintElement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function DocumentDialog({ isOpen, onClose, documentData }) {
  const { onPrint } = usePrintElement({
    id: 'document-print-area',
    width: 210, // A4
    height: 297, // A4
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Imprimir Documento</DialogTitle>
        </DialogHeader>

        {/* Vista previa */}
        <div className="max-h-[60vh] overflow-auto rounded-lg border bg-white p-6">
          <h1 className="mb-4 text-2xl font-bold">Mi Documento</h1>
          <div className="space-y-4">
            {/* Contenido de vista previa */}
            <p>{documentData.content}</p>
          </div>
        </div>

        {/* Área de impresión */}
        <div id="document-print-area" className="hidden print:block">
          <div className="p-8" style={{ width: '210mm', minHeight: '297mm' }}>
            <h1 className="mb-6 text-3xl font-bold">Mi Documento</h1>
            <div className="space-y-4">
              {/* Contenido completo para imprimir */}
              <p>{documentData.content}</p>
            </div>
          </div>
        </div>

        <Button onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Mejores Prácticas

### 1. ✅ Siempre usar `usePrintElement`

Nunca uses `window.print()` directamente. Siempre usa el hook `usePrintElement` para evitar conflictos.

### 2. ✅ Área de impresión dentro del Dialog

El área de impresión debe estar dentro del `DialogContent`, no fuera. Esto asegura que esté en el DOM cuando se necesita.

### 3. ✅ ID único y consistente

- Usa un ID único para cada área de impresión
- El ID debe coincidir exactamente entre `usePrintElement` y el elemento HTML
- Evita IDs genéricos como `print-area` si hay múltiples impresiones en la misma página

### 4. ✅ Ocultar con `hidden print:block`

Para áreas de impresión que no son la vista previa:

```javascript
<div id="print-area-id" className="hidden print:block">
  {/* contenido */}
</div>
```

**No uses:**

- `style={{ display: 'none' }}` - No se imprime
- `style={{ visibility: 'hidden' }}` - Puede causar problemas
- `style={{ position: 'absolute', left: '-9999px' }}` - Puede no renderizarse

### 5. ✅ Clase `page` para múltiples páginas

Para impresiones con múltiples páginas, usa la clase `page`:

```javascript
<div id="print-area-id" className="hidden print:block">
  {items.map((item, index) => (
    <div key={index} className="page">
      {/* contenido de cada página */}
    </div>
  ))}
</div>
```

La clase `page` tiene estilos predefinidos en `usePrintElement`:

- `page-break-after: always` - Salto de página después
- `page-break-inside: avoid` - Evita cortar contenido
- Tamaño fijo según width/height especificados

### 6. ✅ Tamaños estándar

Usa constantes para tamaños comunes:

```javascript
// En config.js
export const PALLET_LABEL_SIZE = {
  width: '110mm',
  height: '90mm',
};

// En el componente
const { onPrint } = usePrintElement({
  id: 'print-area-id',
  width: 110, // Convertir mm string a number
  height: 90,
});
```

### 7. ✅ Validar datos antes de imprimir

```javascript
const handlePrint = () => {
  if (!data || data.length === 0) {
    toast.error('No hay datos para imprimir');
    return;
  }
  onPrint();
};
```

### 8. ✅ Feedback al usuario

```javascript
const handlePrint = () => {
  toast.success(`Imprimiendo ${items.length} etiquetas...`);
  onPrint();
};
```

---

## Troubleshooting

### Problema: La impresión se muestra en blanco

**Causas posibles:**

1. **El elemento no está en el DOM**

   ```javascript
   // ❌ Incorrecto
   {
     isOpen && <div id="print-area-id">...</div>;
   }

   // ✅ Correcto
   <div id="print-area-id" className="hidden print:block">
     ...
   </div>;
   ```

2. **El ID no coincide**

   ```javascript
   // ❌ Incorrecto
   usePrintElement({ id: 'print-area' })
   <div id="print-area-id">...</div>

   // ✅ Correcto
   usePrintElement({ id: 'print-area-id' })
   <div id="print-area-id">...</div>
   ```

3. **El elemento está oculto incorrectamente**

   ```javascript
   // ❌ Incorrecto
   <div id="print-area-id" style={{ display: 'none' }}>...</div>

   // ✅ Correcto
   <div id="print-area-id" className="hidden print:block">...</div>
   ```

4. **Datos vacíos o undefined**
   - Verifica que los datos estén disponibles antes de renderizar
   - Añade validaciones y mensajes de error

---

### Problema: La impresión interfiere con otras impresiones

**Causa:** Usar `window.print()` directamente con estilos globales.

**Solución:** Siempre usar `usePrintElement`, que crea un iframe aislado.

---

### Problema: Las páginas no se separan correctamente

**Causa:** No usar la clase `page` o tener contenido que se corta.

**Solución:**

```javascript
<div id="print-area-id" className="hidden print:block">
  {items.map((item, index) => (
    <div key={index} className="page">
      {/* Cada página debe tener el tamaño exacto */}
      <div
        style={{
          width: `${width}mm`,
          height: `${height}mm`,
        }}
      >
        {/* contenido */}
      </div>
    </div>
  ))}
</div>
```

---

### Problema: Los estilos no se aplican en la impresión

**Causa:** Estilos que dependen de clases de Tailwind que no se copian.

**Solución:**

- Asegúrate de que los estilos estén en el elemento directamente o
- Usa estilos inline para elementos críticos

---

### Problema: El hook no encuentra el elemento

**Debug:**

```javascript
const handlePrint = () => {
  const element = document.getElementById('print-area-id');
  if (!element) {
    console.error('Elemento no encontrado');
    toast.error('Error: No se puede encontrar el área de impresión');
    return;
  }
  console.log('Elemento encontrado:', element);
  onPrint();
};
```

**Verificaciones:**

1. El Dialog está abierto (`isOpen={true}`)
2. El elemento está renderizado (no condicional con `&&`)
3. El ID es exactamente el mismo (case-sensitive)

---

## Checklist de Implementación

Al implementar una nueva funcionalidad de impresión, verifica:

- [ ] Importar `usePrintElement` desde `@/hooks/usePrintElement`
- [ ] Definir un ID único para el área de impresión
- [ ] Usar el mismo ID en `usePrintElement` y en el elemento HTML
- [ ] El área de impresión está dentro del `DialogContent`
- [ ] Para múltiples páginas, usar clase `page` en cada elemento
- [ ] Para ocultar el área de impresión, usar `className="hidden print:block"`
- [ ] Especificar `width` y `height` correctos (en mm como números)
- [ ] Validar datos antes de imprimir
- [ ] Añadir feedback al usuario (toast, loading, etc.)
- [ ] Probar con múltiples impresiones simultáneas
- [ ] Verificar que no interfiere con otras impresiones

---

## Referencias

### Componentes de Ejemplo

- **Impresión simple**: `/src/components/Admin/Pallets/PalletLabelDialog/index.js`
- **Impresión múltiple**: `/src/components/Admin/Labels/BoxLabelPrintDialog/index.js`
- **Impresión múltiple pallets**: `/src/components/Admin/RawMaterialReceptions/AllPalletsLabelDialog/index.js`
- **Impresión documento A4**: `/src/components/Admin/RawMaterialReceptions/ReceptionPrintDialog/index.js`

### Hook

- `/src/hooks/usePrintElement.js`

### Configuración

- `/src/configs/config.js` - Tamaños de etiquetas estándar

---

## Notas Finales

- **Siempre** usa `usePrintElement` para nuevas impresiones
- **Nunca** uses `window.print()` directamente con estilos globales
- **Siempre** prueba que no interfiere con otras impresiones
- **Documenta** cualquier caso especial o requisito no estándar

Si encuentras problemas o necesitas implementar un caso especial, consulta los componentes de ejemplo mencionados arriba.

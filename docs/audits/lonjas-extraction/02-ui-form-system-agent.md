# Auditoría: UI/Form System Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** UI/Form System Agent
**Scope:** Formularios, validación, estado de campos, submit, errores, React Hook Form, Zod

---

## 1. Archivos inspeccionados

| Archivo | Relevancia |
|---|---|
| `src/components/Admin/MarketDataExtractor/AlbaranCofraWeb/ExportModal/index.js` | Modal con estado gestionado con `useState` |
| `src/components/Admin/MarketDataExtractor/shared/DocumentProcessor.js` | Pipeline de procesamiento — no es formulario |
| `src/components/Admin/MarketDataExtractor/index.js` | Entry point — no tiene campos de formulario |

---

## 2. Contexto del sistema

El bloque MarketDataExtractor **no es un formulario tradicional**. Su flujo principal es:

1. El usuario selecciona un PDF (file input)
2. El sistema lo envía a Azure Document AI (proceso async)
3. Se muestra el resultado extraído
4. El usuario puede exportar o vincular las compras

No hay formularios de creación/edición de entidades en este bloque. La única interfaz de "configuración" es el `Select` de software de destino en el `ExportModal`.

---

## 3. Lista de campos de interacción

### ExportModal (AlbaranCofraWeb)

| Campo | Tipo componente | Gestión estado | Validación |
|---|---|---|---|
| Software destino | `<Select>` shadcn | `useState(software)` | Ninguna |
| Checkboxes de selección | `<Checkbox>` shadcn | `useState(selectedLinks[])` | Ninguna |

### Flujo de procesamiento (IndividualMode / MassiveMode)

| Campo | Tipo componente | Gestión estado | Validación |
|---|---|---|---|
| File upload | Input nativo (inferido) | `useState` o handler | Ninguna explícita |
| Tipo de documento | Select o similar | `useState` | Ninguna |

---

## 4. Evaluación de validación

### 4.1 Select de software

El campo `Select` de software no tiene validación. Si el usuario selecciona "Facilcom" u "Otros", el botón "Exportar a A3ERP" ejecuta `handleOnClickExport()` que tiene ramas vacías:

```javascript
// ExportModal/index.js:148-153
} else if (software === "Facilcom") {
    // generateExcelForFacilcom();   ← comentado, sin implementar
} else {
    // generateExcelForOtros();      ← comentado, sin implementar
}
```

El botón en el footer dice siempre "Exportar a A3ERP" independientemente del software seleccionado. Esto produce confusión: el usuario puede seleccionar "Facilcom" y pulsar el botón sin recibir ningún error ni acción visible.

**Severidad: Media** — el usuario no recibe feedback cuando selecciona un software no implementado.

### 4.2 Checkboxes de enlace de compras

Los checkboxes usan `selectedLinks` (array de índices). La gestión es correcta: se deshabilitan cuando hay error o validación en curso. Sin embargo:

- `handleToggleAll` filtra condicionalmente en base a `validation?.valid && validation?.canUpdate` — lógica correcta.
- El estado `selectedLinks` se inicializa dentro de un `useEffect` con dependencia `[groupedLinkedSummary.length]` — esto es frágil: si el array cambia de contenido sin cambiar de longitud, el efecto no se re-ejecuta y las selecciones iniciales no se actualizan.

**Severidad: Baja** — en el flujo actual esto probablemente no cause problemas porque `groupedLinkedSummary` se calcula una sola vez por documento.

### 4.3 Estado del botón de submit

El botón "Enlazar Compras" tiene disabled correcto:
```javascript
disabled={selectedLinks.length === 0 || isValidating}
```

El botón "Exportar a A3ERP" **no tiene disabled** durante la generación del Excel. La función `generateExcelForA3erp` hace imports dinámicos y trabajo asíncrono (aunque no hay `isLoading` state), por lo que el usuario podría hacer doble clic y generar dos descargas.

**Severidad: Baja** — poco probable que cause problemas reales dado el tiempo de ejecución.

### 4.4 Ausencia de React Hook Form y Zod

**Justificado**: el bloque no tiene formularios de creación/edición de entidades. El único "formulario" es la selección de software de exportación, que con un `useState` simple es suficiente. No se recomienda añadir React Hook Form ni Zod aquí.

---

## 5. Reglas de validación

No hay reglas de validación Zod ni de RHF en este bloque. El sistema de validación está en los **validators de estructura** (`src/validators/lonjas/`), que validan los datos extraídos de Azure, no los inputs de usuario.

La única "validación de usuario" es:
```javascript
// ExportModal/index.js:249-254
if (comprasSeleccionadas.length === 0) {
    notify.error({
      title: 'Sin compras seleccionadas',
      description: 'Seleccione al menos una compra para vincular.',
    });
    return;
}
```
Correcto — usa `notify.error` con título y descripción, consistente con el sistema de notificaciones.

---

## 6. Payload shape (enlace de compras)

```javascript
// comprasSeleccionadas — array de objetos con:
{
  supplierId: number | null,
  date: string,                    // formato variable — ver hallazgo 7.1
  declaredTotalNetWeight: number,
  declaredTotalAmount: number,
  barcoNombre: string,
  error: boolean,
  isGrouped?: boolean
}
```

---

## 7. Hallazgos

| # | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| 7.1 | **Alta** | El campo `date` en `linkedSummary` se construye como `fecha` (string del documento, formato no normalizado). Luego en `getValidationStatus()` se hace `.split('/').reverse().join('-')` para convertirlo — lógica de formato de fecha embebida en la función de validación. Si el formato de `fecha` cambia (el OCR puede extraer formatos distintos), la key de validación falla silenciosamente. | `ExportModal/index.js:209` |
| 7.2 | **Media** | El botón "Exportar a A3ERP" siempre dice "A3ERP" aunque el Select permita elegir Facilcom u Otros. No hay feedback para opciones no implementadas. | `ExportModal/index.js:617-621` |
| 7.3 | **Media** | `generateExcelForA3erp` no tiene estado `isLoading` — el botón no se deshabilita durante la generación. Riesgo de doble clic. | `ExportModal/index.js:50-143` |
| 7.4 | **Baja** | `useEffect` con dependencia `[groupedLinkedSummary.length]` puede no re-ejecutarse si el array cambia de contenido sin cambiar de longitud. | `ExportModal/index.js:178-205` |
| 7.5 | **Info** | Ausencia de React Hook Form / Zod es correcta para este tipo de bloque. | — |

---

## 8. Checklist de test manual

- [ ] Seleccionar "Facilcom" en el Select y pulsar "Exportar a A3ERP" — verificar que hay feedback (hoy no lo hay)
- [ ] Hacer doble clic rápido en "Exportar a A3ERP" — verificar que no genera dos descargas
- [ ] Verificar que el botón "Enlazar Compras" se deshabilita correctamente durante validación
- [ ] Verificar que el mensaje "Sin compras seleccionadas" aparece con formato correcto (título + descripción)
- [ ] Verificar que los checkboxes de selección masiva funcionan con todas las variantes (todas válidas, algunas inválidas, ninguna)

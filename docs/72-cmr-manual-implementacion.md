# CMR Manual — Guía de implementación

**Estado**: Guía de implementación  
**Última actualización**: 2026-02-18

---

## 1. Contexto y reglas

### 1.1 Objetivo

Implementar un módulo **CMR Manual** que permita:

- Rellenar **manualmente** todos los campos del CMR mediante inputs (sin datos de BD, sin autocompletar, sin integraciones).
- **Previsualizar** el documento en pantalla a tamaño A4 1:1.
- **Imprimir** las **4 copias** del CMR (mismo layout, variación de encabezado y color por copia) en páginas consecutivas con saltos de página correctos.

La plantilla debe generarse en **HTML/CSS** desde cero (no canvas, no pdf-lib, no imágenes como base), replicando el diseño de un CMR estándar con cajas numeradas 1–24.

### 1.2 Reglas inmutables

- **NO** usar datos existentes en BD.
- **NO** implementar backend ni llamadas API para este flujo.
- **NO** añadir funcionalidades extra (solo lo descrito).
- **Prioridad**: layout A4 real, impresión correcta y estructura de código limpia.
- **Un solo layout** reutilizable, con variaciones por tipo de copia (`copyType`).

---

## 2. Ubicación en el proyecto

### 2.1 Rutas recomendadas

| Elemento | Ruta |
|----------|------|
| Página Next.js | `src/app/admin/cmr-manual/page.js` (o `page.jsx`) |
| Componentes y estilos | `src/components/CmrManual/` |

Alternativa: si se prefiere un módulo autocontenido, usar `src/modules/cmr/` y que la página en `src/app/admin/cmr-manual/` importe desde ahí.

### 2.2 Referencias existentes en el proyecto

- **Impresión**: [src/hooks/usePrintElement.js](src/hooks/usePrintElement.js) — hook que clona un elemento por `id` en un iframe, aplica estilos de impresión (`@page`, opcionalmente `freeSize`) y llama a `window.print()`. Uso: `usePrintElement({ id: 'cmr-print-area', freeSize: true })`.
- **Patrón “solo imprimir este bloque”**: [src/components/Comercial/Autoventa/Step8PrintTicket/index.js](src/components/Comercial/Autoventa/Step8PrintTicket/index.js) y [src/components/Comercial/Autoventa/AutoventaTicketPrint/index.js](src/components/Comercial/Autoventa/AutoventaTicketPrint/index.js) — el contenido imprimible está dentro de un `div` con `id="autoventa-ticket-print"`; el botón Imprimir usa `onPrint` del hook.
- **Navegación admin**: [src/configs/navgationConfig.js](src/configs/navgationConfig.js) — `navigationConfig` y `navigationManagerConfig` con `href`, `allowedRoles` e iconos.
- **App Router**: las páginas admin viven bajo `src/app/admin/` con `page.js` o `page.jsx`.

---

## 3. Estructura de archivos sugerida

Crear la carpeta `src/components/CmrManual/` con:

| Archivo | Responsabilidad |
|---------|-----------------|
| `cmr.types.ts` (o `cmr.types.js` con JSDoc) | Tipo `CmrData` y campos correspondientes a las casillas 1–24. |
| `cmr.copy-config.ts` (o `cmr.copy-config.js`) | Configuración de las 4 copias: `copyType`, encabezado, color. |
| `CmrForm.jsx` | Formulario manual: inputs organizados por secciones/casillas. |
| `CmrPreview.jsx` | Contenedor que renderiza las 4 páginas A4 (4× `CmrCopy`). |
| `CmrCopy.jsx` | **Una** página A4 reutilizable; recibe `copyType` y `data`. |
| `cmr-print.css` (o `cmr.css`) | Estilos A4, variables `--cmr-color`, `@media print`, `@page`, `page-break-after`. |

La página `src/app/admin/cmr-manual/page.js` importa el layout editor (formulario + preview + botón Imprimir) y opcionalmente un `loading.js` si se usa Suspense.

---

## 4. Modelo de datos CmrData

Definir un tipo (TypeScript o JSDoc) con los campos del CMR. Tipos simples: `string` y `number`. Sin firma digital; las casillas 22–24 son solo cajas/espacios para texto o “Firma” en papel.

| Casilla | Campo sugerido | Tipo | Descripción |
|---------|----------------|------|-------------|
| 1 | `sender` | string | Remitente |
| 2 | `consignee` | string | Destinatario / consignatario |
| 3 | `placeOfDelivery` | string | Lugar de entrega |
| 4 | `placeAndDateOfReceiptOrLoad` | string | Lugar y fecha de recepción/carga |
| 5 | `attachedDocuments` | string | Documentos anexos |
| 6 | `marksAndNumbers` | string | Marcas y números |
| 7 | `numberOfPackages` | number | Nº de bultos |
| 8 | `methodOfPacking` | string | Método de embalaje |
| 9 | `natureOfGoods` | string | Naturaleza de la mercancía |
| 10 | (reservado) | — | Según CMR estándar |
| 11 | `grossWeight` | number | Peso bruto (kg) |
| 12 | `volume` | string | Volumen |
| 13 | `senderInstructions` | string | Instrucciones del remitente |
| 14 | `methodOfPayment` | string | Forma de pago |
| 15 | (reservado) | — | Según CMR estándar |
| 16 | `carrier` | string | Porteador |
| 17 | `successiveCarriers` | string | Porteadores sucesivos |
| 18 | `reservationsOrObservations` | string | Reservas y observaciones |
| 19 | `specialAgreements` | string | Estipulaciones particulares |
| 20 | `payableBy` | string o tabla | “A pagar por” (puede ser tabla simple) |
| 21 | `placeAndDate` | string | Lugar y fecha |
| 22 | `senderSignature` | string | Espacio/caja remitente (texto opcional) |
| 23 | `carrierSignature` | string | Espacio/caja transportista |
| 24 | `consigneeSignature` | string | Espacio/caja consignatario |

Valores por defecto: strings vacíos `''`, números `0` o `undefined` según convenga al formulario y al preview.

---

## 5. Configuración de las 4 copias

Las 4 páginas usan el **mismo layout**; solo cambian el encabezado superior y el color de bordes/labels.

| copyType | Encabezado | Color (ejemplo CSS) |
|----------|------------|----------------------|
| `sender` | "1 Ejemplar para el remitente / Copy for sender" | Rojo (p. ej. `#b91c1c`) |
| `consignee` | "2 Ejemplar para el consignatario / Copy for consignee" | Azul (p. ej. `#1d4ed8`) |
| `carrier` | "3 Ejemplar para el porteador / Copy for carrier" | Verde (p. ej. `#15803d`) |
| `extra` | "4" (sin “Ejemplar para…”) | Negro (p. ej. `#171717`) |

En cada `CmrCopy` se inyecta el color mediante variable CSS:

```jsx
style={{ "--cmr-color": copyConfig.color } }
```

Bordes y títulos/labels del CMR usan `var(--cmr-color)` en el CSS.

---

## 6. UI: layout editor

- **Izquierda**: formulario (`CmrForm`) con inputs organizados por secciones (p. ej. agrupando por bloques de casillas 1–4, 5–9, etc.).
- **Derecha**: área de **preview** con las 4 páginas A4 apiladas en scroll vertical (cada una en un contenedor `.cmr-page`).
- **Botón “Imprimir”**: debe imprimir **solo** el contenido del preview, no el formulario. Patrón:
  - Contenedor del preview con `id="cmr-print-area"`.
  - `usePrintElement({ id: 'cmr-print-area', freeSize: true })` y botón que llame a `onPrint()`.
- **Impresión**: en `@media print`, ocultar el resto de la página (formulario, cabecera, etc.). El hook `usePrintElement` clona solo el `#cmr-print-area` en un iframe, por lo que en la ventana de impresión solo debe verse ese contenido; asegurarse de que los estilos de impresión (incl. `cmr-print.css`) se inyecten en el iframe (el hook ya clona `style` y `link[rel='stylesheet']`).

---

## 7. CSS y maquetación

### 7.1 Tamaño A4

- Página CMR: `width: 210mm; height: 297mm;`.
- Usar `mm` en medidas siempre que sea posible para fidelidad al A4.

### 7.2 Impresión

- En el CSS cargado por el área imprimible (p. ej. `cmr-print.css`):
  - `@page { size: A4; margin: 0; }`
  - `@media print { body { margin: 0; padding: 0; background: white; } }`
- Saltos de página:
  - Cada `.cmr-page` (o equivalente): `page-break-after: always;`
  - La última página: `page-break-after: auto;` (o clase específica `.cmr-page:last-child { page-break-after: auto; }`).

### 7.3 Color por copia

- Cada instancia de `CmrCopy` recibe el color de su copia y lo define como variable:
  - `style={{ "--cmr-color": copyConfig.color } }`
- En `cmr-print.css`, bordes y labels usan `var(--cmr-color)`.

---

## 8. Plantilla CMR (CmrCopy)

- **Una sola** plantilla reutilizable: mismo HTML/CSS para las 24 cajas; solo cambian el encabezado y `--cmr-color` según `copyType`.
- Maquetación con **CSS Grid** o layout estructurado (flex/grid) que refleje la disposición estándar del CMR (cajas numeradas 1–24).
- Requisitos:
  - Encabezado superior con el texto correspondiente a la copia.
  - Cajas con bordes y numeración visible (1–24).
  - Legibilidad al imprimir; no es necesario ser pixel-perfect respecto al PDF de referencia, pero sí correcto en estructura y tamaños relativos.

No usar canvas ni pdf-lib; todo debe ser HTML/CSS.

---

## 9. Integración con la navegación

- Añadir una entrada en **navigationManagerConfig** (o en **navigationConfig** si aplica al menú que use la app) en [src/configs/navgationConfig.js](src/configs/navgationConfig.js):
  - `name`: p. ej. "CMR Manual"
  - `href`: `'/admin/cmr-manual'`
  - `allowedRoles`: p. ej. `["administrador", "direccion", "tecnico"]`
  - `icon`: p. ej. `FileText` (Lucide) o similar.
- Si no existe un menú donde encaje, al menos dejar la ruta accesible directamente por URL.

---

## 10. Orden de implementación (metodología)

Seguir este orden para no dejar la implementación a medias:

1. **Fase 1 — Estructura y layout base de CmrCopy**  
   Crear el componente `CmrCopy` con encabezado parametrizable y la rejilla de cajas 1–24 (con bordes y números). Aplicar `--cmr-color` a bordes y títulos. Incluir o importar `cmr-print.css` con tamaños A4 y variables.

2. **Fase 2 — CmrForm y enlace estado → preview**  
   Crear `CmrForm` con todos los campos de `CmrData` organizados por secciones. Mantener el estado en el padre (página o un wrapper) y pasar `data` al área de preview para que las 4 copias muestren los mismos datos.

3. **Fase 3 — CmrPreview con 4 copias**  
   Implementar `CmrPreview`: recibe `data` y renderiza 4 veces `CmrCopy` con `copyType` respectivamente `sender`, `consignee`, `carrier`, `extra`. Cada una con su encabezado y color según `cmr.copy-config`.

4. **Fase 4 — CSS de impresión y page breaks**  
   Afinar `cmr-print.css`: `@page`, `@media print`, `page-break-after` en cada página, y asegurarse de que al usar `usePrintElement` los estilos se apliquen en el iframe (el hook clona los estilos del documento). Comprobar que la impresión muestre 4 páginas A4 sin cortar contenido.

5. **Fase 5 — Página Next.js, ruta y menú**  
   Crear `src/app/admin/cmr-manual/page.js` (o `page.jsx`) con el layout editor (formulario a la izquierda, preview a la derecha, botón Imprimir). Añadir la entrada en la configuración de navegación y, si existe, enlace en el menú admin.

---

## 11. Notas finales

- **Sin dependencias extra**: usar `window.print()` vía el hook existente `usePrintElement` y CSS; no es obligatorio usar `react-to-print` a menos que se prefiera.
- **Comentarios**: añadir comentarios breves donde ayude (p. ej. en la config de copias o en el layout de cajas), sin exceso.
- **Diferenciación**: este módulo es para **CMR manual** (usuario rellena todo a mano). El documento **order-cmr** que se genera desde pedidos (API/backend) sigue siendo independiente y no se sustituye por esta implementación.

---

## Referencias rápidas

- [usePrintElement.js](src/hooks/usePrintElement.js) — impresión por id y `freeSize`.
- [AutoventaTicketPrint](src/components/Comercial/Autoventa/AutoventaTicketPrint/index.js) — patrón de área imprimible con id.
- [navgationConfig.js](src/configs/navgationConfig.js) — navegación admin y roles.

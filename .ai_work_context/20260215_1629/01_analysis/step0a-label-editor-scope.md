# STEP 0a — Bloque 13: Editor de etiquetas — Alcance y entidades

**Fecha**: 2026-02-15  
**Bloque**: Editor de etiquetas (`/admin/label-editor`)

---

## 1. Entidades del bloque

Editor visual WYSIWYG para diseñar formatos de etiquetas (canvas, elementos: texto, campos, códigos de barras, QR, imágenes, rich text). Persistencia en API v2, export/import JSON, impresión.

| Entidad | Descripción | Rutas / ubicación |
|--------|-------------|-------------------|
| **Página Label Editor** | Página admin que monta el editor | `src/app/admin/label-editor/page.js` |
| **LabelEditor** | Componente principal del editor (canvas, toolbar, paneles) | `src/components/Admin/LabelEditor/index.js` |
| **LabelSelectorSheet** | Sheet para elegir etiqueta existente / crear nueva | `src/components/Admin/LabelEditor/LabelSelectorSheet.jsx` |
| **LabelEditorPreview** | Vista previa del diseño en el editor | `src/components/Admin/LabelEditor/LabelEditorPreview/index.js` |
| **LabelRender** | Renderizado del formato (usado por editor y por impresión de cajas) | `src/components/Admin/LabelEditor/LabelRender/index.js` |
| **LabelElement** | Render de un elemento (texto, barcode, QR, imagen, rich paragraph, etc.) | `src/components/Admin/LabelEditor/LabelRender/LabelElement/index.js` |
| **Paneles de configuración** | QR, Barcode, RichParagraph | `QRConfigPanel.jsx`, `BarcodeConfigPanel.jsx`, `RichParagraphConfigPanel.jsx` |
| **Otros UI del editor** | Diálogos y preview secundario | `FieldExamplesDialog.jsx`, `LabelPreview.jsx`, `LabelRender/LabelElement/RichParagraph.jsx`, `SanitaryRegister.jsx` |
| **useLabelEditor** | Hook con toda la lógica del editor (estado, canvas, API, validación) | `src/hooks/useLabelEditor.js` |
| **useLabel** | Hook de soporte (fechas, campos); usado por editor y por BoxLabelPrintDialog | `src/hooks/useLabel.js` |
| **labelService** | API: getLabel, createLabel, updateLabel, getLabels, deleteLabel, duplicateLabel, getLabelsOptions | `src/services/labelService.js` |
| **labelServiceHelpers** | Helpers de respuesta del servicio | `src/services/labelServiceHelpers.js` |

---

## 2. Artefactos por tipo

| Tipo | Artefactos |
|------|------------|
| **Páginas** | `app/admin/label-editor/page.js` |
| **Componentes** | `LabelEditor/index.js`, `LabelSelectorSheet.jsx`, `LabelEditorPreview/`, `LabelRender/`, `LabelRender/LabelElement/`, `QRConfigPanel.jsx`, `BarcodeConfigPanel.jsx`, `RichParagraphConfigPanel.jsx`, `FieldExamplesDialog.jsx`, `LabelPreview.jsx` |
| **Hooks** | `useLabelEditor.js`, `useLabel.js` |
| **Servicios** | `labelService.js`, `labelServiceHelpers.js` |
| **Estado** | Sin contexto específico; estado en `useLabelEditor` (useState local) |
| **Tests** | **Ninguno** (no existe `*label*test*` ni tests bajo `LabelEditor/`) |
| **Documentación** | `docs/analisis-edicion-etiquetas.md`, `docs/04-COMPONENTES-ADMIN.md` (§8 LabelEditor), `docs/02-ESTRUCTURA-PROYECTO.md` |

---

## 3. Dependencias externas al bloque

- **Labels (imprimir etiquetas de cajas)**: `src/components/Admin/Labels/BoxLabelPrintDialog` usa `useLabel` y **LabelRender**. Cualquier cambio en la interfaz de `LabelRender` o en `useLabel` puede afectar a ese flujo; no se refactoriza BoxLabelPrintDialog en este bloque, pero hay que **preservar contratos**.
- **Navegación**: entrada en `navgationConfig.js` → "Editor de Etiquetas" → `/admin/label-editor`.
- **Auth**: página bajo `/admin`, usa sesión (token en `labelService` vía `useSession`).

---

## 4. Métricas de tamaño (referencia auditoría)

| Artefacto | Líneas | Nota |
|-----------|--------|------|
| `LabelEditor/index.js` | **1903** | P0: componente >> 200 líneas |
| `useLabelEditor.js` | **1132** | P0: hook >> 200 líneas |
| `useLabel.js` | 438 | P1: > 150 líneas |
| `labelService.js` | 136 | Aceptable |

---

## 5. Resumen para confirmación

**Bloque 13 — Editor de etiquetas** incluye:

- **Entidades**: Página label-editor, LabelEditor, LabelSelectorSheet, LabelEditorPreview, LabelRender, LabelElement (+ RichParagraph, SanitaryRegister), paneles QR/Barcode/RichParagraph, FieldExamplesDialog, LabelPreview, useLabelEditor, useLabel, labelService, labelServiceHelpers.
- **Artefactos**: 1 página, ~12 componentes (o subcarpetas), 2 hooks, 2 archivos de servicio; 0 tests actuales.
- **Externo**: BoxLabelPrintDialog (Labels) consume LabelRender y useLabel; no se incluye en el bloque pero los contratos deben mantenerse.

¿Confirmas este alcance o quieres añadir/quitar algo antes de seguir con STEP 0 (comportamiento UI) y STEP 1 (análisis)?

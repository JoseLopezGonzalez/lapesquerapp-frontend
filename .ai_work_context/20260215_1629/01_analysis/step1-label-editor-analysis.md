# STEP 1 — Análisis: Bloque 13 Editor de etiquetas

**Fecha**: 2026-02-15

---

## 1. Qué hace el módulo

- Editor visual WYSIWYG de formatos de etiquetas en `/admin/label-editor`.
- Canvas con elementos (texto, campos, QR, códigos de barras, imágenes, rich text, etc.), arrastrar/redimensionar/rotar, zoom, rotación de canvas.
- Persistencia en API v2 (crear, actualizar, eliminar, duplicar, listar).
- Import/export JSON, impresión (usePrintElement), valores de ejemplo para campos.

---

## 2. Estado por entidad / artefacto

| Entidad | Estado | Problemas / oportunidades |
|---------|--------|---------------------------|
| **LabelEditor/index.js** (1903 L) | P0 crítico | Componente >> 200 L. Mezcla toolbar, canvas, lista, panel propiedades, diálogos. Extraer subcomponentes. |
| **useLabelEditor.js** (1132 L) | P0 crítico | Hook >> 200 L. Estado, canvas, persistencia, elementos, validación, todo en uno. Extraer hooks o módulos. |
| **labelService.js** (136 L) | Aceptable | Sin tipos; fetch manual (no React Query). P2: tipos; P1: React Query en siguiente fase. |
| **useLabel.js** (438 L) | P1 | > 150 L; compartido con BoxLabelPrintDialog. Reducir cuando se toque. |
| **LabelSelectorSheet, LabelEditorPreview, LabelRender, paneles** | Aceptables | Algunos .jsx; duplicación en paneles (analisis-edicion-etiquetas). P2: useFieldEditor común. |
| **Tests** | P0 | Cero tests. Servicios y flujos críticos deben tener tests para 9/10. |

---

## 3. Rating antes: 3/10

**Justificación**: Componentes y hook muy por encima del límite (1903 y 1132 líneas), sin TypeScript, sin React Query, sin tests, y auditoría global cita dangerouslySetInnerHTML (RichParagraph) y deuda estructural. Fortalezas: formularios con zod en otros módulos, shadcn/ui, API centralizada; en este bloque la lógica está concentrada en pocos archivos gigantes.

---

## 4. Patrones Next.js/React

- **Server/Client**: Página delega en cliente (LabelEditor "use client"). Aceptable para editor interactivo.
- **Data fetching**: Manual en useLabelEditor (createLabel, updateLabel, getLabels vía LabelSelectorSheet). Sin caché ni React Query. P1.
- **Custom hooks**: useLabelEditor hace demasiado. Extraer hooks más pequeños. P0.
- **Formularios**: Validación en handleSave (nombre, claves duplicadas, elementos). No hay Zod en este flujo específico; validación ad hoc. P2.
- **Estado**: Todo en useLabelEditor (useState). Sin TenantContext explícito; token desde useSession. Aceptable para alcance actual.
- **API layer**: labelService correcto; usado desde hook. P2 tipos.

---

## 5. TypeScript, seguridad, accesibilidad

- **TypeScript**: Todo .js/.jsx. P0/P1 migración progresiva (nuevos archivos .ts/.tsx).
- **Seguridad**: RichParagraph con dangerouslySetInnerHTML (auditoría). P2 sanitización o contenido controlado.
- **Accesibilidad**: Teclado (flechas, Delete), algo de ARIA. P2 revisión.

---

## 6. Priorización (Gap to 9/10)

| Prioridad | Acción |
|-----------|--------|
| **P0** | Dividir LabelEditor en subcomponentes (Toolbar, Canvas+List, SidePanel) hasta < 200 L por archivo. |
| **P0** | Dividir useLabelEditor en hooks/módulos (canvas, persistencia, elementos) hasta tamaño manejable. |
| **P0** | Añadir tests (labelService, flujos críticos useLabelEditor). |
| **P1** | Tipar servicios y respuestas (labelService.ts o tipos en .d.ts); nuevos componentes en .tsx. |
| **P1** | React Query para listado/carga de etiquetas (getLabels, getLabel) donde aplique. |
| **P2** | Hook useFieldEditor para paneles QR/Barcode/RichParagraph; sanitización RichParagraph. |
| **P2** | Revisión a11y y documentación. |

---

## 7. Riesgos

- **Regresión**: Contratos de LabelRender y useLabel usados por BoxLabelPrintDialog; no cambiar firmas sin compatibilidad.
- **Alcance**: Llevar a 9/10 puede requerir varios sub-bloques (estructura → tipos → React Query → tests).

---

## 8. Cobertura de alcance (STEP 0a)

Todas las entidades del scope están contempladas: página, LabelEditor y sus hijos, useLabelEditor, useLabel, labelService. BoxLabelPrintDialog queda fuera pero se preservan contratos.

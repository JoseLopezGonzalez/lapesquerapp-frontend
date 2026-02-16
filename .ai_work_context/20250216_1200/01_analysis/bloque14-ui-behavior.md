# Bloque 14: Extracción datos lonja — STEP 0: Documentación comportamiento UI actual

**Fecha**: 2025-02-16  
**Estado**: Completado

---

## UI States

### IndividualMode
| Estado | Descripción | Transición |
|--------|-------------|------------|
| Inicial | Sin archivo, sin tipo, panel vacío | Usuario sube PDF → tiene archivo |
| Con archivo | PdfUpload muestra archivo, Select disponible | Usuario elige tipo documento |
| Procesando | SparklesLoader visible, botón deshabilitado | processDocument en curso |
| Éxito | Vista previa del documento procesado (AlbaranCofraWeb / ListadoComprasAsoc / ListadoComprasLonjaDeIsla) | processDocument OK |
| Error | Toast con mensaje (validación, parsing, Azure) | processDocument falla |
| Vacío | EmptyState "Procese un documento" | Sin processedDocuments |

### MassiveMode
| Estado | Descripción |
|--------|-------------|
| Sin documentos | EmptyState "No hay documentos pendientes" |
| Pendientes | Lista de PDFs con Select tipo + botón "Procesar Todos" |
| Procesando | Por documento: status 'processing', spinner |
| Éxito/Error | Por documento: status 'success' o 'error', mensaje de error si aplica |
| Con procesados | DocumentList muestra documentos OK; botones "Exportar Excel" y "Enlazar Compras" |
| ExportDialog abierto | MassiveExportDialog: vista previa por doc, software A3ERP, export |
| LinkDialog abierto | MassiveLinkPurchasesDialog: enlazar compras a recepciones |

### ListadoComprasLonjaDeIsla (vista documento)
| Elemento | Estados |
|----------|---------|
| Tablas | ventas, peces, vendidurias, cajas, tipoVentas, importeTotal |
| ExportModal | software, errores, selectedLinks, isValidating, validationResults |

---

## User Interactions

1. **Individual**: Upload PDF → seleccionar tipo → clic "Extraer datos con IA" → ver resultado o toast error
2. **Masivo**: Añadir PDFs → asignar tipo a cada uno → "Procesar Todos" → ver lista procesados → "Exportar Excel" o "Enlazar Compras"
3. **Export**: En Individual (botón flotante) o Masivo (dialog) → elegir software A3ERP → Export → descarga Excel
4. **Enlazar**: Solo masivo → abre dialog con compras para enlazar a recepciones

---

## Data Flow

1. **PDF** → `processDocument(file, documentType)` → Azure Document AI → `parseAzureDocumentAIResult` → validator → parser → `processedData`
2. **processedData** → Componente visual (AlbaranCofraWeb, ListadoComprasLonjaDeIsla, ListadoComprasAsocPuntaDelMoral)
3. **Export**: processedData → exportHelper (generate*ExcelRows / generate*LinkedSummary) → excelGenerator / linkService

---

## Validation Rules (client-side)

- Tipo de documento requerido antes de procesar
- Archivo PDF requerido
- DocumentProcessor valida estructura Azure (validators) antes de parsear
- ExportModal LonjaDeIsla: validación de barcos, vendidurías, errores de conversión

---

## Permissions

- Rutas `allowedRoles`: administrador, direccion, tecnico (según navgationConfig)

---

## Error Handling

- **ValidationError**: toast "Error de validación: {mensaje}"
- **ParsingError**: toast "Error al procesar datos: {mensaje}"
- **Azure**: toast con mensaje de Azure
- **Unknown**: toast "Error inesperado al procesar el documento"
- Errores por documento en masivo: se muestran inline y en toast resumen

---

## Checkpoint: ¿Comportamiento UI = reglas de negocio documentadas?

No hay documento explícito de reglas de negocio para extracción lonja. El flujo actual parece coherente: subir → procesar → ver → exportar/enlazar. No se detectan incoherencias evidentes; las validaciones están en validators/parsers. Se procede con mejoras estructurales sin alterar lógica de negocio.

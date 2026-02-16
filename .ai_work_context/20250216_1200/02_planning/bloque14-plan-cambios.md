# Bloque 14: Plan de cambios (STEP 2)

**Fecha**: 2025-02-16  
**Riesgo global**: Medio (refactors estructurales, sin cambio de contrato ni lógica de negocio)

---

## Sub-bloque 1: IndividualMode + utils compartidos

**Riesgo**: Bajo  
**Impacto**: Menos duplicación, base para otros refactors

### Cambios
1. Unificar `processAlbaran...`, `processListadoAsoc...`, `processListadoLonja...` en un solo `handleProcess(documentType)`
2. Crear `src/helpers/formats/lonjaExportUtils.js` con `parseDecimalValue` y `calculateImporteFromLinea` (extraídos de ExportModals/MassiveExportDialog)

### Verificación
- IndividualMode: procesar un doc de cada tipo sigue funcionando
- Toasts de error correctos por tipo

---

## Sub-bloque 2: MassiveExportDialog — extracción de utils y subcomponentes

**Riesgo**: Medio  
**Impacto**: Reducir 893 líneas a <200 en el componente principal

### Cambios
1. Mover `parseDecimalValueHelper`, `calculateImporte`, `calculateImporteFromLinea` a lonjaExportUtils (o usar los ya extraídos)
2. Extraer `CofraExportPreview`, `LonjaDeIslaExportPreview`, `AsocExportPreview` como componentes que reciben document y renderizan accordion item
3. MassiveExportDialog: orquestar solo estado (software, isExporting, errors, documentsInfo) y llamar a previews

### Verificación
- Export masivo Excel con cada tipo de documento
- Errores se muestran correctamente
- Descarga Excel válida

---

## Sub-bloque 3: ExportModal LonjaDeIsla — extracción hook + utils

**Riesgo**: Medio  
**Impacto**: Reducir 868 líneas

### Cambios
1. Usar lonjaExportUtils para parseDecimalValue y calculateImporteFromLinea
2. Extraer `useLonjaDeIslaExportLogic` con: ventasVendidurias, ventasDirectas, errors, cálculos
3. Componente ExportModal: solo UI + hook

### Verificación
- Export Individual LonjaDeIsla Excel
- Link purchases si aplica
- Errores de barco/vendiduria visibles

---

## Sub-bloque 4: Tests DocumentProcessor + validators

**Riesgo**: Bajo  
**Impacto**: Cobertura crítica

### Cambios
1. `DocumentProcessor.test.js` — mock Azure, validación estructura
2. `lonjaDeIslaValidator.test.js` — casos válidos/inválidos
3. `lonjaDeIslaParser.test.js` — estructura esperada

### Verificación
- Tests pasan
- Cobertura suficiente para regresión

---

## Decisión de ejecución

- Sub-bloques 1–4: Riesgo Bajo/Medio, sin cambio de contrato ni lógica de negocio → **Ejecutar sin aprobación**
- Si en algún paso surge duda de negocio o cambio de flujo → PAUSAR y preguntar

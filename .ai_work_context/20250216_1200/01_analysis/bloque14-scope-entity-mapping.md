# Bloque 14: Extracción datos lonja — STEP 0a: Scope & Entity Mapping

**Fecha**: 2025-02-16  
**Estado**: Completado

---

## Alcance del bloque

El bloque 14 cubre el **MarketDataExtractor** completo: extracción de datos de documentos PDF de lonjas mediante Azure Document AI, visualización y exportación a Excel. Incluye 3 tipos de documentos:

| Tipo documento | Azure type | Componente visual | Validator | Parser |
|----------------|------------|-------------------|-----------|--------|
| albaranCofradiaPescadoresSantoCristoDelMar | AlbaranCofradiaPescadoresSantoCristoDelMar | AlbaranCofraWeb | cofraValidator | cofraParser |
| listadoComprasLonjaDeIsla | ListadoComprasLonjaDeIsla | ListadoComprasLonjaDeIsla | lonjaDeIslaValidator | lonjaDeIslaParser |
| listadoComprasAsocArmadoresPuntaDelMoral | ListadoComprasAsocArmadoresPuntaDelMoral | ListadoComprasAsocPuntaDelMoral | asocValidator | asocParser |

---

## Entidades y artefactos

### Páginas y rutas
- `src/app/admin/market-data-extractor/page.js` — Página async que renderiza MarketDataExtractor

### Componentes principales
| Componente | Ruta | Líneas | Observaciones |
|------------|------|--------|---------------|
| MarketDataExtractor | index.js | ~25 | Tabs Individual/Masivo |
| IndividualMode | IndividualMode/index.js | ~232 | PDF upload, tipo doc, proceso, vista |
| MassiveMode | MassiveMode/index.js | ~422 | Lista pendientes, procesar, exportar |
| DocumentList | MassiveMode/DocumentList.js | ~163 | Lista documentos procesados |
| MassiveExportDialog | MassiveMode/MassiveExportDialog.js | **893** | P0: >200 líneas |
| MassiveExportModal | MassiveMode/MassiveExportModal.js | ~151 | |
| MassiveLinkPurchasesDialog | MassiveMode/MassiveLinkPurchasesDialog.js | **389** | P1: >150 líneas |
| ListadoComprasLonjaDeIsla | ListadoComprasLonjaDeIsla/index.js | ~258 | Vista documento |
| ListadoComprasLonjaDeIsla ExportModal | ListadoComprasLonjaDeIsla/ExportModal/index.js | **868** | P0: >200 líneas |
| ListadoComprasAsocPuntaDelMoral | ListadoComprasAsocPuntaDelMoral/index.js | — | Vista documento |
| ListadoComprasAsocPuntaDelMoral ExportModal | ExportModal/index.js | **700** | P0: >200 líneas |
| AlbaranCofraWeb | AlbaranCofraWeb/index.js | — | Vista documento |
| AlbaranCofraWeb ExportModal | AlbaranCofraWeb/ExportModal/index.js | **651** | P0: >200 líneas |
| PdfUpload | Utilities/PdfUpload | — | Reutilizable |
| SparklesLoader | Utilities/SparklesLoader | — | |
| EmptyState | Utilities/EmptyState | — | |

### Shared
| Artefacto | Ruta | Descripción |
|-----------|------|-------------|
| DocumentProcessor | shared/DocumentProcessor.js | Procesa: Azure → validator → parser |
| documentTypeLabels | shared/documentTypeLabels.js | Labels por tipo |

### Servicios
| Servicio | Ruta | Descripción |
|----------|------|-------------|
| Azure Document AI | services/azure/index.js | extractDataWithAzureDocumentAi |
| Excel generator | services/export/excelGenerator.js | downloadMassiveExcel |

### Helpers / Parsers / Validators
| Tipo | Archivos |
|------|----------|
| Helpers Azure | helpers/azure/documentAI/index.js (parseAzureDocumentAIResult) |
| Validators | validators/lonjas/* (baseValidator, cofra, lonjaDeIsla, asoc) |
| Parsers | parsers/lonjas/* (baseParser, cofra, lonjaDeIsla, asoc, helpers) |
| Export helpers | exportHelpers/lonjaDeIslaExportHelper, cofraExportHelper, asocExportHelper, common |
| Errores | errors/lonjasErrors.js |

### Export data (maestros estáticos)
| Archivo | Contenido |
|---------|-----------|
| ListadoComprasLonjaDeIsla/exportData.js | productos, barcos, vendidurias, lonjaDeIsla, etc. |
| AlbaranCofraWeb/exportData.js | armadores, barcos, lonjas |
| ListadoComprasAsocPuntaDelMoral/exportData.js | datos ASOC |

### Tests
- **Existentes**: Ninguno para MarketDataExtractor, DocumentProcessor, validators ni parsers
- **Gaps**: Tests para DocumentProcessor, validators, parsers, exportHelpers (P0 para lógica crítica)

---

## Resumen de alcance

**Bloque 14 incluye:**
- **Entidades**: MarketDataExtractor (modos Individual y Masivo), 3 tipos de documento (Albarán Cofradía, Lonja de Isla, ASOC Punta del Moral)
- **Artefactos**: 18+ archivos en components, 4 exportHelpers, 4 validators, 4 parsers, 2 services principales
- **P0 (bloqueadores)**: MassiveExportDialog 893 líneas, ExportModal LonjaDeIsla 868, ExportModal ASOC 700, ExportModal AlbaranCofra 651
- **P1**: MassiveLinkPurchasesDialog 389 líneas, IndividualMode lógica duplicada, sin TypeScript

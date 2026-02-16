# Bloque 14: Extracción datos lonja — STEP 1: Análisis

**Fecha**: 2025-02-16  
**Estado**: Completado

---

## Rating antes: 4/10

**Justificación**: El bloque cumple su función (procesar PDFs, ver y exportar) pero presenta deuda técnica grave: 4 componentes >200 líneas (P0), 1 >150 (P1), todo en JavaScript, sin tests, lógica duplicada en IndividualMode y helpers de parseo/calculos dispersos. La estructura DocumentProcessor + validators + parsers es correcta; el problema está en los componentes de exportación y en la falta de tipos y tests.

---

## Resumen por entidad/artefacto

### MarketDataExtractor (index)
- **Estado**: Correcto. Tabs Individual/Masivo, ~25 líneas.
- **Mejora**: Ninguna prioritaria.

### IndividualMode
- **Estado**: ~232 líneas. Tres handlers casi idénticos (processAlbaran..., processListadoAsoc..., processListadoLonja...).
- **Oportunidad**: Unificar en `handleProcessByType(documentType)` con un solo handler. Riesgo Bajo.

### MassiveMode
- **Estado**: ~422 líneas. Gestión de documentos, procesamiento secuencial, dialogs.
- **Oportunidad**: Extraer `useMassiveModeDocuments` para estado y handlers. Riesgo Medio. El componente en sí está por debajo de 200 líneas si se extrae lógica.

### MassiveExportDialog — P0
- **Estado**: **893 líneas**. Contiene renderCofraContent, renderLonjaDeIslaContent, renderAsocContent, lógica de errores, cálculos, Accordion por doc.
- **Problemas**: Componente monolítico, helpers inline (parseDecimalValueHelper, calculateImporte), duplicación con ExportModals individuales.
- **Plan**: Extraer subcomponentes por tipo (CofraExportPreview, LonjaDeIslaExportPreview, AsocExportPreview), mover helpers a utils compartidos, extraer hook useMassiveExportState.

### MassiveExportModal
- **Estado**: ~151 líneas. Modal para export linked summary. Aceptable.

### MassiveLinkPurchasesDialog — P1
- **Estado**: 389 líneas. Lista compras, agrupación, validación, enlace.
- **Oportunidad**: Extraer hook useLinkPurchases, subcomponentes para lista y resumen.

### ListadoComprasLonjaDeIsla
- **Estado**: ~258 líneas. Vista documento bien estructurada. Tablas con `key={index}` en algunos lugares (P2).
- **Mejora menor**: Usar key estable si existe (ej. venta.venta + index).

### ListadoComprasLonjaDeIsla ExportModal — P0
- **Estado**: **868 líneas**. Lógica compleja: ventasVendidurias, ventasDirectas, cálculos de importes, validación barcos/vendidurías, export Excel, link purchases.
- **Problemas**: parseDecimalValue y calculateImporteFromLinea duplicados; lógica de negocio mezclada con UI.
- **Plan**: Extraer useLonjaDeIslaExportLogic (cálculos, agrupaciones, errores), LonjaDeIslaExportPreview, shared utils para parseDecimalValue/calculateImporte.

### ListadoComprasAsocPuntaDelMoral ExportModal — P0
- **Estado**: 700 líneas. Similar a LonjaDeIsla: cálculos, validaciones, export.
- **Plan**: Mismo patrón: extraer hook + subcomponentes + utils compartidos.

### AlbaranCofraWeb ExportModal — P0
- **Estado**: 651 líneas. Render Cofra, servicios lonja, conversiones.
- **Plan**: Extraer AlbaranCofraExportPreview, useCofraExportLogic, utils compartidos.

### DocumentProcessor
- **Estado**: ~149 líneas. Bien estructurado. Validator + parser por tipo.
- **Mejora**: Migrar a TypeScript (P1). Añadir tests (P0).

### Services
- **Azure**: Llamada a Document AI, polling. Usa fetchWithTenant. API key en NEXT_PUBLIC_* (auditoría ya flaggea riesgo).
- **excelGenerator**: downloadMassiveExcel. Bien separado.

### Validators / Parsers / ExportHelpers
- **Estado**: Bien separados. Sin tipos.
- **Mejora**: TypeScript + tests para validators y parsers (P0 para lógica crítica).

---

## Patrones Next.js/React

| Patrón | Presencia | Corrección |
|--------|-----------|------------|
| Server/Client | Page async, MarketDataExtractor 'use client' | Aceptable |
| Custom Hooks | No hay hooks de dominio para extractor | Oportunidad |
| Data Fetching | processDocument directo (async, no CRUD) | No aplica React Query típico; podría usar useMutation para proceso |
| Formularios | Select + handlers; sin formularios complejos | N/A |
| API Layer | DocumentProcessor + services/azure | Correcto |
| TypeScript | No | Todo .js |
| shadcn/ui | Sí (Tabs, Card, Select, Button, Dialog, Table, Badge, Accordion) | Correcto |
| Testing | Cero | Blocker |

---

## Tipo de datos

- Sin interfaces. Props sin tipos. Respuestas Azure sin tipos.
- Parsers y validators trabajan con estructuras implícitas.

---

## Accesibilidad

- Uso de shadcn/Radix aporta aria. Labels en Select. Falta revisión WCAG explícita.
- Algunas tablas con `key={index}` podrían afectar a screen readers en listas dinámicas si cambian.

---

## Prioridades (P0 → P1 → P2)

| Prioridad | Ítem | Acción |
|-----------|------|--------|
| P0 | MassiveExportDialog 893 líneas | Dividir en subcomponentes + utils |
| P0 | ExportModal LonjaDeIsla 868 líneas | Extraer hook + preview + utils |
| P0 | ExportModal ASOC 700 líneas | Extraer hook + preview + utils |
| P0 | ExportModal AlbaranCofra 651 líneas | Extraer hook + preview + utils |
| P0 | Tests DocumentProcessor, validators, parsers | Añadir tests críticos |
| P1 | MassiveLinkPurchasesDialog 389 líneas | Extraer useLinkPurchases + subcomponentes |
| P1 | IndividualMode duplicación | Unificar handleProcess |
| P1 | TypeScript | Migrar DocumentProcessor, validators, parsers |
| P2 | Key en tablas | Usar keys estables donde aplique |
| P2 | useMutation para processDocument | Opcional, mejora UX (loading/error) |

---

## Riesgos identificados

1. **Regresión en exportación**: Lógica de cálculo (parseDecimalValue, calculateImporte) duplicada en varios sitios. Cualquier cambio debe propagarse.
2. **Sin tests**: Cambios en parsers/validators pueden romper flujos sin detección.
3. **Azure API key en NEXT_PUBLIC_***: Riesgo de seguridad (ya documentado en auditoría global).

---

## Alineación con auditoría y CORE Plan

- Auditoría: componentes muy grandes, sin TypeScript, sin tests → aplica.
- CORE Plan bloque 14: Pendiente auditoría → esta es la auditoría/evolución.

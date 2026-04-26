# Auditoría: QA/UX Agent
# Bloque: MarketDataExtractor — Extracción de datos de documentos de lonjas

**Fecha:** 2026-04-26
**Rol auditor:** QA/UX Agent
**Scope:** Flujos de usuario, estados rotos, UX de formularios, acciones destructivas, edge cases, cobertura de tests

---

## 1. Scope revisado

| Área | Cubierto |
|---|---|
| Flujo principal de extracción (Individual) | Parcial (inferido del código) |
| Flujo de exportación Excel | Sí |
| Flujo de vinculación de compras | Sí |
| Cobertura de tests | Sí |
| Edge cases de parsing | Sí |
| Estados de error de UI | Sí |

---

## 2. Cobertura de tests — estado actual

### Tests relacionados con el bloque de lonjas

| Archivo de test | Cubre | Resultado |
|---|---|---|
| `shared/DocumentProcessor.test.js` | Orquestador principal | ✓ Existe |
| `validators/lonjaDeIslaValidator.test.js` | Validador LonjaDeIsla | ✓ Existe |
| `exportHelpers/lonjaDeIslaBarcoMatcher.test.js` | Matcher de barcos | ✓ Existe |
| `helpers/azure/lonjaDeIslaMultiPageNormalizer.test.js` | Normalizador multi-pág | ✓ Existe |
| `helpers/azure/asocMultiPageNormalizer.test.js` | Normalizador ASOC | ✓ Existe |

### Tests **ausentes** (críticos)

| Módulo sin test | Impacto si falla |
|---|---|
| `src/parsers/lonjas/cofraParser.js` | Datos incorrectos en exportación Cofra |
| `src/parsers/lonjas/lonjaDeIslaParser.js` | Datos incorrectos en exportación LonjaDeIsla |
| `src/parsers/lonjas/asocParser.js` | Datos incorrectos en exportación ASOC |
| `src/validators/lonjas/cofraValidator.js` | Documentos corruptos pasan sin error |
| `src/validators/lonjas/asocValidator.js` | Documentos corruptos pasan sin error |
| `src/exportHelpers/cofraExportHelper.js` | **Errores financieros en Excel de Cofra** |
| `src/exportHelpers/lonjaDeIslaExportHelper.js` | **Errores financieros en Excel de LonjaDeIsla** |
| `src/exportHelpers/asocExportHelper.js` | **Errores financieros en Excel de ASOC** |
| `src/parsers/lonjas/baseParser.js` | Errores de parsing en todos los tipos |
| `src/validators/lonjas/baseValidator.js` | Errores de validación en todos los tipos |

**Los exportHelpers son el módulo más crítico del bloque sin tests**: generan los datos que se importan directamente en A3ERP. Un error silencioso aquí produce datos financieros incorrectos en el ERP de la empresa.

### Calidad de tests existentes

El test `lonjaDeIslaValidator.test.js` (revisado) cubre:
- Estructura válida
- Múltiples documentos válidos
- Array vacío
- null/undefined

No cubre:
- Documentos con tablas parcialmente vacías
- Documentos donde algunos campos opcionales faltan
- Valores de tipo incorrecto en campos individuales

---

## 3. Issues críticos

### 3.1 [Crítico] Sin tests para exportHelpers financieros

Los exportHelpers generan filas Excel con campos como `LINUNIDADES`, `LINPRCMONEDA`, `CABNUMDOC`, `CABSERIE` que se importan directamente en A3ERP. Un error en el cálculo de precios, kilos o CIF de proveedor produce un asiento contable incorrecto.

Sin tests automatizados, la única verificación es manual tras cada cambio de código o de datos en `exportData.js`.

### 3.2 [Crítico] `parseString` retorna '' para null silenciosamente

```javascript
// baseParser.js:111-115
parseString(value, fieldName = null) {
    if (value === null || value === undefined) {
        return ''; // Return empty string for null/undefined (not an error)
    }
    return String(value).trim();
}
```

Si Azure no extrae un campo (ej. `barco` de una línea de subasta), `parseString` devuelve `''` sin lanzar error ni warning. El resultado es que la línea de exportación puede tener `barco: ''` — un campo vacío que pasa al Excel de A3ERP sin notificación al usuario.

---

## 4. Issues medios

### 4.1 [Medio] Sin estado vacío inicial claro

Cuando el usuario llega por primera vez al MarketDataExtractor sin haber procesado ningún documento, no hay ningún estado vacío explícito con instrucciones. El usuario no sabe que debe subir un PDF o qué tipo de documento se acepta.

### 4.2 [Medio] Opción "Facilcom" / "Otros" en Select sin implementar — sin feedback

```javascript
// ExportModal/index.js:148-153
} else if (software === "Facilcom") {
    // generateExcelForFacilcom();
} else {
    // generateExcelForOtros();
}
```

El usuario puede seleccionar "Facilcom" u "Otros" y hacer clic en "Exportar a A3ERP". No ocurre nada, sin mensaje de error ni de "no disponible". El usuario puede pensar que el botón está roto.

### 4.3 [Medio] Vinculación de compras — sin confirmación antes de `linkAllPurchases`

`handleOnClickLinkPurchases` llama directamente a `linkAllPurchases()` sin diálogo de confirmación. Es una acción que modifica el estado de recepciones en el backend — debería tener un confirm dialog siguiendo las convenciones del proyecto (acciones destructivas siempre piden confirmación).

### 4.4 [Medio] Armadores "no exportables" — sin indicación de acción requerida

Cuando `isSomeArmadorNotConvertible === true`, el badge muestra "Todos los armadores no son exportables." Este texto es incorrecto gramaticalmente (`isSomeArmador` → debería ser "Algún armador no es exportable"). Además, no indica qué debe hacer el usuario para resolver el problema.

---

## 5. Issues menores

### 5.1 [Menor] El botón "Exportar" está fijo en la pantalla (position: fixed)

```jsx
// AlbaranCofraWeb/index.js:261-264
<div className="fixed bottom-8 right-12">
    <Button className="rounded-full">
        <Download className="w-6 h-6" />
        Exportar
    </Button>
</div>
```

El botón de exportar usa `position: fixed` en la pantalla. En pantallas con scrollbars horizontales o en zoom > 100%, este botón puede superponer contenido de la tabla. Además, si el usuario tiene otro elemento fixed en esa posición, habrá colisión visual.

### 5.2 [Menor] Texto "Agrupado" en inglés en badge de barco agrupado

```jsx
// ExportModal/index.js:428-431
<span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Agrupado</span>
```

Correcto en español. Sin embargo, el color `bg-blue-100` es un color arbitrario Tailwind, no un Badge de shadcn.

### 5.3 [Menor] Error de validación Azure muestra "Error al comunicarse con Azure Document AI"

Este mensaje genérico no ayuda al usuario a distinguir si el PDF es inválido, si Azure está caído, o si hay un problema de configuración.

---

## 6. Edge cases sin cobertura

| Edge case | Comportamiento esperado | ¿Probado? |
|---|---|---|
| PDF vacío o corrupto | Error "azure" con mensaje claro | No |
| PDF con 0 páginas | Error en preprocessing | No |
| Barco no encontrado en exportData.js | `codBrisappArmador = null`, linea marcada como error | Parcial |
| Especie no encontrada en catálogo | Warning en LonjaDeIsla; throw en ASOC | No |
| Azure devuelve `status: "failed"` | `throw new Error("Análisis fallido en Azure.")` | Parcial (DocumentProcessor.test.js) |
| Rate limit de Azure (429) | Retry con 17s delay — detección frágil | No |
| Documento multi-página con 10+ páginas | Normalización multi-pág | No |
| Doble submit de exportación Excel | Puede generar dos descargas | No |
| Vinculación de compras cuando backend devuelve error 500 | Toast de error genérico | No |

---

## 7. Checklist de test manual completo

**Flujo individual — procesamiento:**
- [ ] Subir PDF válido de Cofra → verificar que se muestra la vista del documento correctamente
- [ ] Subir PDF válido de LonjaDeIsla → verificar vista y botón de exportar
- [ ] Subir PDF válido de ASOC → verificar vista y botón de exportar
- [ ] Subir un archivo no-PDF (ej. .jpg) → verificar mensaje de error
- [ ] Subir un PDF vacío/corrupto → verificar mensaje de error descriptivo

**Flujo de exportación:**
- [ ] Exportar Cofra a A3ERP → descargar .xls → verificar que se abre en Excel con datos correctos
- [ ] Seleccionar "Facilcom" y hacer clic en exportar → verificar que hay feedback de "no disponible"
- [ ] Hacer doble clic en "Exportar" → verificar que no genera dos archivos

**Flujo de vinculación:**
- [ ] Seleccionar compras y hacer clic en "Enlazar Compras" → verificar toast de éxito
- [ ] Hacer clic en "Enlazar Compras" sin seleccionar → verificar toast de error
- [ ] Probar con barco no encontrado en catálogo → verificar que la línea aparece como "No enlazable"

**Estados de UI:**
- [ ] Verificar estado vacío en IndividualMode y MassiveMode al entrar por primera vez
- [ ] Verificar que el spinner "Validando recepciones..." aparece durante la validación
- [ ] Verificar que el botón "Enlazar" se deshabilita durante validación

---

## 8. Recomendación general

El bloque funciona para el flujo principal feliz (PDF válido → extracción → exportación). Los riesgos principales son:

1. **Integridad financiera**: sin tests en exportHelpers, cualquier cambio en `exportData.js` o en los helpers puede producir datos incorrectos en A3ERP sin que nadie lo detecte.
2. **UX de error**: los mensajes de error son genéricos y no orientan al usuario hacia una acción correctiva.
3. **Acciones sin confirmación**: `linkAllPurchases` modifica el backend sin confirmación previa.

**Prioridad inmediata**: añadir tests para `cofraExportHelper`, `lonjaDeIslaExportHelper` y `asocExportHelper` con fixtures de documentos reales (o representativos) y verificación de las filas Excel generadas.

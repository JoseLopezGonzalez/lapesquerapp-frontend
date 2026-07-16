# GAP-115 — Unificar botones "Guardar" a solo texto (sin icono)

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global (Orders, Pallets — CRM, Profile y Superadmin ya cumplen el patrón objetivo)
- **Prioridad:** Baja
- **Estado:** open
- **Fecha:** 2026-07-16
- **Autor:** Jose

---

## Contexto y problema

Jose planteó evaluar si cambiar el icono `Save` de lucide-react (el disquete) por una
alternativa más "moderna", descartando `Bookmark` como opción, y valorando dejar el
botón solo con texto.

Auditoría rápida de los 12 botones "Guardar" del proyecto reveló que **ya existe
inconsistencia real**, con 3 patrones distintos conviviendo:

| Patrón                 | Archivos                                                                                                                                                                                                                                   | Nº  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| Solo texto (sin icono) | `OrderAttachmentEditNotesDialog.tsx`, `ResolveNextActionDialog.tsx`, `QuickInteractionModal.tsx`, `ProspectFormSheet.tsx`, `ProfilePageClient.tsx`, `PalletView/index.tsx`, `Superadmin/FeatureFlagsTab.tsx`, `Superadmin/GeneralData.tsx` | 8   |
| Icono `Check`          | `OrderPlannedDetailSheet.tsx`, `OrderAuxiliaryLineSheet.tsx`, `MobilePalletView/ImagenesTab.tsx`, `PalletImagesTab/index.tsx`                                                                                                              | 4   |
| Icono `Save`           | `OrderEditSheet/index.tsx`, `MobilePalletView/index.tsx`                                                                                                                                                                                   | 2   |

El patrón "solo texto" ya es mayoritario (8 de 14 instancias contando las 2 de `Check`
en tabs de imágenes). No está documentado ningún estándar de icono para "Guardar" en
`.claude/design-context.md`.

## Solución acordada

Jose decidió, tras revisar el hallazgo:

- **Icono final:** ninguno — todos los botones "Guardar" quedan solo con texto.
- **Alcance:** todo el proyecto, incluido el panel Superadmin.

Como la mayoría de archivos ya cumple el patrón objetivo, el trabajo real se reduce a
**quitar el icono en los 6 sitios que hoy llevan `Save` o `Check`** en el botón de
guardar, dejando el texto "Guardar" (o "Guardando..." durante el estado de carga, sin
tocar esa lógica). No se modifica ningún otro icono (p. ej. `RotateCcw` en "Descartar",
o el `Check` usado como indicador de selección en combos, que es un uso distinto y no
debe tocarse).

## Referencias e inspiración

- Patrón ya validado en `ProfilePageClient.tsx` (línea 117): `{isPending ? 'Guardando...' : 'Guardar cambios'}`
- Patrón ya validado en `Superadmin/GeneralData.tsx` (línea 243): `{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}`
- `.claude/design-context.md` línea 608: "Icons are Lucide-only" — no impone icono obligatorio en botones de acción primaria.

## Criterios de aceptación

- [ ] En `OrderEditSheet/index.tsx` (rama desktop, ~línea 777-781), el estado idle del
      botón de guardar muestra solo el texto `'Guardar'` — sin `<Save />`. El import de
      `Save` se elimina si queda sin otros usos en el archivo (`Check` se mantiene, se
      usa en el combobox de la línea 601).
- [ ] En `MobilePalletView/index.tsx` (~línea 392-395), el botón muestra `Guardar` como
      texto; durante `saving` se mantiene el spinner `Loader2` (sin texto adicional,
      igual que hoy). El import de `Save` se elimina (sin otros usos en el archivo).
- [ ] En `OrderPlannedDetailSheet.tsx` (~línea 348), el botón de guardar del sheet
      muestra solo `'Guardar'` — sin `<Check />`. El import de `Check` se mantiene (se
      usa como indicador de selección en la línea 152).
- [ ] En `OrderAuxiliaryLineSheet.tsx` (~línea 219), el botón de guardar muestra solo
      `'Guardar'` — sin `<Check />`. El import de `Check` se elimina si queda sin otros
      usos en el archivo.
- [ ] En `MobilePalletView/ImagenesTab.tsx` (~línea 290-295), el botón de guardar notas
      de la imagen muestra solo `Guardar`; se mantiene el `Loader2` durante `isUpdating`.
      El import de `Check` se elimina si queda sin otros usos en el archivo.
- [ ] En `PalletDialog/PalletView/PalletImagesTab/index.tsx` (~línea 410-415), mismo
      cambio que el punto anterior (botón equivalente de notas de imagen en desktop).
- [ ] Ningún otro icono de la UI se modifica como efecto de este GAP (`RotateCcw` en
      "Descartar", `Check` como indicador de combobox, `X`, etc. quedan intactos).
- [ ] Los 8 botones "Guardar" que ya eran solo texto no requieren cambios.
- [ ] `npm run type-check` y `npm run lint` limpios tras el cambio (imports no usados
      eliminados correctamente).

## Plan de validación

```text
npm run lint
npm run type-check
```

Verificación manual: abrir OrderEditSheet (desktop y mobile), MobilePalletView (mobile),
OrderPlannedDetailSheet, OrderAuxiliaryLineSheet, y las tabs de imágenes de palet
(mobile y desktop) — confirmar que el botón "Guardar" se ve solo con texto en todos los
estados (idle y loading).

## Archivos a crear o modificar

- `src/components/Admin/OrdersManager/Order/OrderEditSheet/index.tsx`
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx`
- `src/components/Admin/OrdersManager/Order/OrderPlannedProductDetails/OrderPlannedDetailSheet.tsx`
- `src/components/Admin/OrdersManager/Order/OrderAuxiliaryLines/OrderAuxiliaryLineSheet.tsx`
- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/ImagenesTab.tsx`
- `src/components/Admin/Pallets/PalletDialog/PalletView/PalletImagesTab/index.tsx`

## Restricciones

- No tocar los 8 botones "Guardar" que ya son solo texto (no requieren cambio).
- No eliminar ni modificar iconos que no sean el icono de "Guardar" propiamente dicho
  (`RotateCcw` en Descartar, `Check` como indicador de selección en combobox, spinners
  `Loader2` de estado de carga).
- No cambiar el texto del botón (`Guardar`, `Guardar cambios`, `Guardar override`,
  `Guardando...`) — solo el icono.
- No cambiar la lógica de negocio de guardado, solo el JSX del botón.

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Profile/ProfilePageClient.tsx` y
  `src/components/Superadmin/TenantDetailSections/GeneralData.tsx` — ambos ya
  implementan el patrón objetivo (texto solo, con `Loader2`/texto alternativo durante
  el estado de carga).
- **Tipo de layout:** no aplica — cambio puntual dentro de botones existentes en
  Sheets, Dialogs y una barra de acciones mobile ya implementados.
- **Componentes clave:** `Button` (shadcn), sin componentes nuevos.
- **Estados requeridos:** idle (texto `Guardar`) / loading (mantener el spinner
  `Loader2` ya existente donde lo hay, o el texto `Guardando...` donde ya se usa).
- **Mobile:** aplica ahora — 3 de los 6 archivos afectados son vistas mobile
  (`MobilePalletView/index.tsx`, `MobilePalletView/ImagenesTab.tsx`, y la rama mobile
  de `OrderEditSheet` ya era solo texto).

### Preguntas de confirmación para Jose

Ya resueltas durante el discovery:

1. Icono final → **Solo texto, sin icono**.
2. Alcance → **Todo el proyecto, incluido Superadmin** (en la práctica, solo 6 archivos
   requieren cambio real; el resto ya cumple el patrón).

---

## Implementación

> Rellena el Agente Implementador

### Archivos creados

### Archivos modificados

### Decisiones tomadas durante la implementación

### Desviaciones del plan (si las hay)

---

## Auditoría

> Rellena el Agente Auditor

### Resultado: ✅ APROBADO | ⚠️ APROBADO CON OBSERVACIONES | ❌ RECHAZADO

### Puntuación: [X/10]

### Checklist

- [ ] Criterios de aceptación cumplidos
- [ ] Sin fetch() directo
- [ ] Sin hardcode de tenant
- [ ] Sin archivos .js nuevos
- [ ] Sin any sin justificación
- [ ] Hooks gigantes no tocados sin permiso
- [ ] entitiesConfig.js no tocado sin permiso
- [ ] Patrones de .claude/rules/ respetados
- [ ] Nomenclatura correcta

### Observaciones para Jose

[Texto claro — qué está bien, qué hay que revisar, sin tecnicismos innecesarios]

### Estado final de la implementación

[Descripción del estado real del código tras la implementación]

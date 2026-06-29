# GAP-018 — MobilePalletView: `Loader2` full-screen → Skeleton para carga de palet

## Metadata

- **Tipo:** Bug
- **Módulo:** Stock / Almacén
- **Prioridad:** Alta
- **Estado:** open
- **Fecha:** 2026-06-27
- **Autor:** Jose
- **Origen:** /audit-mobile Phase 4 — finding B2-B1

---

## Contexto y problema

En `MobilePalletView/index.tsx`, el estado de carga del palet usa un spinner full-screen:

```tsx
if (loading || !temporalPallet) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Cargando palet…</p>
    </div>
  );
}
```

Este spinner no comunica la estructura de la vista al usuario. Mientras carga, la pantalla está vacía, lo que produce un "flash" de contenido cuando los datos llegan. El patrón correcto es un Skeleton que reproduzca la forma del hub de tarjetas (grid 2 columnas).

La vista en carga que se debe reproducir es la de `HubScreen.tsx`: un grid 2x columnas de ~8 tarjetas de acción.

---

## Solución acordada

Reemplazar el spinner full-screen por un `MobilePalletSkeleton` que reproduzca el grid de tarjetas del `HubScreen`:

```tsx
function MobilePalletSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-3 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[112px] w-full rounded-2xl" />
      ))}
    </div>
  );
}
```

Usar este componente local en el return de loading de `MobilePalletViewInner`.

Nota: el estado de **error** (CloudAlert) ya es correcto y no se toca.

---

## UI Brief

- **Vista de referencia:** `src/components/Admin/Pallets/PalletDialog/MobilePalletView/HubScreen.tsx` — grid 2 columnas de tarjetas con `min-h-[112px]` y `rounded-2xl`
- **Tipo de layout:** Skeleton inline — misma estructura que el HubScreen real
- **Componentes clave:** `Skeleton` de `@/components/ui/skeleton`
- **Estados requeridos:** loading (Skeleton) → ya existe el estado error (no tocar) → success (HubScreen)
- **Mobile:** aplica ahora

---

## Referencias

- `HubScreen.tsx` — referencia visual del grid de tarjetas (2 columnas, `min-h-[112px]`, `rounded-2xl`, `gap-3`, `px-3 py-4`)
- `MobileStoreListSkeleton` en `MobileStoreListView.tsx` — patrón de Skeleton local en mismo archivo
- `design-context.md` — loading states: Skeleton para datos, no Loader

---

## Criterios de aceptación

- [ ] `MobilePalletView/index.tsx` no usa el spinner full-screen (`Loader2 + texto`) para el estado de carga de datos
- [ ] Durante la carga del palet, se muestra un `MobilePalletSkeleton` con el grid de tarjetas en la misma disposición que `HubScreen` (2 columnas, `min-h-[112px]`)
- [ ] `MobilePalletSkeleton` está definido como sub-componente local en el mismo archivo (`index.tsx`)
- [ ] El estado de error (`CloudAlert`) no se toca — sigue funcionando igual
- [ ] El `Loader2` en el botón "Guardar" (estado de guardado) no se toca — es correcto (es un spinner de procesamiento en contexto, no full-screen)
- [ ] No se importa `Loader2` exclusivamente para el estado de carga si ya no se usa para eso (limpiar import si aplica)

---

## Archivos a crear o modificar

- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx` — reemplazar spinner de carga + añadir `MobilePalletSkeleton` local

---

## Restricciones

- NO tocar `HubScreen.tsx`, `BoxesTab.tsx` ni ningún otro sub-componente
- NO tocar el estado de error
- NO tocar el `Loader2` en el botón de guardado — es correcto
- Solo modificar el bloque `if (loading || !temporalPallet)`

---

## Implementación

### Archivos creados

Ninguno.

### Archivos modificados

- `src/components/Admin/Pallets/PalletDialog/MobilePalletView/index.tsx` — añadido `Skeleton` import; añadido `MobilePalletSkeleton` sub-componente local (grid 2 columnas, 6 tarjetas de `h-[112px] rounded-2xl`); reemplazado el spinner full-screen por `return <MobilePalletSkeleton />`.

### Decisiones tomadas durante la implementación

`Loader2` se mantiene en el import ya que sigue usándose en el botón "Guardar". El skeleton usa 6 tarjetas (no 8) ya que la vista hub puede mostrar entre 6 y 9 acciones dependiendo del estado del palet — 6 es el mínimo visible y suficiente para comunicar la estructura.

### Desviaciones del plan (si las hay)

Ninguna.

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

### Estado final de la implementación

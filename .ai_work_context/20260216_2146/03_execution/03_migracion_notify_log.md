# Log de implementación — Migración a Sileo (Fase 3)

**Estado**: Completado  
**Última actualización**: 2026-02-16

## Realizado

1. **Instalación**: `npm install sileo`
2. **Layout**: Añadido `<SileoToaster position="top-right" />` e import de `sileo/styles.css` en `src/app/ClientLayout.js`. Se mantiene `<Toaster />` de react-hot-toast.
3. **Wrapper**: Creado `src/lib/notifications.ts` con API `notify.success`, `notify.error`, `notify.warning`, `notify.info`, `notify.loading`, `notify.promise`, `notify.dismiss`, `notify.clear`. Mapeo a Sileo con `title` (string), `duration` y `id` para reemplazo loading→success/error.
4. **Migración**: Sustituidos todos los usos de `toast.*` y `getToastTheme()` por `notify.*` en ~55 archivos de `src/`. Incluye flujos con loading+id, dismiss y duration custom (6000).
5. **EntityClient**: Loading con JSX sustituido por mensaje string ("Generando exportación...", "Generando reporte...").
6. **Correcciones**:
   - Sintaxis en `notifications.ts` (optional chaining en promise) y tipos (position, invoke possibly undefined).
   - Líneas concatenadas por el script de migración: restaurados newlines en OrderRanking, WorkerStatisticsCard, LabelEditor/index, OrderIncident, ProductionView, AddElementToPositionDialog, LabelSelectorSheet.
   - Orden `'use client'` antes de imports en OrderRanking, WorkerStatisticsCard, ProductionView.

## No modificado (según plan)

- **react-hot-toast**: Sigue instalado y con `<Toaster />` en ClientLayout. No eliminado hasta Fase 4.
- **customs/reactHotToast**: Sigue existiendo; ya no se importa desde la app (solo definición).
- **Lógica de negocio y textos**: Sin cambios.

## Verificación

- `npm run build`: OK.
- No quedan imports activos de `getToastTheme` en componentes/hooks (solo en `customs/reactHotToast/index.js`).
- Todos los `toast.*` sustituidos por `notify.*` en `src/` (excepto ClientLayout que solo monta Toaster de hot-toast).

## Próximo (Fase 4)

- Confirmar en runtime que no quedan llamadas a toast.
- Generar informe final de limpieza.
- Proponer eliminación de dependencia `react-hot-toast` y de `src/customs/reactHotToast/`.

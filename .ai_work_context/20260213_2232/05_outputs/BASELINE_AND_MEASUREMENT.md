# Baseline y medición

**Fecha**: 2026-02-13  
**Sesión**: 20260213_2232

## Alcance

Esta auditoría es **solo de análisis y documentación**. No se han implementado cambios en el código. Por tanto, no hay métricas "After" ni comparativa antes/después.

---

## Método de medición recomendado

Para obtener un baseline antes de aplicar mejoras:

1. **Build de producción**
   ```bash
   npm run build && npm run start
   ```

2. **Lighthouse** (Chrome DevTools)
   - Modo: Desktop y Mobile
   - Throttling: Simulated (por defecto) y/o "No throttling" para referencia
   - Rutas a medir: `/` (landing), `/` (login en subdominio), `/admin/home`, `/admin/orders-manager`, `/warehouse/[storeId]`

3. **WebPageTest** (opcional)
   - Ubicación cercana al backend
   - Repeat View para medir caché

4. **Métricas clave**
   - TTFB (Time to First Byte)
   - FCP (First Contentful Paint)
   - LCP (Largest Contentful Paint)
   - TBT (Total Blocking Time)
   - CLS (Cumulative Layout Shift)
   - Tamaño de JS transferido (Network tab)

---

## Baseline aproximado (sin medición directa)

| Métrica | Valor aproximado | Notas |
|---------|------------------|-------|
| Chunks estáticos | ~9.2 MB | `.next/static/chunks` |
| Rutas estáticas | 4 | /, /_not-found, /auth/verify, /unauthorized |
| Rutas dinámicas | 35+ | Todas las de admin/warehouse/production |
| Tiempo de build | ~2 min | Compilación exitosa con Turbopack |

---

## Después de implementar mejoras

Al aplicar cambios del Plan Estratégico, repetir las mediciones y documentar en este archivo o en un nuevo documento de sesión:

- Fecha
- Cambios implementados
- Métricas antes / después
- Herramienta utilizada

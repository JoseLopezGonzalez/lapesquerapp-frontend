# Production checklist — PesquerApp

**Fecha**: 2026-02-13  
**Sesión**: 20260213_2232

---

## 1. next build

- [ ] Ejecutar `npm run build` sin errores ni warnings críticos.
- [ ] Revisar tamaño de `.next/static/chunks`; identificar chunks >100 KB.
- [ ] Considerar `ANALYZE=true npm run build` si se configura `@next/bundle-analyzer`.

---

## 2. next.config.mjs

| Recomendación | Estado actual | Acción |
|---------------|---------------|--------|
| `compress: true` (por defecto en producción) | Implícito | Verificar que no esté desactivado |
| `images.domains` o `images.remotePatterns` | No configurado | Añadir si hay imágenes externas |
| `experimental.optimizeCss` | No | Evaluar para reducir CSS |
| `reactStrictMode: true` | No visible | Añadir |
| Headers de seguridad (CSP, X-Frame-Options) | No | Evaluar según política de seguridad |

---

## 3. Headers y caching

| Recurso | Headers recomendados |
|---------|----------------------|
| `/_next/static/*` | `Cache-Control: public, max-age=31536000, immutable` |
| ` /favicon.ico`, `/og-image.png` | `Cache-Control: public, max-age=86400` |
| `/api/*` | Sin caché o `private, max-age=0` para datos dinámicos |
| HTML de páginas | `Cache-Control: private, no-cache` o similar para SSR |

---

## 4. Optimización de imágenes

- [ ] Usar `next/image` en todas las imágenes (ya en LandingPage).
- [ ] Configurar `sizes` adecuados para responsive.
- [ ] `priority` en above-the-fold (ya en landing mockup).
- [ ] Evaluar formato WebP/AVIF si el servidor lo soporta.

---

## 5. Compresión

- [ ] Gzip o Brotli habilitado en servidor (Vercel, Nginx, etc.).
- [ ] Next.js comprime estáticos por defecto; verificar en producción.

---

## 6. CDN

- [ ] Servir `/_next/static/*` desde CDN.
- [ ] Configurar CDN para backend API si aplica.
- [ ] Headers de caché coherentes entre origen y CDN.

---

## 7. Runtime: Edge vs Node

| Componente | Recomendación |
|------------|---------------|
| Middleware | Edge si es posible; verificar compatibilidad con `fetchWithTenant` y `getToken`. |
| API Routes | Node para `/api/chat`, `/api/submit-entity` (Laravel backend). |
| Páginas | Node por defecto; Edge solo para páginas muy ligeras si se valida. |

---

## 8. Lighthouse

- [ ] Ejecutar Lighthouse en modo producción (build + start).
- [ ] Objetivos: Performance >80, Accessibility >90, Best Practices >90, SEO >90.
- [ ] Revisar oportunidades: "Reduce unused JavaScript", "Properly size images", "Minimize main-thread work".
- [ ] Probar en modo throttling (Slow 4G, CPU 4x slowdown) para simular móvil.

---

## 9. Variables de entorno

- [ ] `NEXTAUTH_SECRET` configurado y seguro.
- [ ] `NEXT_PUBLIC_API_URL` o `NEXT_PUBLIC_API_BASE_URL` correcto para producción.
- [ ] No exponer secretos en `NEXT_PUBLIC_*`.

---

## 10. Logs y debugging

- [x] Eliminar o condicionar `console.log` en producción — **Implementado**: `removeConsole` en next.config + `src/lib/logger.js`.
- [ ] Revisar `console.warn` y `console.error` en archivos que aún no usan el logger — mantener solo los necesarios para monitoreo.

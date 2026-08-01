# GAP-133 — Landing: rediseño "Así funciona" + sección "Cumplimiento Legal"

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-08-01
- **Autor:** Jose

---

## Contexto y problema

Ronda de refinamiento continuo de la landing (`.claude/landing-proposal.md` §12). Dos
secciones de la home señaladas por Jose como débiles, con causa raíz relacionada
(contenido que no refleja la profundidad real del producto) documentadas en detalle en
`landing-proposal.md` §12.4 y §12.5:

1. **`HowItWorks` ("Así funciona")** — el copy actual narra una cadena de suministro
   física lineal (captura/lonja → producción → venta) que asume que todo cliente tiene
   captura propia o produce. El módulo que `product-catalog.md` marca como núcleo del
   producto ("difícil vender el producto sin él") es **Ventas/Pedidos**, no Producción, y
   queda oculto detrás de la palabra genérica "trazabilidad". Visualmente es la única
   sección de la home sin ninguna imagen — solo círculo numerado + icono + texto.
2. **`TrustBadge` ("Cumplimiento Legal")** — hoy es un único icono + título + una línea de
   descripción genérica, sin contenido real. El proyecto sí tiene compliance real y
   verificable en el código (Reglamento UE 1379/2013, trazabilidad por palet/caja/lote,
   catálogo FAO/ASFIS) que hoy no se muestra en ningún sitio.

---

## Decisiones ya confirmadas por Jose (2026-08-01)

Vinculantes para este GAP — no se vuelven a preguntar:

### `HowItWorks`

| Dimensión | Decisión |
|---|---|
| **Contenido nuevo** | Centrado en el pedido como eje real del producto, no en una metáfora de cadena de suministro física: **(1) "El pedido, el centro de todo"** — creas el pedido (cliente, productos previstos, plazos); todo lo demás se conecta a partir de aquí. **(2) "Producción y stock reales"** — ya sea transformando materia prima propia o de lonja con trazabilidad de lote, o casando el pedido contra palets ya en almacén, el sistema compara lo previsto con lo real automáticamente. **(3) "Documentación, envío y rentabilidad"** — genera de un clic la documentación legal y logística (CMR, packing list, etiquetas...), la ruta de entrega y el margen por pedido. |
| **Visual** | Sustituir el icono Lucide de cada paso por una captura real de la app (**Tipo 1**, `landing-context.md §7b`), recortada y tratada visualmente. Añadir una línea conectora detrás de los círculos numerados — horizontal en desktop, vertical en mobile. |
| **Capturas Tipo 1 (contenido exacto a especificar aquí, no delegado)** | **Paso 1:** ficha/creación de pedido con previsión — desktop, tenant demo/seed, un pedido con varias líneas de producto previstas visibles. **Paso 2:** diagrama de árbol de producción o mapa de almacén con palets asignados — desktop, tenant demo/seed. **Paso 3:** un documento generado (packing list o CMR) o el panel de rentabilidad por pedido — desktop, tenant demo/seed. Las 3 capturas quedan como `AssetPlaceholder` tipo 1 en este GAP; un GAP corto de seguimiento las sustituye por las capturas reales (mismo patrón que los placeholders tipo 2/3 de B2), no bloquea el cierre. |
| **Mezcla de tipos de imagen** | Deliberada frente al bento (tipo 3, IA) — aquí captura real (tipo 1), refuerza "esto no es una promesa abstracta". |

### `TrustBadge` → sección "Cumplimiento Legal"

| Dimensión | Decisión |
|---|---|
| **Claims activos (se publican en este GAP)** | 3, todos verificados contra `product-catalog.md`, no requieren confirmación de negocio de Jose (son hechos ya reales en el código): **(1)** Etiquetado según el Reglamento UE 1379/2013 — nombre comercial y científico, método de producción y zona de captura en cada etiqueta generada. **(2)** Trazabilidad completa por palet, caja y lote — histórico de cada palet desde su creación hasta la expedición. **(3)** Catálogo FAO/ASFIS integrado — +13.700 especies para autocompletar nombre científico y datos normativos. |
| **Claims bloqueados — NO se implementan en este GAP** | **(4) Código de barras GS1-128** — bloqueado por un bug de dominio real y ya documentado (`product-catalog.md`, módulo Stock: Application Identifier 3100/3200 en vez de 3102/3202, un lector estándar externo decodifica el peso ×100). No se activa hasta que el bug esté corregido en un GAP aparte del módulo Stock/Almacén, fuera del alcance de landing. **(5) Cumplimiento RGPD** — bloqueado hasta que Jose confirme explícitamente que el tratamiento de datos de la plataforma cumple RGPD de verdad (no es un hecho verificable solo leyendo el código). Ambos quedan **documentados como comentario en el código** (`// TODO(deuda-técnica): ver landing-proposal.md §12.5 — no activar sin resolver prerrequisito`) pero sin UI, sin claves de traducción activas, sin renderizar. |
| **Visual** | Bloque de 3 items en línea (icono + título corto + 1 línea cada uno — el icono sí tiene sentido porque ningún item lleva ilustración que compita, mismo criterio que el resto de la landing). Montado sobre `bg-muted/30` para romper el tramo de 3 secciones blancas seguidas (`HowItWorks` → `IntegratedLonjas` → `TrustBadge` hoy sin fondo diferenciado) y darle identidad propia. Layout preparado para pasar a 5 items sin rediseño el día que los claims 4 y 5 se activen (a validar en implementación que el grid soporte 2+3 o similar sin refactor). |
| **Rename de archivo** | Opcional, a criterio de implementación (`TrustBadge.tsx` → `LegalCompliance.tsx`) — no bloqueante, ya no es un "badge" único. |

---

## Solución acordada

### 1. `src/components/LandingPage/HowItWorks.tsx`

- Sustituir el array `STEPS` (icono Lucide por paso) por slots de `AssetPlaceholder` tipo 1
  con los `label` exactos especificados en la tabla de decisiones arriba.
- Añadir línea conectora: `::before`/elemento absoluto con `border-t`/`bg-border` detrás
  de los círculos numerados en desktop (`hidden sm:block`), y una variante vertical para
  mobile (stack actual).
- Copy nuevo en `landing.json` namespace `Landing.howItWorks` (los 3 pasos de la tabla de
  decisiones) — texto exacto delegado a `landing-content-writer` sobre el criterio ya
  fijado (no se inventa un cuarto criterio).

### 2. `src/components/LandingPage/TrustBadge.tsx`

- Reemplazar el bloque único (icono + título + descripción) por 3 items en grid
  (icono + título + descripción corta cada uno), namespace `Landing.trustBadge` ampliado
  con 3 sub-objetos (`claim1`/`claim2`/`claim3` o nombres equivalentes).
- Envolver la sección en `bg-muted/30` (hoy sin fondo propio).
- Añadir comentario `// TODO` (no UI) documentando los 2 claims bloqueados y sus
  prerrequisitos exactos, referenciando `landing-proposal.md §12.5`.

### 3. Copy — `src/messages/{es,pt,en}/landing.json`

- `Landing.howItWorks.step1/step2/step3` — reescritos según el criterio de la tabla.
- `Landing.trustBadge` — reescrito de descripción única a 3 claims.
- Traducción PT/EN por `landing-content-writer`, paridad de claves.

---

## Referencias e inspiración

- `.claude/landing-proposal.md` §12.4 (HowItWorks) y §12.5 (TrustBadge/Cumplimiento
  Legal) — análisis completo, investigación de mercado 2026 con fuentes.
- `.claude/landing-context.md §7b` — clasificación obligatoria de assets (tipo 1/2/3) y
  bloque de estilo base.
- `.claude/product-catalog.md` — módulo Ventas/Pedidos (17 documentos, rentabilidad),
  módulo Editor de Etiquetas (Reglamento UE 1379/2013), módulo Stock (bug GS1-128, campo
  lote), módulo Catálogos de Sector (FAO/ASFIS).

---

## UI Brief

- **Vista de referencia:** `HowItWorks.tsx` y `TrustBadge.tsx` actuales (mismos archivos,
  se modifican in situ).
- **Tipo de layout:** 2 secciones de home, sin modal/sheet.
- **Componentes clave:** `AssetPlaceholder` (ya existente, tipo 1 en vez de sin uso previo
  en `HowItWorks`), `ScrollReveal` (ya en uso en ambos).
- **Estados requeridos:** ninguno con fetching — Server Components estáticos.
- **Mobile:** aplica ya — línea conectora vertical en `HowItWorks`, grid de `TrustBadge`
  a 1 columna.

### Preguntas de confirmación para Jose

Ninguna — el discovery de ambas secciones se completó en el hilo de la ronda de
refinamiento (`landing-proposal.md` §12.4/§12.5), incluida la resolución explícita de
qué claims se publican y cuáles quedan bloqueados como deuda técnica.

---

## Criterios de aceptación

- [ ] `HowItWorks.tsx` no importa `Fish`, `Boxes` ni `ShoppingCart` de `lucide-react` —
      los 3 pasos usan `AssetPlaceholder` tipo 1 con los `label` especificados arriba.
- [ ] Existe una línea/elemento conector visible entre los 3 pasos en desktop (`sm:` o
      superior), y una variante vertical o equivalente en mobile.
- [ ] Copy de los 3 pasos (ES) ya no usa "Captura o lonja" como paso 1 ni "Venta y
      trazabilidad" como título del paso 3 — refleja el pedido como eje (ver tabla).
- [ ] `TrustBadge.tsx` (o su archivo renombrado) muestra 3 items con icono + título +
      descripción, no 1 solo.
- [ ] Los 3 claims activos mencionan explícitamente: Reglamento UE 1379/2013,
      trazabilidad por palet/caja/lote, catálogo FAO/ASFIS (+13.700 especies) — uno por
      item.
- [ ] `grep -rn "GS1\|RGPD\|GDPR"` sobre el componente y sus claves de `landing.json` →
      cero apariciones en contenido visible/renderizado (solo permitido en comentario
      `// TODO` no renderizado).
- [ ] La sección `TrustBadge` tiene fondo `bg-muted/30` (hoy no lo tiene).
- [ ] `grep -c` de "ISO 27001", "99.9%", "4.9/5" o cualquier cifra/certificación no
      verificada sobre ambos componentes → 0.
- [ ] Paridad de claves verificada entre `es/landing.json`, `pt/landing.json`,
      `en/landing.json`.
- [ ] `GET /`, `/pt`, `/en` (dominio raíz) devuelven 200 con ambas secciones
      renderizadas correctamente en los 3 idiomas.
- [ ] Cero regresión sobre Fases A–D y sobre GAP-132 (si se implementa antes): resto de
      secciones de la home sin cambios no relacionados.
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Modificar:**
- `src/components/LandingPage/HowItWorks.tsx`
- `src/components/LandingPage/TrustBadge.tsx` (o renombrar a `LegalCompliance.tsx` — si
  se renombra, actualizar el import en `src/app/[locale]/page.tsx` o donde se componga la
  home)
- `src/messages/es/landing.json`, `src/messages/pt/landing.json`, `src/messages/en/landing.json`

**No tocar:**
- `src/components/LandingPage/ModulesBento.tsx` (cubierto por GAP-132)
- `src/components/LandingPage/Hero.tsx`, `IntegratedLonjas.tsx`, `PricingPreview.tsx`,
  `LeadCaptureForm.tsx`, `Footer.tsx`, `AssetPlaceholder.tsx`, `ScrollReveal.tsx`
- `src/middleware.ts`

---

## Restricciones

- **No activar los claims 4 (GS1-128) y 5 (RGPD)** bajo ninguna circunstancia en este
  GAP — ni en UI ni en claves de traducción activas. Solo comentario `// TODO` en código
  referenciando el prerrequisito y `landing-proposal.md §12.5`.
- **No usar capturas reales de un cliente real** para los placeholders tipo 1 — cuando se
  sustituyan (GAP de seguimiento), siempre tenant demo/seed.
- **No inventar cifras ni certificaciones adicionales** a las 3 ya confirmadas.
- **No tocar `ModulesBento.tsx`** aunque comparta contexto con GAP-132 — si ambos GAPs se
  implementan en la misma sesión, mantener los diffs separados por archivo.
- **Sin scroll horizontal** en ningún breakpoint.
- **Sin dependencias nuevas.**

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

### Estado final de la implementación

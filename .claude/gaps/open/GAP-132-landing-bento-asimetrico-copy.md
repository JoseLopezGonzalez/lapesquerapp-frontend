# GAP-132 — Landing: bento asimétrico real + iconos redundantes + copy diversificado

## Metadata

- **Tipo:** Mejora
- **Módulo:** Global (sitio público / landing)
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-08-01
- **Autor:** Jose

---

## Contexto y problema

Ronda de refinamiento continuo de la landing (`.claude/landing-proposal.md` §12, iniciada
2026-08-01, sobre la base ya cerrada de Fases A–D + trabajo de pricing de §11). Tres
hallazgos relacionados sobre `ModulesBento.tsx` y el copy general de la home, discutidos y
confirmados con Jose en el hilo de la ronda:

1. **`ModulesBento` no es un bento real** — es un grid uniforme
   (`grid gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5`) con las 5 tarjetas exactamente del
   mismo tamaño. La característica que define a un bento (asimetría, jerarquía visual por
   tamaño) no existe hoy.
2. **Icono Lucide redundante en cada tarjeta** — el prompt base ya bloqueado para las
   ilustraciones tipo 3 (`landing-context.md §5/§7b`) incluye *"thin clean white line-icon
   on a solid black rounded-square badge"* como parte del propio estilo de la ilustración.
   El badge de icono Lucide en el `CardHeader` de cada tarjeta es un vestigio duplicado de
   antes de que B2/GAP-121 añadiera las ilustraciones.
3. **El copy de toda la home sobre-repite "trazabilidad/lote/caducidad"** (10 de ~15
   textos de cabecera de la página) y, en paralelo, **3 módulos reales y activos del
   producto no aparecen en ningún sitio de la landing**: CRM Comercial (agenda,
   prospectos, ofertas, rutas comerciales, autoventa), Proveedores (calendario de
   liquidaciones) y Repartidores/Autoventa (app mobile de reparto) — contrastado contra
   `.claude/product-catalog.md`.

Detalle completo del análisis, la investigación de mercado 2026 y las alternativas
descartadas: `.claude/landing-proposal.md` §12.3, §12.6 y §12.7.

---

## Decisiones ya confirmadas por Jose (2026-08-01)

Vinculantes para este GAP — no se vuelven a preguntar:

| Dimensión | Decisión |
|---|---|
| **Iconos del bento** | Se eliminan los 5 icon-badges Lucide (`Fish`/`Package`/`ShoppingCart`/`Sparkle`/`Ticket`) de `ModulesBento.tsx`. El concepto de icono sigue vivo dentro del prompt de cada ilustración tipo 3 — no se pierde, se deja de duplicar. `HowItWorks.tsx` y `TrustBadge.tsx` **no se tocan en este GAP** (su icono es el único elemento visual de su tarjeta, no compite con ninguna ilustración). |
| **Ampliar el bento a 7-8 tarjetas (opción A)** | Descartado explícitamente. Se mantienen las 5 tarjetas de módulo reales (Producción, Stock, Compras y Ventas, IA, Etiquetas). |
| **Grid asimétrico (opción B, confirmada)** | `ModulesBento.tsx` pasa de `grid-cols-5` uniforme a un grid con jerarquía de tamaños vía `col-span`/`row-span`: **tile hero (2×2) en "Compras y Ventas"** (representa el módulo Pedidos, núcleo real del producto según `product-catalog.md` — previsión, 17 documentos, rentabilidad, ruta); **tiles medianos (2×1)** en Producción y Stock (los otros dos módulos de mayor inversión de desarrollo según `product-catalog.md`); **tiles pequeños (1×1)** en IA y Etiquetas. |
| **Tile de cierre solo-texto** | Se añade un 6º tile sin ilustración, con los 3 módulos hoy invisibles: **CRM comercial y ofertas**, **Liquidaciones a proveedores**, **Reparto y autoventa móvil**. No es un módulo nuevo del bento (no lleva ilustración tipo 3 ni card completa) — es contenido de refuerzo, mismo criterio de "icono/texto sin ilustración compitiendo" ya aplicado en `TrustBadge`. |
| **Mobile** | La asimetría es una técnica desktop/tablet. En mobile todos los tiles (los 5 + el de cierre) se apilan a una columna en orden de prioridad: hero primero, tile de cierre al final. |
| **Reescritura de copy** | Diversificar `hero.subtitle`, `hero.modulesList`, `modules.title`, `footer.taglineLine2`, `leadForm.title` — dejan de usar trazabilidad/lote/caducidad como titular por defecto. `modules.production/stock/labels` (donde ese vocabulario SÍ es real y relevante) se mantienen sin cambio de fondo. `hero.modulesList` se alinea exactamente con las 5 tarjetas reales del bento (Producción ∷ Stock ∷ Compras y Ventas ∷ IA ∷ Etiquetas), sin tratar "Trazabilidad" como un módulo suelto. |
| **Copy del tile hero** | `modules.sales.description` (Compras y Ventas) se amplía para aprovechar el espacio extra del tile 2×2 — puede mencionar previsión, documentación automática y/o rentabilidad, hoy completamente ausentes de esa tarjeta. |
| **Texto final** | Redactado por `landing-content-writer` en el ciclo de implementación siguiendo estos criterios — este GAP fija el criterio, no el texto exacto (mismo reparto de trabajo que el resto de la landing). |

---

## Solución acordada

### 1. `src/components/LandingPage/ModulesBento.tsx`

- Quitar el `<div>` de icon-badge (`bg-muted mb-4 inline-flex w-fit rounded-xl p-3` + icono
  Lucide) de las 5 tarjetas y sus imports (`Fish`, `Package`, `ShoppingCart`, `Sparkle`,
  `Ticket`). `CardHeader` queda solo con `CardTitle`.
- Sustituir el grid uniforme por un grid asimétrico (`grid-cols-4` o equivalente en
  desktop, con `col-span-2 row-span-2` en el tile hero, `col-span-2` en los medianos,
  tamaño base en los pequeños) — distribución exacta de filas/columnas a validar
  visualmente en implementación contra el resultado real, manteniendo el orden de
  contenido: Compras y Ventas (hero) → Producción → Stock → IA → Etiquetas → tile de
  cierre.
- Añadir el 6º tile de cierre: sin `AssetPlaceholder`, con título corto + 3 items de texto
  (CRM comercial y ofertas / Liquidaciones a proveedores / Reparto y autoventa móvil).
  Puede reutilizar el patrón visual de icono simple (sin ilustración) si aporta claridad,
  a criterio de implementación.
- Mobile: `grid-cols-1` (o el `sm:grid-cols-2` intermedio que ya existe hoy), orden fijo
  hero primero, tile de cierre último.

### 2. Copy — `src/messages/{es,pt,en}/landing.json`

- Reescribir: `hero.subtitle`, `hero.modulesList`, `modules.title`,
  `modules.sales.description`, `footer.taglineLine2`, `leadForm.title`.
- Añadir namespace nuevo para el tile de cierre (ej. `modules.closing.title` +
  `modules.closing.items` con 3 claves: `crm`, `suppliers`, `delivery`).
- Traducción PT/EN por `landing-content-writer`, paridad de claves verificada contra ES
  (mismo patrón que Fases C/D).

---

## Referencias e inspiración

- `.claude/landing-proposal.md` §12.3 (iconos redundantes), §12.6 (diversificación de
  copy y módulos invisibles), §12.7 (bento asimétrico + tile de cierre) — análisis
  completo, cifras del grep de trazabilidad/lote/caducidad, e investigación de mercado
  2026 con fuentes.
- `.claude/landing-context.md §2` — dirección visual bloqueada (Linear, Vercel, Arc,
  Raycast como referencias de bento con jerarquía de tamaños).
- `.claude/product-catalog.md` — features reales de Ventas/Pedidos, Producción, Stock,
  CRM, Proveedores, Repartidores usadas para fundamentar el copy nuevo y la elección del
  tile hero.

---

## UI Brief

- **Vista de referencia:** `ModulesBento.tsx` actual (mismo archivo, se modifica in situ,
  no se crea una vista nueva).
- **Tipo de layout:** sección de home, grid CSS con `col-span`/`row-span`, sin
  modal/sheet.
- **Componentes clave:** `Card`/`CardHeader`/`CardContent`/`CardTitle`/`CardDescription`
  (shadcn, ya en uso), `AssetPlaceholder` (ya existente, sin cambios en su API — solo
  cambia el tamaño del contenedor que lo envuelve en los tiles hero/medianos),
  `ScrollReveal` (ya en uso).
- **Estados requeridos:** ninguno con fetching — Server Component estático, sin
  loading/error/empty.
- **Mobile:** aplica ya — stack a 1 columna, orden fijo (ver tabla de decisiones).

### Preguntas de confirmación para Jose

Ninguna — el discovery de estas 3 mejoras se completó en el hilo de la ronda de
refinamiento (`landing-proposal.md` §12.3/§12.6/§12.7) y las decisiones de la tabla
arriba son vinculantes. Los únicos puntos abiertos (distribución exacta de
columnas/filas del grid, texto final de copy) son detalle de implementación delegado a
`landing-content-writer`/implementador, no requieren nueva confirmación.

---

## Criterios de aceptación

- [ ] `ModulesBento.tsx` no importa `Fish`, `Package`, `ShoppingCart`, `Sparkle` ni
      `Ticket` de `lucide-react` — cero icon-badge en las 5 tarjetas de módulo.
- [ ] `HowItWorks.tsx` y `TrustBadge.tsx` no se modifican en este GAP (`git diff` sin
      cambios en esos 2 archivos).
- [ ] En desktop (`lg:`), el tile de "Compras y Ventas" ocupa visiblemente más espacio
      (2×2 o equivalente) que el resto — verificable por inspección visual o por las
      clases `col-span-2 row-span-2` (o equivalente) presentes en su contenedor.
- [ ] Existe un 6º tile sin `AssetPlaceholder` con los 3 items (CRM comercial y ofertas /
      Liquidaciones a proveedores / Reparto y autoventa móvil) visibles en el bento.
- [ ] En mobile (`<sm`), los 6 tiles se apilan en una sola columna, tile hero primero,
      tile de cierre al final.
- [ ] `hero.modulesList` en los 3 locales lista exactamente los 5 módulos del bento
      (Producción, Stock, Compras y Ventas, IA, Etiquetas), sin "Trazabilidad" como
      concepto suelto.
- [ ] `grep -ci "trazabilidad\|\blote\b\|caducidad"` sobre `hero.subtitle`,
      `modules.title`, `footer.taglineLine2`, `leadForm.title` (ES) → ya no aparecen ahí
      (se mantienen solo en `modules.production/stock/labels`, donde sí son relevantes).
- [ ] `modules.sales.description` (ES/PT/EN) menciona al menos uno de: previsión,
      documentación automática, rentabilidad — ausente hoy.
- [ ] Paridad de claves verificada entre `es/landing.json`, `pt/landing.json`,
      `en/landing.json` (mismo set de claves en las 3, sin claves huérfanas).
- [ ] `GET /`, `/pt`, `/en` (dominio raíz) devuelven 200 con el bento nuevo renderizado
      correctamente en los 3 idiomas.
- [ ] Cero regresión sobre Fases A–D: subdominio de tenant y `isGenericBranding=true`
      siguen funcionando igual.
- [ ] `npm run type-check` y `npm run lint` limpios.

---

## Archivos a crear o modificar

**Modificar:**
- `src/components/LandingPage/ModulesBento.tsx`
- `src/messages/es/landing.json`, `src/messages/pt/landing.json`, `src/messages/en/landing.json`

**No tocar:**
- `src/components/LandingPage/HowItWorks.tsx`, `TrustBadge.tsx` (cubiertos por GAP-133)
- `src/components/LandingPage/Hero.tsx` (salvo las claves de copy ya listadas, que viven
  en `landing.json`, no en el componente)
- `src/components/LandingPage/IntegratedLonjas.tsx`, `PricingPreview.tsx`,
  `LeadCaptureForm.tsx`, `AssetPlaceholder.tsx`, `ScrollReveal.tsx`
- `src/middleware.ts`, `src/i18n/routing.ts`

---

## Restricciones

- **No añadir assets tipo 3 nuevos** — las 5 ilustraciones del bento ya estaban
  previstas desde B2 (siguen como `AssetPlaceholder` hasta el GAP de assets pendiente);
  este GAP solo cambia el tamaño del contenedor que las envuelve, no genera prompts
  nuevos.
- **No inventar cifras ni certificaciones** en el copy nuevo — regla dura de
  `landing-context.md §5`, aplica igual aquí.
- **No tocar `modules.production/stock/labels`** más allá de lo estrictamente necesario
  — su vocabulario de trazabilidad/lote/caducidad es correcto y se mantiene.
- **Sin scroll horizontal** del bento en ningún breakpoint.
- **Sin dependencias nuevas** — todo se resuelve con CSS Grid nativo de Tailwind.

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

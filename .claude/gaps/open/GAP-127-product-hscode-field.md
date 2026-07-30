# GAP-127 — Código arancelario (hsCode) en catálogo de productos

## Metadata

- **Tipo:** Feature
- **Módulo:** Ventas
- **Prioridad:** Media
- **Estado:** open
- **Fecha:** 2026-07-30
- **Autor:** Jose

---

## Contexto y problema

El backend añade `hsCode: string | null` a `Product` — código arancelario HTSUS (ej.
`"0307520000"`), usado por el Export Packing List (GAP-129) para mostrar el código arancelario
por producto/calibre. Si un producto no tiene `hsCode`, el PDF simplemente omite esa línea (no
bloquea la generación) — no hay validación de negocio que el frontend deba replicar más allá de
la del propio campo de texto.

El catálogo de productos no tiene componente de formulario a medida — es 100% declarativo vía
`EntityClient` (`src/configs/entities/entitiesConfig.catalog.ts`, bloque `products`, líneas
5-268), con un único array `fields` compartido por alta y edición.

## Solución acordada

Añadir una entrada al array `fields` del bloque `products` (tras `boxGtin`, antes de
`a3erp_code`, o donde encaje mejor visualmente junto a los otros códigos del producto):

```javascript
{
  name: 'hsCode',
  label: 'Código arancelario (HS Code)',
  type: 'text',
  placeholder: 'ej. 0307520000',
  validation: {
    pattern: {
      value: '/^[0-9]{6,10}$/',
      message: 'Debe contener entre 6 y 10 dígitos',
    },
  },
  cols: { sm: 6, md: 6, lg: 3, xl: 3 },
},
```

Sin `required` — el campo es opcional (el PDF ya lo trata como opcional).

Añadir también una columna en `table.headers` del mismo bloque (`{ name: 'hsCode', label: 'HS
Code', type: 'text', path: 'hsCode', hideOnMobile: true }`) para que sea visible/filtrable desde
el listado, siguiendo el mismo criterio que otros códigos de producto (`a3erpCode`,
`facilcomCode`) que ya están en la tabla.

No se añade filtro de búsqueda por `hsCode` salvo que Jose lo pida — no está en el checklist del
backend y no hay indicio de que se necesite buscar productos por este código con frecuencia.

---

## UI Brief

- **Vista de referencia:** el propio bloque `products` en `entitiesConfig.catalog.ts` — mismo
  patrón que `articleGtin`/`boxGtin` (campo de texto con `validation.pattern`).
- **Tipo de layout:** campo más dentro del formulario ya existente (`EntityClient` genérico), sin
  layout nuevo.
- **Componentes clave:** ninguno nuevo.
- **Estados requeridos:** los que `EntityClient` ya resuelve.
- **Mobile:** ya cubierto por `EntityClient`.

Sin preguntas de confirmación — cambio de una línea de config, sin ambigüedad.

---

## Referencias e inspiración

- `src/configs/entities/entitiesConfig.catalog.ts`, bloque `products`, campos `articleGtin`/
  `boxGtin` (patrón de `validation.pattern` para códigos) y `a3erp_code`/`facil_com_code` (patrón
  de código corto opcional con `path` distinto del `name` de UI).

## Criterios de aceptación

- [ ] El formulario de alta/edición de producto muestra el campo "Código arancelario (HS Code)",
      opcional.
- [ ] Guardar un producto sin `hsCode` funciona igual que hoy (no se vuelve requerido por error).
- [ ] Guardar un producto con un `hsCode` de formato inválido (letras, menos de 6 dígitos) muestra
      el error de validación del lado del cliente antes de enviar.
- [ ] La columna `HS Code` aparece en el listado de productos (oculta en mobile, igual que otros
      códigos).
- [ ] `npm run type-check` y `npm run lint` limpios.

## Archivos a crear o modificar

**Modificar:**
- `src/configs/entities/entitiesConfig.catalog.ts`

## Restricciones

- No crear componente de formulario a medida para productos — seguir 100% declarativo vía
  `EntityClient`.
- No añadir filtro de búsqueda por `hsCode` en esta entrega.
- No tocar otros campos del bloque `products`.

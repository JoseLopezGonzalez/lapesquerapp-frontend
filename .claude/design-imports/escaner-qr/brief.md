# Design Brief — Escáner QR

Fuente: claude.ai/design — proyecto "Diseño escáner QR Pesquerapp"
(`a8e0d306-989f-43f5-847f-913144610860`, archivo `Escáner QR.dc.html`)
Fecha de importación: 2026-07-10

## Estructura

El prototipo simula un mockup de móvil (390×844) con dos modos intercambiables por prop
(`initialMode`: `boxes` | `locate`), pensados para dos flujos ya existentes en el proyecto:

- **`boxes`** → "Escanear cajas" — mapea a `Step2QRScan` (Autoventa) y `BoxesTab` de
  `MobilePalletView`. Contador corrido de cajas, resultado auto-continua tras ~1s.
- **`locate`** → "Localizar palet" — mapea a `MobileStoreDetailView` (`statusText="Apunta al
  QR del palet"`, `successText="Palet localizado"`). Resultado exige acción explícita ("Abrir
  palet" / "Volver a intentar").

Regiones:
1. Header: botón volver (chevron-left) + título centrado según modo
2. Tarjeta de cámara: viewfinder contenido con "brackets" tipo lente de cámara a los lados,
   línea de escaneo animada en idle, badge de resultado (check/x) en la esquina inferior
   derecha de la tarjeta, halo de color (ring) alrededor de toda la tarjeta en éxito/error
3. Caption bajo la tarjeta: subtítulo en idle, título+subtítulo coloreado en resultado,
   estado especial "Palet completo" cuando se alcanza el total en modo boxes
4. Botones de acción (Cerrar/Seguir escaneando + Volver a intentar/Abrir palet) — solo en
   error, o en éxito del modo `locate`
5. Pill contador de cajas (icono caja + "58 · +12") — solo modo `boxes`, centrado, encima de
   la barra inferior
6. Barra inferior: 3 botones agrupados a la izquierda (galería, linterna, teclado/manual) +
   botón circular grande a la derecha (disparador, simula el escaneo)
7. Hoja inferior de entrada manual: overlay + sheet con handle, título, descripción, un input
   y botón "Añadir"

## Componentes detectados

| Elemento del diseño | Equivalente shadcn/PesquerApp | Notas |
|---|---|---|
| Botón volver (chevron) | icono `ChevronLeft` de `lucide-react` en botón custom, o `Button variant="ghost" size="icon"` | El widget actual usa `X` (cerrar), no back — decisión de mapeo, ver zona gris |
| Tarjeta de cámara con brackets | `div` custom con `border-radius`/`box-shadow` vía tokens, sin componente shadcn dedicado | Los "brackets" tipo lente son puramente decorativos, se puede reproducir con `border` + `rounded` |
| Badge check/x sobre la tarjeta | Icono `Check`/`X` de `lucide-react` en círculo — ya existe patrón similar en `ResultOverlay` actual | Reutilizar, solo reposicionar |
| Botones "Cerrar"/"Volver a intentar" | `Button` shadcn (variant `outline` / default) — ya existe en `ResultOverlay` actual | Fiel, ya es shadcn |
| Pill contador de cajas | `div` con `rounded-full` — el widget actual ya tiene un patrón equivalente (`boxCount`/`sessionCount` pill), solo cambia posición/forma | Adaptar el pill existente, no crear uno nuevo desde cero |
| Botones circulares (galería, linterna, teclado, disparador) | `Button variant="ghost"`/custom `size="icon"` circular con `rounded-full` | Iconos lucide: `Image`/`ImagesIcon`, `Flashlight`/`FlashlightOff`, `Keyboard`, `Scan`/`Camera` |
| Hoja de entrada manual | `Drawer` de `@/components/ui/drawer` (ya usado en el proyecto para bottom sheets mobile) | Sustituye el `Textarea` multilinea actual (que vive fuera del scanner, siempre visible) |
| Input de código manual | `Input` de shadcn dentro del `Drawer` | El diseño solo permite 1 código por envío; el actual permite pegar varios (uno por línea) — ver zona gris |

## Copy / textos

- Título modo boxes: "Escanear cajas" · modo locate: "Localizar palet"
- Subtítulo idle boxes: "Coloca el código dentro del marco. Se añadirá automáticamente."
- Subtítulo idle locate: "Coloca el QR del palet dentro del marco para abrir su ficha."
- Resultado éxito boxes: "Caja registrada" / "Caja {n} de {total} · {peso} kg"
- Resultado error boxes: "Código GS1-128 no reconocido" / "Este formato no corresponde a una
  caja del palet"
- Resultado éxito locate: "Palet #{id} localizado" / "{cámara} · Posición {pos}"
- Resultado error locate: "Código no reconocido" / "No corresponde a ningún palet registrado"
- Estado "Palet completo": "Palet completo" / "{total} de {total} cajas registradas"
- Botones: "Cerrar" · "Seguir escaneando" · "Volver a intentar" · "Abrir palet"
- Sheet manual: "Introducir código manual" + ayuda contextual + placeholder "Ej.
  BRS93658509581" + botón "Añadir"

Todo el copy ya está en español y con terminología coherente con el resto del proyecto
(GS1-128, palet, caja) — se conserva literal.

## Datos que necesita

No introduce entidades nuevas. Reutiliza exactamente los mismos hooks/servicios que ya
alimentan `Step2QRScan`, `BoxesTab` y `MobileStoreDetailView` (`useBarcodeScanner`,
`parseGs1128Line`, `validate` callback de `QrScannerWidget`). El modo `locate` ya tiene su
integración real en `MobileStoreDetailView`; no hace falta backend nuevo.

## Estados no cubiertos por el diseño (inferir del proyecto)

- Cámara iniciando (`!isReady`): el widget actual ya tiene un overlay "Iniciando cámara…" —
  se mantiene, el mockup no lo contempla (es estático)
- Error de permiso de cámara (`onError`): el widget actual lo delega al padre vía `notify.error`
  — se mantiene igual, el mockup no lo contempla
- Detección múltiple de códigos en el mismo frame: el widget actual lo soporta
  (`MultipleDetectionOverlay` + hint pill) — el mockup no lo contempla porque simula un único
  tap. Ver zona gris: hay que decidir si se conserva
- Torch no soportado por el dispositivo/navegador (iOS Safari no expone control programático
  fiable): no hay fallback en el mockup — necesita decisión de implementación

## Zona gris — decisiones confirmadas por Jose (2026-07-10)

1. **Layout de cámara → tarjeta contenida (fiel al mockup).** Se adopta el layout exacto del
   diseño: cámara en tarjeta ~330×402 con brackets tipo lente, cabecera fija con botón volver
   (`ChevronLeft`) y barra inferior fija. Se abandona el modelo actual de cámara a pantalla
   completa. Implicación técnica: el flujo de detección en vivo (`useBarcodeScanner`) sigue
   operando sobre el `<video>`, pero el elemento de vídeo ahora vive dentro de un contenedor
   `overflow:hidden` con `object-fit:cover` del tamaño de la tarjeta, no a pantalla completa —
   revisar que `mapToDisplay`/`DetectionOverlay` (coordenadas del código sobre el vídeo) se
   recalculen correctamente con el nuevo tamaño reducido del contenedor.

2. **Interacción de captura → híbrida (detección en vivo + disparador).** Se mantiene
   `useBarcodeScanner` con tracking en vivo real (no se elimina `DetectionOverlay` ni el
   overlay de código detectado). El botón circular grande del diseño (esquina inferior derecha
   de la barra) sustituye visualmente al pill "Leer código" actual: mismo trigger
   (`handleConfirm`), nuevo estilo/posición. Estado visual del botón:
   - Sin código detectado en encuadre: atenuado/inactivo (no dispara nada al pulsar, o dispara
     un intento de lectura del frame actual sin resultado si no hay código — a definir en
     implementación, pero nunca debe parecer roto)
   - Código detectado: iluminado/con énfasis (equivalente al estado que hoy activa el pill),
     tap = confirmar lectura

3. **Funciones nuevas → ambas dentro de alcance.**
   - **Linterna (torch):** `MediaStreamTrack.applyConstraints({ advanced: [{ torch: true }] })`
     sobre el track de vídeo activo. Detectar soporte vía
     `track.getCapabilities?.().torch` antes de mostrar el botón — si no está soportado
     (iOS Safari, la mayoría de casos), el botón de linterna no se renderiza (no se muestra
     deshabilitado, se omite del layout para no prometer una función que no funcionará).
   - **Galería (subir foto):** `<input type="file" accept="image/*" capture="environment">`
     oculto, activado por el icono de galería. La imagen se decodifica con el mismo backend
     activo (`barcode-detector` vía `BarcodeDetector` de una `ImageBitmap`, o `zbar-wasm`
     sobre los datos de imagen) — reutilizar la lógica de decodificación ya existente en
     `useBarcodeScanner`, exponer una función `decodeImage(file)` adicional en el hook en vez
     de duplicar lógica de detección.

## Alcance de implementación

Todo lo anterior se implementa en el **widget compartido** `QrScannerWidget`
(`src/components/Shared/QrScannerWidget/index.tsx`) — afecta a los 5 consumidores actuales
(`Step2QRScan`, `MobileStoreDetailView`, `MobileStoreListView`, `MobilePalletView`,
`EliminarTab`). El foco de detalle adicional pedido por Jose ("se centra en el de lectura de
cajas") aplica al **modo `boxes`**: el pill contador de cajas, el estado "Palet completo", y
la integración de la hoja de entrada manual dentro del propio widget (hoy el equivalente en
`Step2QRScan` es un `Textarea` de pegado múltiple, siempre externo al scanner y oculto en
mobile en producción — `${isDev ? 'block' : 'hidden md:block'}`). Esa `Textarea` de pegado
masivo **se conserva** para el flujo desktop/dev de pegar varios códigos a la vez; el nuevo
`Drawer` de código único del diseño es una capacidad **adicional**, pensada para mobile real,
no un reemplazo.

El modo `locate` (ya integrado en `MobileStoreDetailView`) hereda automáticamente todos los
cambios de chrome del widget compartido (cabecera, tarjeta de cámara, disparador, linterna,
galería), pero no requiere cambios propios adicionales — su flujo de resultado (botones
"Volver a intentar" / "Abrir palet") ya existe.


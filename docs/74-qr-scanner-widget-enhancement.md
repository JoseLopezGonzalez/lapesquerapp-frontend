# 74 — QrScannerWidget: Rediseño del Lector de QR

> **Estado:** En diseño — pendiente de implementación  
> **Rama:** `claude/qr-reader-enhancement-rbq3t1`  
> **Afecta a:** módulos Almacén, Palets, Autoventa (Field + Comercial)

---

## Problema que resuelve

El lector de QR actual opera en modo **always-on**: desde el momento en que el usuario abre el escáner, la cámara procesa frames continuamente. El único mecanismo anti-duplicados es un debounce de 1800-3000 ms. Esto produce:

- Lecturas accidentales cuando el usuario aún está apuntando
- Sin distinción visual entre "apuntando", "leyendo activamente" y "código detectado"
- Dos componentes scanner paralelos (`Step2CameraScanner.js` y `MobilePalletQrScanner.tsx`) con lógica idéntica sin unificar

El objetivo es simular el comportamiento de un lector físico de pistola: el usuario **decide conscientemente** cuándo ejecutar la lectura pulsando un botón ("gatillo"), y recibe feedback visual claro de cada fase.

---

## Decisiones de diseño

| Pregunta | Decisión | Razonamiento |
|---|---|---|
| ¿Librería base? | Mantener `@yudiel/react-qr-scanner` | Ya instalada, soporta `paused` prop, wrapper de `@zxing` |
| ¿Construir desde cero? | No | `BarcodeDetector` API tiene soporte inconsistente; `jsQR` sin mantenimiento |
| ¿Auto-confirm o confirmación explícita? | **Auto-confirm por defecto** (`autoConfirm={true}`) | El usuario ya tomó la decisión al pulsar "Leer". Fluidez operativa |
| ¿Confirmación manual disponible? | Sí, via prop `autoConfirm={false}` | Para contextos donde el código debe validarse visualmente antes de aceptar |
| ¿Pantalla completa o modal overlay? | **Pantalla completa** (como ahora) | Más seguro en móvil, maximiza área de cámara |
| ¿Unificar formatos QR + barcode? | Prop `formats` expuesta, `['qr_code']` por defecto | Permite reutilizar para GS1-128 en el futuro sin cambiar la API |
| ¿Animaciones con Framer Motion? | No — solo Tailwind keyframes | CLAUDE.md prohíbe Framer Motion en pantallas operativas |

---

## State machine: 3 estados

```
        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
   ┌─────────┐   pulsa "Leer QR"   ┌───────────┐   detecta   ┌──────────┐
   │  IDLE   │ ──────────────────▶ │ SCANNING  │ ──────────▶ │ DETECTED │
   └─────────┘                     └───────────┘             └──────────┘
        ▲                               │                          │
        │                               │ onError / onClose        │ auto-confirm
        │                               ▼                          │ (o usuario confirma)
        │                           [cerrar]                       │
        │                                                          ▼
        └───────────────────────── "Volver a intentar" ────── onScan(value)
```

### Estado IDLE — "Apuntando"

- Cámara visible, `paused={true}` en la librería (no procesa frames, solo muestra video)
- Corner guides estáticos en el viewfinder (4 esquinas tipo cámara iOS)
- Barra inferior: botón `"Leer QR"` prominente (full-width, tamaño `lg`)
- Texto instruccional: `statusText` prop o fallback genérico

### Estado SCANNING — "Buscando código"

- Cámara activa, `paused={false}`, procesando frames
- Scan line animada atravesando el viewfinder verticalmente (Tailwind `animate-[scan]`)
- Borde del viewfinder pulsa en `--primary` (`animate-pulse`)
- Texto: "Buscando código..."
- Botón secundario pequeño: "Cancelar" (vuelve a IDLE)

### Estado DETECTED — "Código encontrado"

- Librería vuelve a `paused={true}` inmediatamente al detectar
- Flash verde breve en viewfinder (transición CSS `bg-green-500/20` → transparente, ~400ms)
- Icono checkmark animado sobre el viewfinder
- Si `autoConfirm={true}`: llama a `onScan(value)` directamente (el flash es el único feedback)
- Si `autoConfirm={false}`: barra inferior muestra valor detectado + botones "Confirmar" / "Volver a intentar"

---

## Diseño visual del viewfinder

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│    ┌──                                        ──┐        │
│    │  ← corner guides SVG (4 esquinas)          │        │
│    │                                            │        │
│    │              [zona QR]                     │        │
│    │                                            │        │
│    │  ─────────── scan line ──────────────────  │  ← solo en SCANNING
│    │                                            │        │
│    └──                                        ──┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Corner guides:** SVG inline, 4 esquinas con `stroke="currentColor"` en `text-primary`. Sin dependencias extra.

**Scan line:** `div` absoluto con `animation: scanLine 1.5s ease-in-out infinite`.

```css
@keyframes scanLine {
  0%   { transform: translateY(0); opacity: 1; }
  50%  { opacity: 0.6; }
  100% { transform: translateY(100%); opacity: 1; }
}
```

**Flash verde (DETECTED):** Clase condicional `bg-green-500/20` con `transition-all duration-400` en el contenedor del viewfinder.

---

## API del componente

```typescript
interface QrScannerWidgetProps {
  onScan: (rawValue: string) => void;
  onClose: () => void;
  onError?: (message: string) => void;
  statusText?: string;           // Label informativo en barra inferior
  formats?: ScannerProps['formats']; // default: ['qr_code']
  autoConfirm?: boolean;         // default: true
  scanDelay?: number;            // default: 200 (más agresivo, el debounce es ahora el botón)
}
```

> **Nota sobre `scanDelay`:** Con el modelo press-to-scan, el debounce manual (1800-3000ms) es innecesario. El usuario controla el timing con el botón. Se puede bajar a 200ms para detectar más rápido en SCANNING.

---

## Estructura de archivos

```
src/components/Shared/QrScannerWidget/
├── index.tsx                 ← export principal + state machine
└── ScannerViewfinder.tsx     ← viewfinder + corner guides + scan line + flash
```

**Localización:** `Shared/` porque lo usan múltiples roles (Almacén, Palets, Field, Comercial).

---

## Plan de migración

Una vez creado `QrScannerWidget`, sustituir en estos 5 puntos de consumo:

| Archivo | Componente actual | Acción |
|---|---|---|
| `src/components/Admin/Pallets/PalletDialog/MobilePalletView/ScanTab.tsx` | `Step2CameraScanner` | Reemplazar import |
| `src/components/Admin/Pallets/PalletDialog/MobilePalletView/EliminarTab.tsx` | `Step2CameraScanner` | Reemplazar import |
| `src/components/Admin/Stores/Mobile/MobileStoreListView.tsx` | `MobilePalletQrScanner` | Reemplazar import |
| `src/components/Admin/Stores/Mobile/MobileStoreDetailView.tsx` | `MobilePalletQrScanner` | Reemplazar import |
| `src/components/Comercial/Autoventa/Step2QRScan/index.js` | `Step2CameraScanner` | Reemplazar import + migrar a `.tsx` |

Tras la migración completa:
- Eliminar `src/components/Comercial/Autoventa/Step2CameraScanner.js`
- Eliminar `src/components/Admin/Stores/Mobile/MobilePalletQrScanner.tsx`
- Migrar `Step2QRScan/index.js` → `.tsx` (regla de oro 3: JS legacy al tocar)

---

## Prop `statusText` por contexto de uso

| Contexto | `statusText` |
|---|---|
| Palets — añadir caja | `"Apunta al código GS1-128 de la caja"` |
| Palets — eliminar caja | `"Apunta al código GS1-128 de la caja a eliminar"` |
| Almacén — localizar palet | `"Apunta al QR del palet"` |
| Autoventa — añadir caja | `"Apunta al código de la caja"` |

---

## Pendiente de decidir / afinar

- [ ] ¿Los corner guides ocupan toda la pantalla o tienen un recuadro centrado fijo (ej. 280×280px)?
- [ ] ¿El botón "Leer QR" es solo texto + icono, o incluye algún efecto visual (ej. borde pulsante en idle)?
- [ ] ¿En modo `autoConfirm={false}`, mostrar el valor raw o una versión legible (ej. "Caja: GTIN…")?
- [ ] ¿El estado SCANNING tiene un timeout (ej. 8s sin detección → vuelve a IDLE con mensaje)?
- [ ] ¿La scan line es horizontal (clásica) o se adapta a los corner guides (recorre el recuadro interior)?

---

## Archivos relacionados

- `src/lib/qr/parseQrPayload.ts` — parser de payloads QR internos
- `src/lib/gs1128Parser.js` — parser de códigos GS1-128 de cajas
- `docs/73-sistema-payloads-qr.md` — especificación del formato de payload QR

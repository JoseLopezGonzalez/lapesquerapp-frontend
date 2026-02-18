# CMR — Layout para desarrollo

Referencia: [Documento de transporte (CMR)_2440 (1).pdf](../CMR-to-do/Documento%20de%20transporte%20(CMR)_2440%20(1).pdf)

## Cabecera (una fila, tres zonas)

| Zona       | Contenido |
|-----------|-----------|
| Izquierda | Cuadrado rojo con número de copia (1–4) + "Ejemplar para el remitente" / "Copy for sender" (y variantes por copia). |
| Centro    | Cuadrado rojo con "X" + "C.M.R." + "Marque el que proceda". |
| Derecha   | "DOCUMENTO DE CONTROL" + texto legal (CMR/2004/…) + "No #…" (número de documento). Caja con texto Convenio CMR (ES/EN), bordes rojos. |

## Cuerpo: dos columnas

### Columna izquierda (orden DOM)

- **1** Remitente — caja alta.
- **2** Destinatario
- **3** Lugar de entrega
- **4** Lugar y fecha de recepción (dos zonas: lugar | fecha)
- **5** Documentos anexos
- **Fila 6–9**: Marcas y nos | Nº bultos | Clase de embalaje | Naturaleza
- **Tabla** bajo 6–9: PALETS/LOADED BY SENDER, CHIFFRE, LETTRE, DEVUELTOS, NO DEVUELTOS
- **13** Instrucciones del remitente
- **14** Forma de pago
- **21** Establecido en (lugar | fecha)
- **22** Firma y sello del remitente

### Columna derecha (orden DOM)

- Caja legal CMR (CARTA DE PORTE INTERNACIONAL + texto convenio)
- **16** Porteador
- **17** Porteadores sucesivos
- **17 Bis** Referencia Transportista (tabla: Distancia, Km, MATRICULA, Vehículo, Remolque)
- **18** Reservas y observaciones
- Tablas ADR / Temperatura controlada + "Documentos anexos y/o precisiones concretas"
- **Fila 10–12**: No. Estadístico | Peso bruto Kg | Volumen m3
- **19** Estipulaciones particulares
- **20** A pagar por (tabla: conceptos × Remitente / Modena / Consignatario)
- **15** Reembolso (COD) — checkbox
- **23** Firma y sello del transportista
- **24** Recibo de la mercancía (Lugar, fecha, Firma consignatario)

## Estilos

- Número de casilla: cuadrado rojo (`var(--cmr-color)`), etiqueta en negro (ES; EN debajo si aplica).
- Zona de valor: fondo gris claro.
- Bordes de celdas y secciones: rojo.
- Tipografía sans-serif (Arial o similar).

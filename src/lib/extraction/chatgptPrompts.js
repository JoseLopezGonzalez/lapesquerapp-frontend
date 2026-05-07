/**
 * Prompts de extracción para ChatGPT por tipo de documento de lonja.
 *
 * Cada entrada define el system prompt y una función que genera el user prompt
 * con el schema JSON exacto que debe devolver el modelo.
 */

const SYSTEM_PROMPT =
    'Eres un extractor de datos de documentos de lonja de pesca. ' +
    'Extraes datos exactos del documento tal como aparecen, sin inventar ni completar información ausente. ' +
    'Devuelves únicamente JSON válido sin texto adicional, sin bloques de código markdown, sin explicaciones.';

export const CHATGPT_EXTRACTION_PROMPTS = {
    albaranCofradiaPescadoresSantoCristoDelMar: {
        systemPrompt: SYSTEM_PROMPT,
        userPromptTemplate: (filename) =>
            `Extrae todos los datos del siguiente albarán de Cofradía de Pescadores (archivo: ${filename}).

El JSON de respuesta debe tener exactamente esta estructura (usa null para campos no presentes en el documento, los números deben ser tipo number —no string—, las fechas en formato yyyy-MM-dd):

{
  "detalles": {
    "lonja": string,
    "cifLonja": string | null,
    "numero": string,
    "fecha": string,
    "ejercicio": string | null,
    "comprador": string | null,
    "numeroComprador": string | null,
    "cifComprador": string | null,
    "importeTotal": number | null
  },
  "tablas": {
    "subastas": [
      {
        "cajas": number,
        "tipoCaja": string | null,
        "kilos": number,
        "pescado": string,
        "cod": string | null,
        "barco": string,
        "armador": string | null,
        "cifArmador": string | null,
        "precio": number,
        "importe": number
      }
    ],
    "servicios": [
      {
        "codigo": string | null,
        "descripcion": string,
        "fecha": string | null,
        "iva": number,
        "rec": number | null,
        "unidades": number,
        "precio": number,
        "importe": number
      }
    ]
  },
  "subtotales": {
    "pesca": { "subtotal": number, "iva": number, "total": number },
    "servicios": { "subtotal": number, "iva": number, "total": number },
    "cajas": { "subtotal": number, "iva": number, "total": number }
  }
}

Si una tabla (subastas, servicios) no tiene filas, devuelve un array vacío [].
Si los subtotales no aparecen en el documento, devuelve 0 en todos sus campos numéricos.`,
    },

    listadoComprasLonjaDeIsla: {
        systemPrompt: SYSTEM_PROMPT,
        userPromptTemplate: (filename) =>
            `Extrae todos los datos del siguiente listado de compras de Lonja de Isla (archivo: ${filename}).

REGLAS CRÍTICAS — aplícalas antes de extraer cualquier dato:

REGLA 1 — Identificar kilos, precio e importe en la tabla ventas:
Las columnas son siempre: Venta | Barco | Especie | Cajas | Kilos | Precio | Importe | Nrsi.

El PDF a veces parte el nombre del barco o de la especie en dos líneas. Cuando esto ocurre, el extractor de texto intercala un número numérico DENTRO del texto del nombre. Este número desplazado es SIEMPRE el PRECIO. Sigue este proceso para cada fila:

PASO 1 — Identifica NRSI (texto final como "12.010500/H", puede ser null) e IMPORTE (último número).

PASO 2 — Detecta si la fila tiene nombre partido: ¿hay algún número con decimales intercalado EN MEDIO del texto del barco o la especie? (es decir, texto → número → más texto que pertenece al mismo nombre)

CASO A — Fila sin nombre partido (todos los números aparecen DESPUÉS de la especie):
  El orden de izquierda a derecha es el correcto: cajas, kilos, precio, importe.
  Leyendo de derecha a izquierda: importe ← precio ← kilos ← cajas.
  Ejemplos reales de este documento:
    "CF-RUPERTIN  RASCACIOS/ESCORPORA  1  6.64  3.55  23.57" → kilos=6.64, precio=3.55, importe=23.57
    "CF-N.ESTRELLA POLAR  BRECA PEQUEÑA  1  4.72  2.45  11.56" → kilos=4.72, precio=2.45, importe=11.56
    "PI-JAVI CALE  GAMBAS  1  5.34  6.90  36.85" → kilos=5.34, precio=6.90, importe=36.85

CASO B — Fila con nombre partido (hay un número intercalado en medio del nombre):
  El número intercalado entre las dos partes del nombre = PRECIO.
  El número que aparece DESPUÉS del nombre completo (justo antes del importe) = KILOS.
  Ejemplos reales de este documento (extraídos tal cual del PDF):
    "CF-N.ESTRELLA POLAR  BROTOLA DE FANGO / BROTOLA DE  1  8.90  FANGO  1.76  15.66"
      → precio=8.90 (intercalado), kilos=1.76 (después del nombre), importe=15.66
      Verificación: 1.76×8.90=15.66 ✓
    "CF-HNOS CORDERO  CAÑAILLAS  1  28.00  GIL  CAÑAILLAS/CAÑAILLA  3.22  90.16"
      → precio=28.00 (intercalado entre "CORDERO" y "GIL"), kilos=3.22, importe=90.16
      Verificación: 3.22×28.00=90.16 ✓
    "CF-HNOS DIAZ  CHOCOS  2  7.20  VAZQUEZ  CHOCOS/CHOCO  22.70  163.44"
      → precio=7.20 (intercalado), kilos=22.70, importe=163.44
      Verificación: 22.70×7.20=163.44 ✓
    "CF-HNOS VAZQUEZ  PULPOS  1  11.60  MASC  PULPOS/PULPO ROQUERO  6.48  75.17"
      → precio=11.60 (intercalado), kilos=6.48, importe=75.17
      Verificación: 6.48×11.60=75.17 ✓
    "CF-MATEUUSZ  CANGREJO AZUL  1  8.00  KOZLOWSK  CANGREJO AZUL  4.52  36.16"
      → precio=8.00 (intercalado), kilos=4.52, importe=36.16
      Verificación: 4.52×8.00=36.16 ✓

PASO 3 — Verificación obligatoria: round(kilos × precio, 2) = importe.
  Si no cuadra, es que no has identificado correctamente el CASO A o CASO B.
  El entero sin decimales adyacente al bloque de especie = CAJAS.

REGLA 2 — Nombres que continúan en línea siguiente (vendidurias):
Si el nombre de una vendiduria se corta y continúa en la línea siguiente (ej: "PESCADOS DE ISLA CRISTINA" + "S.L."), únelo en un solo string.

REGLA 3 — Campo "cod" en vendidurias:
En la tabla vendidurias, el campo "cod" es el prefijo de 2 letras que identifica la vendiduria (ej: "CF", "EX", "PI"). Es la primera palabra del nombre de la vendiduria. Si el nombre en el documento es "CF PESCADOS DE ISLA CRISTINA S.L.", entonces cod="CF" y vendiduria="CF PESCADOS DE ISLA CRISTINA S.L.".

REGLA 4 — Tablas resumen al final del documento, diseño a dos columnas y saltos de página:
Las tablas resumen ("peces", "vendidurias", "cajas", "tipoVentas") aparecen al final de la tabla de ventas, generalmente en la última página o en las dos últimas. El diseño habitual es dos columnas en la misma página (por ejemplo "Peces" a la izquierda y "Cajas" a la derecha). Cuando no caben en una sola página, continúan en la página siguiente SIN repetir la cabecera. Reglas:
- Extrae TODAS las filas de todas las páginas para cada tabla y añádelas al mismo array.
- Si en la página siguiente aparecen filas con la misma estructura que la tabla anterior pero sin título, son la continuación de esa tabla.
- La fila de TOTAL que cierra cada tabla (solo números, sin FAO ni descripción, p.ej. "20 817,34") NO es un dato individual: no la incluyas en ningún array.
- Si la cabecera se repite al inicio de una página nueva, no la incluyas como fila de datos.

REGLA 5 — Tabla "ventas" multipágina:
La tabla de ventas es el cuerpo principal y puede ocupar muchas páginas. Extrae TODAS las filas sin excepción. No te detengas al encontrar tablas resumen intercaladas ni en los saltos de página.

REGLA 6 — Mapeo de títulos del documento a campos del JSON:
Usa el título de cada sección para identificar a qué array pertenece. Las columnas exactas de cada tabla son:
- Título "Peces" → array \`peces\`. Columnas: FAO (3 letras mayúsculas) | Descripción | Kilos | Cajas | P.Med | Importe. El campo P.Med (precio medio) NO existe en el esquema: ignóralo.
- Título "Compras por Vendeduría" o "Compras por Vendeduria" → array \`vendidurias\`. Columnas: Cod (2 letras) + Nombre | Kilos | Cajas | Importe. Las 2 primeras letras del nombre (CF, EX, PI…) son el campo \`cod\`.
- Título "Cajas" → array \`cajas\`. Columnas: Descripción | Cajas | Importe.
- Título "TipoSubasta", "Tipo Subasta" o similar → array \`tipoVentas\`. Columnas: Descripción | Cajas | Importe.

REGLA 7 — Tabla Peces: filas con descripción en varias líneas:
En la tabla Peces el código FAO es siempre exactamente 3 letras mayúsculas (CBC, DPS, PAC, ARA, NEP, SNQ, ARS, NIS, TGS, CTR…). Cuando la descripción de una especie es larga y ocupa dos líneas, la extracción de texto del PDF desordena los datos. Ejemplo real de este documento:
  Texto extraído: "LANGOSTINO 1\nMORUNO\nARS 1,42 13,50 19,17"
  Fila correcta: fao="ARS", descripcion="LANGOSTINO MORUNO", kilos=1.42, cajas=1, importe=19.17
  (El "1" tras "LANGOSTINO" es el valor de Cajas; "ARS" es el FAO desplazado a la línea siguiente)
Para reconstruir la fila usa el código FAO de 3 letras como ancla: todo el texto que precede al FAO en ese bloque (excluyendo el número de Cajas) es la descripción. Los números que siguen al FAO son Kilos, Cajas (si no apareció antes), P.Med e Importe.

El JSON de respuesta debe tener exactamente esta estructura (usa null para campos no presentes en el documento, los números deben ser tipo number —no string—, las fechas en formato yyyy-MM-dd):

{
  "details": {
    "lonja": string,
    "fecha": string,
    "cifComprador": string | null,
    "comprador": string | null,
    "numeroComprador": string | null,
    "importeTotal": number | null
  },
  "tables": {
    "ventas": [
      {
        "venta": string,
        "barco": string,
        "matricula": string | null,
        "cajas": number,
        "especie": string,
        "kilos": number,
        "precio": number,
        "importe": number,
        "nrsi": string | null
      }
    ],
    "peces": [
      {
        "fao": string,
        "descripcion": string,
        "cajas": number | null,
        "kilos": number,
        "importe": number
      }
    ],
    "vendidurias": [
      {
        "cod": string,
        "vendiduria": string,
        "cajas": number,
        "kilos": number,
        "importe": number
      }
    ],
    "cajas": [
      {
        "descripcion": string,
        "cajas": number,
        "importe": number | null
      }
    ],
    "tipoVentas": [
      {
        "cod": string | null,
        "descripcion": string,
        "cajas": number,
        "importe": number | null
      }
    ]
  }
}

Si una tabla no aparece en el documento, devuelve un array vacío [].
La tabla "ventas" es obligatoria y debe tener al menos una fila.`,
    },

    listadoComprasAsocArmadoresPuntaDelMoral: {
        systemPrompt: SYSTEM_PROMPT,
        userPromptTemplate: (filename) =>
            `Extrae todos los datos del siguiente listado de compras de la Asociación de Armadores de Punta del Moral (archivo: ${filename}).

El JSON de respuesta debe tener exactamente esta estructura (usa null para campos no presentes en el documento, los números deben ser tipo number —no string—, las fechas en formato yyyy-MM-dd):

{
  "details": {
    "lonja": string,
    "fecha": string,
    "tipoSubasta": string,
    "cifComprador": string | null,
    "comprador": string | null,
    "importeTotal": number | null
  },
  "tables": {
    "subastas": [
      {
        "barco": string,
        "matricula": string | null,
        "cajas": number,
        "especie": string,
        "pesoNeto": number,
        "precio": number,
        "importe": number
      }
    ]
  }
}

La tabla "subastas" es obligatoria y debe tener al menos una fila.
Si "tipoSubasta" no aparece claramente en el documento, usa "SUBASTA".`,
    },
};

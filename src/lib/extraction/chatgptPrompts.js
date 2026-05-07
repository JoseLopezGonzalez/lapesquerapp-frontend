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

REGLA 1 — Distinguir kilos vs precio en la tabla ventas:
Las columnas de esa tabla son siempre: Venta | Barco | Especie | Cajas | Kilos | Precio | Importe | Nrsi.
Cuando la especie ocupa dos líneas en el PDF, el texto extraído puede mostrar los números fuera de orden. Para identificar correctamente cuál es kilos y cuál es precio usa esta fórmula:
  round(Kilos × Precio, 2) = Importe
Comprueba la fórmula en todas las filas. Si no cuadra con el orden del texto, intercambia kilos y precio hasta que cuadre.

Ejemplos reales de este documento donde el orden del texto engaña:

  Fila 1570: el texto del PDF muestra "...1 43.00 LANGOSTINO MEDITERRANEO 1.16 49.88"
    cajas=1, kilos=1.16, precio=43.00, importe=49.88
    (43.00 aparece primero en el texto pero es PRECIO; 1.16 son los KILOS: 1.16×43.00=49.88 ✓)

  Fila 2009: texto "...1 11.10 ROJA DEL MEDITERRANEO 2.04 22.64"
    cajas=1, kilos=2.04, precio=11.10, importe=22.64 (2.04×11.10=22.644≈22.64 ✓)

  Fila 1996: texto "...1 29.00 QUISQUILLAS 1.24 35.96"
    cajas=1, kilos=1.24, precio=29.00, importe=35.96 (1.24×29.00=35.96 ✓)

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

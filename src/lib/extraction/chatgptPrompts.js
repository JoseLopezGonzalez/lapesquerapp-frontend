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

REGLA 1 — Campo "especie" en la tabla ventas:
Copia el texto EXACTAMENTE como aparece en el documento. No completes, no traduzcas, no añadas palabras que no estén escritas. El formato habitual es "{código} {nombre} / {variante}". Cuando el nombre es largo y continúa en la línea siguiente del PDF, únelo en un solo string sin salto de línea ni palabras extra.
  MAL (inventado): "62 LANGOSTINOS / LANGOSTINO OCCIDENTAL"
  BIEN (copiado): "62 LANGOSTINOS / LANGOSTINO O LANGOSTINO MEDITERRANEO"

REGLA 2 — Distinguir kilos vs precio en la tabla ventas:
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

REGLA 3 — Nombres que continúan en línea siguiente (vendidurias):
Si el nombre de una vendiduria se corta y continúa en la línea siguiente (ej: "PESCADOS DE ISLA CRISTINA" + "S.L."), únelo en un solo string.

REGLA 4 — tipoVentas:
Pon siempre "tipoVentas": []. No extraigas ni proceses esa sección.

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
    "tipoVentas": []
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

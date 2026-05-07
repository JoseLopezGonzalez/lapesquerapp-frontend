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

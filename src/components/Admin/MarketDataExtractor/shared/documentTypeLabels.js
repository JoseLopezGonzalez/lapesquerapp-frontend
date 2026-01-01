/**
 * Mapeo de tipos de documento internos a etiquetas legibles
 */
export const DOCUMENT_TYPE_LABELS = {
    'albaranCofradiaPescadoresSantoCristoDelMar': 'Albarán - Cofradía Pescadores Santo Cristo del Mar',
    'listadoComprasLonjaDeIsla': 'Listado de compras - Lonja de Isla',
    'listadoComprasAsocArmadoresPuntaDelMoral': 'Listado de compras - Asoc. Armadores Punta del Moral',
};

/**
 * Obtiene la etiqueta legible para un tipo de documento
 * @param {string} documentType - Tipo de documento interno
 * @returns {string} Etiqueta legible o el tipo original si no se encuentra
 */
export function getDocumentTypeLabel(documentType) {
    return DOCUMENT_TYPE_LABELS[documentType] || documentType || 'Sin tipo seleccionado';
}


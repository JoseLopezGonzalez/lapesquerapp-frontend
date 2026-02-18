/**
 * CMR Manual — modelo de datos (casillas 1–24).
 * @typedef {Object} CmrData
 * @property {string} sender - 1. Remitente
 * @property {string} consignee - 2. Destinatario / consignatario
 * @property {string} placeOfDelivery - 3. Lugar de entrega
 * @property {string} placeAndDateOfReceiptOrLoad - 4. Lugar y fecha de recepción/carga
 * @property {string} attachedDocuments - 5. Documentos anexos
 * @property {string} marksAndNumbers - 6. Marcas y números
 * @property {number} numberOfPackages - 7. Nº de bultos
 * @property {string} methodOfPacking - 8. Método de embalaje
 * @property {string} natureOfGoods - 9. Naturaleza de la mercancía
 * @property {number} grossWeight - 11. Peso bruto (kg)
 * @property {string} volume - 12. Volumen
 * @property {string} senderInstructions - 13. Instrucciones del remitente
 * @property {string} methodOfPayment - 14. Forma de pago
 * @property {string} carrier - 16. Porteador
 * @property {string} successiveCarriers - 17. Porteadores sucesivos
 * @property {string} reservationsOrObservations - 18. Reservas y observaciones
 * @property {string} specialAgreements - 19. Estipulaciones particulares
 * @property {string} payableBy - 20. A pagar por
 * @property {string} placeAndDate - 21. Lugar y fecha
 * @property {string} senderSignature - 22. Espacio remitente
 * @property {string} carrierSignature - 23. Espacio transportista
 * @property {string} consigneeSignature - 24. Espacio consignatario
 * @property {string} [documentNumber] - Número de documento (ej. 02440) para cabecera "No #"
 */

/** @type {CmrData} */
export const defaultCmrData = {
  documentNumber: '',
  sender: '',
  consignee: '',
  placeOfDelivery: '',
  placeAndDateOfReceiptOrLoad: '',
  attachedDocuments: '',
  marksAndNumbers: '',
  numberOfPackages: 0,
  methodOfPacking: '',
  natureOfGoods: '',
  grossWeight: 0,
  volume: '',
  senderInstructions: '',
  methodOfPayment: '',
  carrier: '',
  successiveCarriers: '',
  reservationsOrObservations: '',
  specialAgreements: '',
  payableBy: '',
  placeAndDate: '',
  senderSignature: '',
  carrierSignature: '',
  consigneeSignature: '',
};

/**
 * Una línea de producto en el CMR (casillas 6–12).
 * @typedef {Object} CmrProductLine
 * @property {string} marksAndNumbers - 6. Marcas y números
 * @property {number} numberOfPackages - 7. Nº de bultos
 * @property {string} methodOfPacking - 8. Método de embalaje
 * @property {string} natureOfGoods - 9. Naturaleza de la mercancía
 * @property {string} statisticalNumber - 10. No. Estadístico
 * @property {number} grossWeight - 11. Peso bruto (kg)
 * @property {string} volume - 12. Volumen
 */

/**
 * CMR Manual — modelo de datos (casillas 1–24).
 * @typedef {Object} CmrData
 * @property {string} sender - 1. Remitente
 * @property {string} consignee - 2. Destinatario / consignatario
 * @property {string} placeOfDelivery - 3. Lugar de entrega
 * @property {string} placeAndDateOfReceiptOrLoad - 4. Lugar y fecha de recepción/carga
 * @property {string} attachedDocuments - 5. Documentos anexos
 * @property {string} [marksAndNumbers] - 6. (legacy; usar productLines)
 * @property {number} [numberOfPackages] - 7. (legacy)
 * @property {string} [methodOfPacking] - 8. (legacy)
 * @property {string} [natureOfGoods] - 9. (legacy)
 * @property {number} [grossWeight] - 11. (legacy)
 * @property {string} [volume] - 12. (legacy)
 * @property {CmrProductLine[]} [productLines] - Líneas de producto (casillas 6–12): 6 Marcas, 7 Bultos, 8 Embalaje, 9 Naturaleza, 10 Estadístico, 11 Peso kg, 12 Volumen
 * @property {string} senderInstructions - 13. Instrucciones del remitente
 * @property {string} methodOfPayment - 14. Forma de pago
 * @property {string} carrier - 16. Porteador
 * @property {string} successiveCarriers - 17. Porteadores sucesivos
 * @property {string} reservationsOrObservations - 18. Reservas y observaciones
 * @property {string} specialAgreements - 19. Estipulaciones particulares
 * @property {string} [payableBy] - 20. A pagar por (texto libre; ver payment20 para tabla)
 * @property {string[][]} [payment20] - 20. Tabla A pagar por: 6 filas × 6 celdas (Remitente×2, Modena×2, Consignatario×2)
 * @property {string} placeAndDate - 21. Lugar y fecha
 * @property {string} senderSignature - 22. Espacio remitente
 * @property {string} carrierSignature - 23. Espacio transportista
 * @property {string} consigneeSignature - 24. Espacio consignatario
 * @property {string} [documentNumber] - Número de documento (ej. 02440) para cabecera "No #"
 * @property {string} [distance] - Distancia del transporte (17 Bis, se muestra como "valor Km")
 * @property {string} [vehicleRegistration] - Matrícula vehículo (17 Bis)
 * @property {string} [trailerRegistration] - Matrícula remolque o semiremolque (17 Bis)
 * @property {string} [controlledTemperature] - Temperatura controlada (se muestra con sufijo ºC en sección transporte temperatura)
 * @property {string[]} [palletsPallets] - Palets: 5 valores (Cargados por remitente, Remesas al remitente, Entregados al destinatario, Devueltos por destinatario, No devueltos a recoger)
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
  productLines: [
    {
      marksAndNumbers: '',
      numberOfPackages: 0,
      methodOfPacking: '',
      natureOfGoods: '',
      statisticalNumber: '',
      grossWeight: 0,
      volume: '',
    },
  ],
  senderInstructions: '',
  methodOfPayment: '',
  carrier: '',
  successiveCarriers: '',
  reservationsOrObservations: '',
  specialAgreements: '',
  payableBy: '',
  payment20: [
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
  ],
  placeAndDate: '',
  senderSignature: '',
  carrierSignature: '',
  consigneeSignature: '',
  distance: '',
  vehicleRegistration: '',
  trailerRegistration: '',
  controlledTemperature: '',
  palletsPallets: ['', '', '', '', ''],
};

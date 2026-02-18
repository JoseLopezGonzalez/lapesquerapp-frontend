/**
 * Configuración de las 4 copias del CMR: número, encabezado (ES/EN), color y estilo de cabecera.
 * docTitleColor: color de "DOCUMENTO DE CONTROL" (accent = mismo que bordes, black = negro).
 * docNumColor: color del número de documento "#02440" (accent o black).
 */
export const cmrCopyConfig = [
  {
    copyType: 'sender',
    copyNumber: 1,
    headerMain: 'Ejemplar para el remitente',
    headerEn: 'Copy for sender',
    color: '#b91c1c',
    docTitleColor: 'black',
    docNumColor: 'accent',
    docNumBordered: true,
  },
  {
    copyType: 'consignee',
    copyNumber: 2,
    headerMain: 'Ejemplar para el consignatario',
    headerEn: 'Copy for consignee',
    color: '#1d4ed8',
    docTitleColor: 'accent',
    docNumColor: 'black',
  },
  {
    copyType: 'carrier',
    copyNumber: 3,
    headerMain: 'Ejemplar para el porteador',
    headerEn: 'Copy for carrier',
    color: '#15803d',
    docTitleColor: 'accent',
    docNumColor: 'black',
  },
  {
    copyType: 'extra',
    copyNumber: 4,
    headerMain: '',
    headerEn: '',
    color: '#171717',
    docTitleColor: 'black',
    docNumColor: 'red',
  },
];

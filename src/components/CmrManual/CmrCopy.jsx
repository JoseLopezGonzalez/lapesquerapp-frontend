'use client';

import { cmrCopyConfig } from './cmr.copy-config';
import './cmr-print.css';

const CMR_LEGAL_ES =
  'Este transporte queda sometido, no obstante a toda cláusula contraria, al Convenio sobre el Contrato de Transporte Internacional de Mercancías por Carretera (CMR).';
const CMR_LEGAL_EN =
  'This carriage is subject notwithstanding any clause to the contrary, to the Convention on the Contract for the international Carriage of goods by road (CMR).';

/** Etiquetas ES / EN por número de casilla */
const BOX_LABELS = {
  1: { es: 'Remitente (nombre, dirección, pais)', en: 'Sender (name, address, country)' },
  2: { es: 'Destinatario (nombre, dirección, pais)', en: 'Consignee (name, address, country)' },
  3: { es: 'Lugar de entrega de la mercancía', en: 'Place of delivery of the goods (place, country)' },
  4: { es: 'Lugar y fecha de recepción de las mercancías', en: 'Place and date taking over the goods (place, country, date)' },
  5: { es: 'Documentos anexos', en: 'Documents attached' },
  6: { es: 'Marcas y nos', en: 'Marks and Nos' },
  7: { es: 'Número de bultos', en: 'Number of packages' },
  8: { es: 'Clase de embalaje', en: 'Method of packing' },
  9: { es: 'Natura, de la merc.', en: 'Nature of the goods' },
  10: { es: 'No. Estadístico', en: 'Statistical num.' },
  11: { es: 'Peso bruto Kg', en: 'Gross weight Kg' },
  12: { es: 'Volumen m3', en: 'Volume in m3' },
  13: { es: 'Instrucciones del remitente', en: "Sender's instructions" },
  14: { es: 'Forma de pago', en: 'Instruction as to payment for carriage' },
  15: { es: 'Reembolso', en: 'COD' },
  16: { es: 'Porteador (nombre, domicilio, pais)', en: 'Carrier (name, address, country)' },
  17: { es: 'Porteadores sucesivos (nombre, domicilio, pais)', en: 'Successive carriers (Name, address, country)' },
  18: { es: 'Reservas y observaciones del porteador', en: "Carrier's reservations and observations" },
  19: { es: 'Estipulaciones particulares', en: 'Special agreements' },
  20: { es: 'A pagar por:', en: 'To be paid by:' },
  21: { es: 'Establecido en', en: 'Established in' },
  22: { es: 'Firma y sello del remitente', en: 'Signature and stamp of the sender' },
  23: { es: 'Firma y sello del transportista', en: 'Signature and stamp of the carrier' },
  24: { es: 'Recibo de la mercancía', en: 'Goods received' },
};

function getCopyConfig(copyType) {
  return cmrCopyConfig.find((c) => c.copyType === copyType) ?? cmrCopyConfig[3];
}

function n(v) {
  return v !== undefined && v !== '' ? String(v) : '';
}
function num(v) {
  return typeof v === 'number' ? (v ? String(v) : '') : n(v);
}

/** Parsea "lugar | fecha" en [lugar, fecha] */
function parsePlaceDate(value) {
  const s = n(value);
  const idx = s.indexOf('|');
  if (idx >= 0) return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
  return [s, ''];
}

function Cell({ num: boxNum, labelEn, children, className = '', valueClassName = 'cmr-cell-value' }) {
  const labels = BOX_LABELS[boxNum];
  return (
    <div className={`cmr-cell cmr-cell-${boxNum} ${className}`}>
      <div className="cmr-cell-header">
        <span className="cmr-num-box">{boxNum}</span>
        <span className="cmr-cell-label">{labels?.es ?? ''}</span>
        {labels?.en && <span className="cmr-cell-label-en">{labels.en}</span>}
      </div>
      {children ? (
        <div className={valueClassName}>{children}</div>
      ) : null}
    </div>
  );
}

function CellValue({ num: boxNum, value, labelEn }) {
  const labels = BOX_LABELS[boxNum];
  return (
    <div className={`cmr-cell cmr-cell-${boxNum}`}>
      <div className="cmr-cell-header">
        <span className="cmr-num-box">{boxNum}</span>
        <span className="cmr-cell-label">{labels?.es ?? ''}</span>
        {labels?.en && <span className="cmr-cell-label-en">{labels.en}</span>}
      </div>
      <div className="cmr-cell-value">{value || '\u00A0'}</div>
    </div>
  );
}

function CellPlaceDate({ num: boxNum, place, date }) {
  const labels = BOX_LABELS[boxNum];
  return (
    <div className={`cmr-cell cmr-cell-${boxNum} cmr-cell-place-date`}>
      <div className="cmr-cell-header">
        <span className="cmr-num-box">{boxNum}</span>
        <span className="cmr-cell-label">{labels?.es ?? ''}</span>
        {labels?.en && <span className="cmr-cell-label-en">{labels.en}</span>}
      </div>
      <div className="cmr-cell-value" style={{ display: 'flex' }}>
        <span style={{ flex: 1 }}>{place || '\u00A0'}</span>
        <span style={{ borderLeft: '1px solid #ccc', paddingLeft: '6px', minWidth: '60px' }}>{date || '\u00A0'}</span>
      </div>
    </div>
  );
}

export default function CmrCopy({ copyType, data }) {
  const config = getCopyConfig(copyType);
  const d = data ?? {};
  const [place4, date4] = parsePlaceDate(d.placeAndDateOfReceiptOrLoad);
  const [place21, date21] = parsePlaceDate(d.placeAndDate);

  return (
    <div className="cmr-page" style={{ '--cmr-color': config.color }}>
      {/* Cabecera: 3 zonas (como en el documento original) */}
      <header className="cmr-header-row">
        <div className="cmr-header-copy">
          <span className="cmr-num-box">{config.copyNumber}</span>
          {(config.headerMain || config.headerEn) && (
            <div className="cmr-header-copy-text">
              {config.headerMain && <strong>{config.headerMain}</strong>}
              {config.headerEn && <span>{config.headerEn}</span>}
            </div>
          )}
        </div>
        <div className="cmr-header-cmr">
          <span className="cmr-checkbox">X</span>
          <div className="cmr-header-cmr-text">
            <strong>C.M.R.</strong>
            <span>Marque el que proceda</span>
          </div>
          <span className="cmr-header-cmr-empty" aria-hidden />
        </div>
        <div className="cmr-header-doc">
          <div className="cmr-header-doc-inner">
            <span className="cmr-header-cmr-empty" aria-hidden />
            <div>
              <div className={`cmr-header-doc-title ${config.docTitleColor ?? 'black'}`}>DOCUMENTO DE CONTROL</div>
              <div className="cmr-header-doc-ref">DOCUMENTO DE CONTROL (O.FOM/2861/2012-BOE05/07/213)</div>
              <div className="cmr-header-doc-num-wrap">
                <span className={`cmr-header-doc-num ${config.docNumColor ?? 'accent'}`}>No</span>
                <span className={`cmr-header-doc-num ${config.docNumColor ?? 'accent'} ${config.docNumBordered ? 'cmr-header-doc-num-bordered' : ''}`}>
                  #{d.documentNumber || ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="cmr-body">
        {/* Columna izquierda */}
        <div className="cmr-col-left">
          <CellValue num={1} value={n(d.sender)} />
          <CellValue num={2} value={n(d.consignee)} />
          <CellValue num={3} value={n(d.placeOfDelivery)} />
          <CellPlaceDate num={4} place={place4} date={date4} />
          <CellValue num={5} value={n(d.attachedDocuments)} />

          <div className="cmr-row-cells">
            <CellValue num={6} value={n(d.marksAndNumbers)} />
            <CellValue num={7} value={num(d.numberOfPackages)} />
            <CellValue num={8} value={n(d.methodOfPacking)} />
            <CellValue num={9} value={n(d.natureOfGoods)} />
          </div>

          <table className="cmr-table cmr-table-palets">
            <thead>
              <tr>
                <th>PALETS / LOADED BY SENDER</th>
                <th>CHIFFRE / REMETTANCES TO SENDER</th>
                <th>LETTRE / DELIVERED TO THE RECIPIENT</th>
                <th>DEVUELTOS POR EL DESTINATARIO / RETURNED BY THE RECIPIENT</th>
                <th>NO DEVUELTOS, A RECOGER / NOT RETURNED. TO PICK UP</th>
              </tr>
            </thead>
            <tbody>
              <tr><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td><td></td><td></td></tr>
            </tbody>
          </table>

          <CellValue num={13} value={n(d.senderInstructions)} />
          <CellValue num={14} value={n(d.methodOfPayment)} />
          <CellPlaceDate num={21} place={place21} date={date21} />
          <CellValue num={22} value={n(d.senderSignature)} />
        </div>

        {/* Columna derecha */}
        <div className="cmr-col-right">
          <div className="cmr-legal-box">
            <div className="cmr-legal-box-title">CARTA DE PORTE INTERNACIONAL</div>
            <p>{CMR_LEGAL_ES}</p>
            <p>{CMR_LEGAL_EN}</p>
          </div>

          <CellValue num={16} value={n(d.carrier)} />
          <CellValue num={17} value={n(d.successiveCarriers)} />

          <div className="cmr-block-17bis">
            <div className="cmr-cell-header">
              <span className="cmr-num-box">17</span>
              <span className="cmr-cell-label">Referencia Transportista</span>
              <span className="cmr-cell-label-en">Carrier&apos;s reference</span>
            </div>
            <table className="cmr-table">
              <thead>
                <tr>
                  <th>Distancia</th>
                  <th>Km</th>
                  <th>MATRICULA</th>
                  <th>Vehículo</th>
                  <th>Remolque o Semiremolque</th>
                </tr>
              </thead>
              <tbody>
                <tr><td></td><td></td><td></td><td></td><td></td></tr>
              </tbody>
            </table>
          </div>

          <CellValue num={18} value={n(d.reservationsOrObservations)} />

          <div className="cmr-block-adr">
            <div className="cmr-block-adr-title">MERCANCIAS PELIGROSAS / (ADR*) — TRANSPORTE CON TEMPERATURA CONTROLADA</div>
            <table className="cmr-table">
              <thead>
                <tr>
                  <th>CLASSE / Class</th>
                  <th>CHIFFRE / Number</th>
                  <th>LETTRE / Letter</th>
                  <th>(ADR*)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td></td><td></td><td></td><td></td></tr>
              </tbody>
            </table>
          </div>

          <div className="cmr-docs-precision">
            Documentos anexos y/o precisiones concretas: Attached documents and/or specific details:
          </div>
          <div className="cmr-cell-value" style={{ minHeight: '24px', marginBottom: '4px' }} />

          <div className="cmr-row-cells cmr-row-cells-3">
            <CellValue num={10} value="" />
            <CellValue num={11} value={num(d.grossWeight) ? `${num(d.grossWeight)} kg` : ''} />
            <CellValue num={12} value={n(d.volume)} />
          </div>

          <CellValue num={19} value={n(d.specialAgreements)} />

          <Cell num={20} valueClassName="cmr-cell-value">
            <table className="cmr-table cmr-table-payment">
              <thead>
                <tr>
                  <th></th>
                  <th>Remitente / Sender</th>
                  <th>Modena / Currency</th>
                  <th>Consignatario / Consignee</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Precio del transporte: Carriage charges</td><td></td><td></td><td></td></tr>
                <tr><td>Descuento Deductions</td><td></td><td></td><td></td></tr>
                <tr><td>Liquido/Balance: Balance</td><td></td><td></td><td></td></tr>
                <tr><td>Suplementos: Sup. charges</td><td></td><td></td><td></td></tr>
                <tr><td>Gastos accesorios: Miscellaneous</td><td></td><td></td><td></td></tr>
                <tr><td><strong>TOTAL:</strong></td><td></td><td></td><td></td></tr>
              </tbody>
            </table>
            {n(d.payableBy) && <div style={{ marginTop: '4px' }}>{d.payableBy}</div>}
          </Cell>

          <Cell num={15} valueClassName="cmr-cell-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" readOnly checked={false} />
              <span>COD</span>
            </div>
          </Cell>

          <CellValue num={23} value={n(d.carrierSignature)} />

          <Cell num={24} valueClassName="cmr-cell-value">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>Lugar / Place</span>
                  <span style={{ flex: 1, borderBottom: '1px solid #999', minHeight: '14px' }} />
                  <span>a</span>
                  <span>on</span>
                  <span style={{ borderBottom: '1px solid #999', minWidth: '60px', minHeight: '14px' }} />
                </div>
                <div>Firma y sello del consignatario / Signature and stamp of the consignee</div>
                <div style={{ minHeight: '24px' }}>{n(d.consigneeSignature)}</div>
            </div>
          </Cell>
        </div>
      </div>
    </div>
  );
}

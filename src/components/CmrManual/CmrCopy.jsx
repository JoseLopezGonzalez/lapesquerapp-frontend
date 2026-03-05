'use client';

import { cmrCopyConfig } from './cmr.copy-config';
import './cmr-print.css';

const CMR_LEGAL_ES =
  'Este transporte queda sometido, no obstante a toda cláusula contraria, al Convenio sobre el Contrato de Transporte Internacional de Mercancías por Carretera (CMR).';
const CMR_LEGAL_EN =
  'This carriage is subject notwithstanding any clause to the contrary, to the Convention on the Contract for the international Carriage of goods by road (CMR).';

const BOX_LABELS = {
  1:  { es: 'Remitente (nombre, dirección, pais)', en: 'Sender (name, address, country)' },
  2:  { es: 'Destinatario (nombre, dirección, pais)', en: 'Consignee (name, address, country)' },
  3:  { es: 'Lugar de entrega de la mercancía', en: 'Place of delivery of the goods (place, country)' },
  4:  { es: 'Lugar y fecha de recepción de las mercancias', en: 'Place and date taking over the goods (place, country, date)' },
  5:  { es: 'Documentos annexos', en: 'Documents attached' },
  6:  { es: 'Marcas y nos', en: 'Marks and Nos' },
  7:  { es: 'Número de bultos', en: 'Number of packages' },
  8:  { es: 'Clase de embalaje', en: 'Method of packing' },
  9:  { es: 'Natural. de la merc.', en: 'Natura of the goods' },
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
  24: { es: 'Recibo de la mercancía', en: 'Goods recived' },
};

function getCopyConfig(copyType) {
  return cmrCopyConfig.find((c) => c.copyType === copyType) ?? cmrCopyConfig[3];
}
function n(v) { return v !== undefined && v !== '' ? String(v) : ''; }
function num(v) { return typeof v === 'number' ? (v ? String(v) : '') : n(v); }
function parsePlaceDate(value) {
  const s = n(value);
  const idx = s.indexOf('|');
  if (idx >= 0) return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
  return [s, ''];
}

/** Cabecera de casilla: número + etiqueta ES + etiqueta EN (opcional hideLabels para solo número) */
function CellHeader({ boxNum, superscript, rightSlot, hideLabels }) {
  const labels = BOX_LABELS[boxNum];
  return (
    <div className="cmr-cell-header">
      <div className="cmr-cell-header-left">
        <span className="cmr-num-box">
          {boxNum}{superscript && <sup style={{ fontSize: '5px', lineHeight: 0 }}>{superscript}</sup>}
        </span>
        {!hideLabels && (
          <div className="cmr-cell-label-stack">
            <span className="cmr-cell-label-es">{labels?.es ?? ''}</span>
            {labels?.en && <span className="cmr-cell-label-en">{labels.en}</span>}
          </div>
        )}
      </div>
      {rightSlot && <div className="cmr-cell-header-right">{rightSlot}</div>}
    </div>
  );
}

/** Casilla genérica */
function Cell({ boxNum, value, children, className = '' }) {
  return (
    <div className={`cmr-cell cmr-cell-${boxNum} ${className}`}>
      <CellHeader boxNum={boxNum} />
      <div className="cmr-cell-value">{children ?? (value || '\u00A0')}</div>
    </div>
  );
}

/** Líneas de producto (6–12): obtiene array de líneas (productLines o legacy flat) */
function getProductLines(d) {
  const lines = d?.productLines;
  if (Array.isArray(lines) && lines.length > 0) return lines;
  const flat = d ?? {};
  return [{
    marksAndNumbers: flat.marksAndNumbers ?? '',
    numberOfPackages: flat.numberOfPackages ?? 0,
    methodOfPacking: flat.methodOfPacking ?? '',
    natureOfGoods: flat.natureOfGoods ?? '',
    statisticalNumber: flat.statisticalNumber ?? '',
    grossWeight: flat.grossWeight ?? 0,
    volume: flat.volume ?? '',
  }];
}

/** Tabla 6–12: líneas de producto (marcas, bultos, embalaje, naturaleza, estadístico, peso, volumen) */
function ProductLinesTable({ data, n, num }) {
  const lines = getProductLines(data);
  const boxIds = [6, 7, 8, 9, 10, 11, 12];
  const colWidths = ['10.5%', '15%', '15%', '17.5%', '12%', '18%', '12%'];
  return (
    <table className="cmr-table cmr-table-product-lines">
      <colgroup>
        {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
      </colgroup>
      <thead>
        <tr>
          {boxIds.map((boxNum) => (
            <th key={boxNum} className={`cmr-pl-th cmr-pl-th-${boxNum}`}>
              <span className="cmr-num-box">{boxNum}</span>
              <div className="cmr-cell-label-stack">
                <span className="cmr-cell-label-es">{BOX_LABELS[boxNum]?.es ?? ''}</span>
                {BOX_LABELS[boxNum]?.en && <span className="cmr-cell-label-en">{BOX_LABELS[boxNum].en}</span>}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => (
          <tr key={idx}>
            <td className="cmr-pl-td cmr-pl-td-6">{n(line.marksAndNumbers)}</td>
            <td className="cmr-pl-td cmr-pl-td-7">{num(line.numberOfPackages)}</td>
            <td className="cmr-pl-td cmr-pl-td-8">{n(line.methodOfPacking)}</td>
            <td className="cmr-pl-td cmr-pl-td-9">{n(line.natureOfGoods)}</td>
            <td className="cmr-pl-td cmr-pl-td-10">{n(line.statisticalNumber)}</td>
            <td className="cmr-pl-td cmr-pl-td-11">{num(line.grossWeight) ? `${num(line.grossWeight)} kg` : ''}</td>
            <td className="cmr-pl-td cmr-pl-td-12">{n(line.volume)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Tabla 20 — A pagar por: 6 filas × 6 celdas de datos (Remitente×2, Modena×2, Consignatario×2) */
function PaymentTable20({ data, n }) {
  const raw = data?.payment20;
  const rows = Array.isArray(raw) && raw.length >= 6
    ? raw
    : Array.from({ length: 6 }, () => Array(6).fill(''));
  const get = (r, c) => (rows[r] && rows[r][c] != null ? String(rows[r][c]) : '');

  return (
    <table className="cmr-table cmr-table-payment">
      <colgroup>
        <col style={{ width: '34%' }} />
        <col style={{ width: '11%' }} /><col style={{ width: '11%' }} />
        <col style={{ width: '11%' }} /><col style={{ width: '11%' }} />
        <col style={{ width: '11%' }} /><col style={{ width: '11%' }} />
      </colgroup>
      <thead>
        <tr>
          <th className="cmr-payment-th-label">
            <span className="cmr-num-box">20</span>
            <div className="cmr-cell-label-stack">
              <span className="cmr-cell-label-es">A pagar por:</span>
              <span className="cmr-cell-label-en">To be paid by:</span>
            </div>
          </th>
          <th colSpan={2}>Remitente<br />Sender</th>
          <th colSpan={2}>Modena<br />Currency</th>
          <th colSpan={2}>Consignatario<br />Consignee</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowSpan={2}>Precio del transporte<br />Carriage charges<br /><br />Descuento<br />Deductions</td>
          <td>{n(get(0, 0))}</td><td>{n(get(0, 1))}</td><td>{n(get(0, 2))}</td><td>{n(get(0, 3))}</td><td>{n(get(0, 4))}</td><td>{n(get(0, 5))}</td>
        </tr>
        <tr>
          <td>{n(get(1, 0))}</td><td>{n(get(1, 1))}</td><td>{n(get(1, 2))}</td><td>{n(get(1, 3))}</td><td>{n(get(1, 4))}</td><td>{n(get(1, 5))}</td>
        </tr>
        <tr>
          <td rowSpan={3}>Liquido/Balance<br />Balance<br /><br />Suplementos<br />Sup. charges<br /><br />Gastos accesorios<br />Miscellaneous</td>
          <td>{n(get(2, 0))}</td><td>{n(get(2, 1))}</td><td>{n(get(2, 2))}</td><td>{n(get(2, 3))}</td><td>{n(get(2, 4))}</td><td>{n(get(2, 5))}</td>
        </tr>
        <tr>
          <td>{n(get(3, 0))}</td><td>{n(get(3, 1))}</td><td>{n(get(3, 2))}</td><td>{n(get(3, 3))}</td><td>{n(get(3, 4))}</td><td>{n(get(3, 5))}</td>
        </tr>
        <tr>
          <td>{n(get(4, 0))}</td><td>{n(get(4, 1))}</td><td>{n(get(4, 2))}</td><td>{n(get(4, 3))}</td><td>{n(get(4, 4))}</td><td>{n(get(4, 5))}</td>
        </tr>
        <tr>
          <td>TOTAL<br />TOTAL</td>
          <td>{n(get(5, 0))}</td><td>{n(get(5, 1))}</td><td>{n(get(5, 2))}</td><td>{n(get(5, 3))}</td><td>{n(get(5, 4))}</td><td>{n(get(5, 5))}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function CmrCopy({ copyType, data }) {
  const config = getCopyConfig(copyType);
  const d = data ?? {};
  const [place4, date4]   = parsePlaceDate(d.placeAndDateOfReceiptOrLoad);
  const [place21, date21] = parsePlaceDate(d.placeAndDate);

  return (
    <div className="cmr-page" style={{ '--cmr-color': config.color }}>

      {/* ═══════════════════════════════════════════
          CABECERA
          ═══════════════════════════════════════════ */}
      <header className="cmr-header-row">
        <div className="cmr-header-copy">
          <span className="cmr-header-copy-number">{config.copyNumber}</span>
          {(config.headerMain || config.headerEn) && (
            <div className="cmr-header-copy-text">
              {config.headerMain && <span className="cmr-header-copy-main">{config.headerMain}</span>}
              {config.headerEn  && <span className="cmr-header-copy-en">{config.headerEn}</span>}
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          CUERPO
          ═══════════════════════════════════════════ */}
      <div className="cmr-body">

        {/* ── SECCIÓN SUPERIOR: izq (1-5) | der (legal,16-18) ── */}
        <div className="cmr-top-cols">
          <div className="cmr-col-left">
            <Cell boxNum={1} value={n(d.sender)} />
            <Cell boxNum={2} value={n(d.consignee)} />
            <Cell boxNum={3} value={n(d.placeOfDelivery)} />
            {/* 4: fecha en cabecera, lugar en contenido */}
            <div className="cmr-cell cmr-cell-4">
              <CellHeader boxNum={4} rightSlot={date4 ? <span className="cmr-cell-header-date">{date4}</span> : null} />
              <div className="cmr-cell-value">{place4 || '\u00A0'}</div>
            </div>
            <Cell boxNum={5} value={n(d.attachedDocuments)} />
          </div>

          <div className="cmr-col-right">
            {/* Legal — Título trilingüe (EN | CMR óvalo | FR) + texto convenio CMR */}
            <div className="cmr-legal-box">
              <div className="cmr-legal-box-inner">
                <div className="cmr-legal-title-block">
                  <div className="cmr-legal-title-left">
                    <span className="cmr-legal-title-line">CARTA DE PORTE</span>
                    <span className="cmr-legal-title-line">INTERNACIONAL</span>
                  </div>
                  <div className="cmr-legal-oval">
                    <span className="cmr-legal-cmr">CMR</span>
                  </div>
                  <div className="cmr-legal-title-right">
                    <span className="cmr-legal-title-line">INTERNATIONAL</span>
                    <span className="cmr-legal-title-line">CONSIGNMENT NOTE</span>
                  </div>
                </div>
                <div className="cmr-legal-box-text">
                  <p className="cmr-legal-p cmr-legal-es">{CMR_LEGAL_ES}</p>
                  <p className="cmr-legal-p cmr-legal-en">{CMR_LEGAL_EN}</p>
                </div>
              </div>
            </div>
            {/* Grupo con borde exterior compartido: 16 | 17 | 17Bis | 18 */}
            <div className="cmr-carrier-group">
              <Cell boxNum={16} value={n(d.carrier)} />
              <Cell boxNum={17} value={n(d.successiveCarriers)} />
              {/* 17 Bis */}
              <div className="cmr-block-17bis">
                <table className="cmr-table cmr-table-17bis">
                  <colgroup>
                    <col className="cmr-17bis-col-label" />
                    <col className="cmr-17bis-col-label" />
                    <col className="cmr-17bis-col-vehiculo" />
                    <col className="cmr-17bis-col-remolque" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colSpan={2} rowSpan={2} className="cmr-17bis-label-th">
                        <span className="cmr-num-box-17bis">17<sup style={{ fontSize: '5px', lineHeight: 0 }}>Bis</sup></span>
                        <div className="cmr-cell-label-stack">
                          <span className="cmr-cell-label-es">Referencia Transportista</span>
                          <span className="cmr-cell-label-en">Carrier&apos;s reference</span>
                        </div>
                      </th>
                      <th colSpan={2} className="cmr-matricula-header">M A T R I C U L A</th>
                    </tr>
                    <tr>
                      <th>Vehículo</th>
                      <th>Remolque o Semiremolque</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="cmr-17bis-body-row">
                      <td colSpan={2} className="cmr-17bis-td-distancia">
                        <div className="cmr-17bis-distancia">
                          <span className="cmr-17bis-distancia-label">Distancia</span>
                          <span className="cmr-17bis-distancia-value-km">{n(d.distance)} Km</span>
                        </div>
                      </td>
                      <td className="cmr-17bis-cell-data">{n(d.vehicleRegistration)}</td>
                      <td className="cmr-17bis-cell-data">{n(d.trailerRegistration)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Cell boxNum={18} value={n(d.reservationsOrObservations)} />
            </div>
          </div>
        </div>

        {/* ── BANDA MEDIA: tabla 6–12 líneas de producto ── */}
        <div className="cmr-mid-band cmr-mid-band-table">
          <ProductLinesTable data={d} n={n} num={num} />
        </div>

        {/* ── BANDA COMPLETA: palés (izq) | ADR | Docs (der) — ancho total ── */}
        <div className="cmr-pallets-band">

          {/* Etiqueta vertical PALETS/PALLETES */}
          <div className="cmr-palets-label">
            <span>PALETS</span>
            <span>PALLETES</span>
          </div>

          {/* 5 columnas de palés */}
          <div className="cmr-palets-5cols">
            {[
              { es: 'CARGADOS POR EL REMITENTE', en: 'LOADED BY SENDER' },
              { es: 'REMESAS AL REMITENTE',      en: 'REMITTANCES TO SENDER' },
              { es: 'ENTREGADOS AL DESTINATARIO', en: 'DELIVERED TO THE RECIPIENT' },
              { es: 'DEVUELTOS POR EL DESTINATARIO', en: 'RETURNED BY THE RECIPIENT' },
              { es: 'NO DEVUELTOS, A RECOGER',   en: 'NOT RETURNED, TO PICK UP' },
            ].map((col, i) => {
              const palletsVal = Array.isArray(d.palletsPallets) && d.palletsPallets[i] != null ? String(d.palletsPallets[i]) : '';
              return (
                <div key={i} className="cmr-palets-col">
                  <div className="cmr-palets-col-hdr">
                    {col.es}<br />{col.en}
                  </div>
                  <div className="cmr-palets-col-data">{n(palletsVal)}</div>
                </div>
              );
            })}
          </div>

          {/* Sección ADR: MERCANCIAS PELIGROSAS + columnas */}
          <div className="cmr-adr-section">
            <div className="cmr-adr-mercancias-hdr">MERCANCIAS PELIGROSAS</div>
            <div className="cmr-adr-classe-hdr">(ADR*) CLASSE</div>
            <div className="cmr-adr-col-headers">
              <div className="cmr-adr-col"><span>Classe</span><span>Class</span></div>
              <div className="cmr-adr-col"><span>Chiffre</span><span>Number</span></div>
              <div className="cmr-adr-col"><span>Lettre</span><span>Letter</span></div>
              <div className="cmr-adr-col"><span>(ADR*)</span></div>
            </div>
            <div className="cmr-adr-data-row">
              <div className="cmr-adr-col" />
              <div className="cmr-adr-col" />
              <div className="cmr-adr-col" />
              <div className="cmr-adr-col" />
            </div>
          </div>

          {/* Sección: TRANSPORTE CON TEMPERATURA CONTROLADA + valor temperatura ºC */}
          <div className="cmr-docs-section">
            <div className="cmr-adr-temperatura-hdr">TRANSPORTE CON TEMPERATURA CONTROLADA</div>
            <div className="cmr-adr-temperatura-value">
              {d.controlledTemperature != null && String(d.controlledTemperature).trim() !== ''
                ? `${String(d.controlledTemperature).trim()} ºC`
                : '\u00A0'}
            </div>
          </div>

        </div>

        {/* ── SECCIÓN INFERIOR: izq (13,14,21) | der (19,20,15) ── */}
        <div className="cmr-bottom-cols">
          <div className="cmr-col-left">
            <Cell boxNum={13} value={n(d.senderInstructions)} />
            <Cell boxNum={14} value={n(d.methodOfPayment)} />
            {/* 21: lugar + ᵃ/on + fecha en una línea */}
            <div className="cmr-cell cmr-cell-21">
              <div className="cmr-cell-21-row">
                <div className="cmr-cell-header-left" style={{ flexShrink: 0 }}>
                  <span className="cmr-num-box">21</span>
                  <div className="cmr-cell-label-stack">
                    <span className="cmr-cell-label-es">{BOX_LABELS[21].es}</span>
                    <span className="cmr-cell-label-en">{BOX_LABELS[21].en}</span>
                  </div>
                </div>
                <div className="cmr-cell-21-content">
                  <span className="cmr-cell-21-place">{place21 || '\u00A0'}</span>
                  <span className="cmr-cell-21-aon">
                    <sup style={{ fontSize: '6px' }}>a</sup>
                    <span style={{ fontSize: '7px', display: 'block', lineHeight: 1 }}>on</span>
                  </span>
                  <span className="cmr-cell-21-date">{date21 || '\u00A0'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cmr-col-right">
            <Cell boxNum={19} value={n(d.specialAgreements)} />
            {/* 20 — tabla de pagos: 7 cols (1 descripción + 2+2+2 datos) */}
            <div className="cmr-cell cmr-cell-20">
              <PaymentTable20 data={d} n={n} />
            </div>

            {/* 15 — Reembolso / COD */}
            <Cell boxNum={15} />
          </div>
        </div>

        {/* ── FILA FIRMAS: 22 | 23 | 24 ── */}
        <div className="cmr-body-sigs">
          <div className="cmr-cell cmr-cell-22">
            <CellHeader boxNum={22} hideLabels />
            <div className="cmr-cell-value cmr-sig-body">
              {n(d.senderSignature) && <div className="cmr-sig-content">{d.senderSignature}</div>}
              <div className="cmr-sig-label">
                <span>Firma y sello del remitente</span>
                <span>Signature and stamp of the sender</span>
              </div>
            </div>
          </div>
          <div className="cmr-cell cmr-cell-23">
            <CellHeader boxNum={23} hideLabels />
            <div className="cmr-cell-value cmr-sig-body">
              {n(d.carrierSignature) && <div className="cmr-sig-content">{d.carrierSignature}</div>}
              <div className="cmr-sig-label">
                <span>Firma y sello del transportista</span>
                <span>Signature and stamp of the carrier</span>
              </div>
            </div>
          </div>
          <div className="cmr-cell cmr-cell-24">
            <CellHeader boxNum={24} />
            <div className="cmr-cell-value cmr-sig-body">
              <div className="cmr-cell-24-lugar">
                <div>
                  <div style={{ fontSize: '7.5px' }}>Lugar</div>
                  <div style={{ fontSize: '7.5px' }}>Place</div>
                </div>
                <div className="cmr-24-aon">
                  <sup style={{ fontSize: '7px' }}>a</sup>
                  <span>on</span>
                </div>
              </div>
              {n(d.consigneeSignature) && <div className="cmr-sig-content">{d.consigneeSignature}</div>}
              <div className="cmr-sig-label">
                <span>Firma y sello del consignatario</span>
                <span>Signature and stamp of the consignee</span>
              </div>
            </div>
          </div>
        </div>

      </div>{/* fin cmr-body */}
    </div>
  );
}

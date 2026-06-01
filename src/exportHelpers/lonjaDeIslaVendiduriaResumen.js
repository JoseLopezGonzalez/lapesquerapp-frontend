import { parseDecimalValue, calculateImporteFromLinea } from './common';

export function aggregateLineasForLonja(lineas) {
  if (!Array.isArray(lineas)) {
    return { cajas: 0, kilos: 0, importe: 0 };
  }
  return lineas.reduce(
    (acc, linea) => {
      acc.cajas += Number(linea.cajas) || 0;
      acc.kilos += parseDecimalValue(linea.kilos);
      acc.importe += calculateImporteFromLinea(linea);
      return acc;
    },
    { cajas: 0, kilos: 0, importe: 0 }
  );
}

/**
 * Agrupa ventas de Lonja de Isla por vendiduría (y una fila "Venta directa" si aplica).
 *
 * @param {Record<string, object>} ventasVendidurias - grupos por codBarco con .vendiduria y .lineas
 * @param {Record<string, object>} ventasDirectas - grupos por codBarco con .lineas
 * @returns {Array<{ cod: string, nombre: string, cajas: number, kilos: number, importe: number }>}
 */
export function buildLonjaDeIslaVendiduriaResumen(ventasVendidurias, ventasDirectas) {
  const ventasVendiduriasArray = Object.values(ventasVendidurias || {}).filter(Boolean);
  const ventasDirectasArray = Object.values(ventasDirectas || {}).filter(Boolean);

  const byCod = {};
  for (const barco of ventasVendiduriasArray) {
    const cod = barco.vendiduria?.cod;
    if (!cod) continue;
    if (!byCod[cod]) {
      byCod[cod] = {
        cod,
        nombre: barco.vendiduria.nombre || cod,
        cajas: 0,
        kilos: 0,
        importe: 0,
      };
    }
    const agg = aggregateLineasForLonja(barco.lineas);
    byCod[cod].cajas += agg.cajas;
    byCod[cod].kilos += agg.kilos;
    byCod[cod].importe += agg.importe;
  }

  const rows = Object.values(byCod).sort((a, b) =>
    String(a.nombre).localeCompare(String(b.nombre), 'es')
  );

  if (ventasDirectasArray.length > 0) {
    const vd = ventasDirectasArray.reduce(
      (acc, barco) => {
        const agg = aggregateLineasForLonja(barco.lineas);
        acc.cajas += agg.cajas;
        acc.kilos += agg.kilos;
        acc.importe += agg.importe;
        return acc;
      },
      { cajas: 0, kilos: 0, importe: 0 }
    );
    rows.push({
      cod: '__VD__',
      nombre: 'Venta directa',
      ...vd,
    });
  }

  return rows;
}

/**
 * Agrupa barcos de vendiduría por código de vendiduría (CF, PI, …).
 *
 * @param {Record<string, object>} ventasVendidurias
 * @returns {Array<{ vendiduria: object, barcos: object[] }>}
 */
export function groupVentasVendiduriasByCodVendiduria(ventasVendidurias) {
  const byCod = {};
  for (const barco of Object.values(ventasVendidurias || {}).filter(Boolean)) {
    const cod = barco.vendiduria?.cod;
    if (!cod) continue;
    if (!byCod[cod]) {
      byCod[cod] = { vendiduria: barco.vendiduria, barcos: [] };
    }
    byCod[cod].barcos.push(barco);
  }
  return Object.values(byCod)
    .map((g) => ({
      ...g,
      barcos: [...g.barcos].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es')),
    }))
    .sort((a, b) => String(a.vendiduria.nombre).localeCompare(String(b.vendiduria.nombre), 'es'));
}

export function sumLonjaDeIslaResumenRows(rows) {
  return (rows || []).reduce(
    (acc, r) => {
      acc.cajas += r.cajas || 0;
      acc.kilos += r.kilos || 0;
      acc.importe += r.importe || 0;
      return acc;
    },
    { cajas: 0, kilos: 0, importe: 0 }
  );
}

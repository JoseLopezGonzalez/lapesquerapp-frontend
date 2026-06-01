'use client';

import { calculateImporteFromLinea } from '@/exportHelpers/common';
import { findBarcoMatch } from '@/exportHelpers/lonjaDeIslaBarcoMatcher';
import { getLonjaDeIslaTradeType } from '@/exportHelpers/lonjaDeIslaExportHelper';
import {
  barcos as barcosLonja,
  barcosVentaDirecta,
  datosVendidurias,
} from '../../ListadoComprasLonjaDeIsla/exportData';
import {
  buildLonjaDeIslaServiciosCalculados,
  getPorcentajeGastosLonjaOpVendiduria,
} from '@/exportHelpers/portFeeRepercusion';
import LonjaDeIslaUnifiedExportTable from '../../ListadoComprasLonjaDeIsla/LonjaDeIslaUnifiedExportTable';
import LonjaDeIslaVentaDirectaCard from '../../ListadoComprasLonjaDeIsla/LonjaDeIslaVentaDirectaCard';
import LonjaDeIslaUnresolvedLinesCard from '../../ListadoComprasLonjaDeIsla/LonjaDeIslaUnresolvedLinesCard';

export default function LonjaDeIslaExportPreview({
  document,
  applyFullTasaPescaRepercusion = true,
}) {
  const {
    tables: { ventas, vendidurias },
  } = document;
  const tradeType = getLonjaDeIslaTradeType(document);

  const ventasVendidurias = {};
  const ventasDirectas = {};
  const unresolvedLines = [];

  ventas.forEach((venta) => {
    const barcoEncontrado = findBarcoMatch(barcosLonja, venta);
    if (!barcoEncontrado) {
      unresolvedLines.push({ reason: 'barco_not_found', venta });
      return;
    }

    const nombreBarco = barcoEncontrado.barco;
    const codBarco = `${barcoEncontrado.cod}`;
    const barcoVentaDirectaEncontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

    if (!barcoVentaDirectaEncontrado) {
      const vendiduria = datosVendidurias.find((v) => v.cod === barcoEncontrado.codVendiduria);
      if (!vendiduria) {
        unresolvedLines.push({ reason: 'vendiduria_not_found', venta });
        return;
      }
      if (!ventasVendidurias[codBarco]) {
        ventasVendidurias[codBarco] = {
          cod: codBarco,
          nombre: nombreBarco,
          vendiduria,
          lineas: [],
        };
      }
      ventasVendidurias[codBarco].lineas.push(venta);
    } else {
      const armador = barcoVentaDirectaEncontrado.armador;
      if (!ventasDirectas[codBarco]) {
        ventasDirectas[codBarco] = { cod: codBarco, nombre: nombreBarco, armador, lineas: [] };
      }
      ventasDirectas[codBarco].lineas.push(venta);
    }
  });

  const importeTotalVentasDirectas = Object.values(ventasDirectas).reduce(
    (acc, barco) =>
      acc + barco.lineas.reduce((sum, linea) => sum + calculateImporteFromLinea(linea), 0),
    0
  );

  const porcentajeServiciosVendiduria = getPorcentajeGastosLonjaOpVendiduria(
    applyFullTasaPescaRepercusion
  );
  const servicios = buildLonjaDeIslaServiciosCalculados(
    applyFullTasaPescaRepercusion,
    importeTotalVentasDirectas
  );

  return (
    <div className="space-y-4">
      <div className="flex w-fit items-center gap-1 rounded-md border border-white bg-white/30 p-1 px-2 text-white">
        <span className="text-xs">
          Tipo documento: {tradeType === 'SUBASTA' ? 'Subasta' : 'Contrato'}
        </span>
      </div>
      <LonjaDeIslaUnresolvedLinesCard unresolvedLines={unresolvedLines} />
      <LonjaDeIslaUnifiedExportTable
        ventasVendidurias={ventasVendidurias}
        sourceVendidurias={vendidurias}
        ventasDirectas={ventasDirectas}
        servicios={servicios}
        porcentajeServiciosVendiduria={porcentajeServiciosVendiduria}
      />
      <LonjaDeIslaVentaDirectaCard
        ventasDirectasArray={Object.values(ventasDirectas).filter(Boolean)}
        servicios={servicios}
      />
    </div>
  );
}

"use client";

import { calculateImporteFromLinea } from "@/exportHelpers/common";
import { findBarcoMatch } from "@/exportHelpers/lonjaDeIslaBarcoMatcher";
import {
    barcos as barcosLonja,
    barcosVentaDirecta,
    datosVendidurias,
    serviciosLonjaDeIsla,
    servicioExtraLonjaDeIsla,
} from "../../ListadoComprasLonjaDeIsla/exportData";
import LonjaDeIslaUnifiedExportTable from "../../ListadoComprasLonjaDeIsla/LonjaDeIslaUnifiedExportTable";
import LonjaDeIslaVentaDirectaCard from "../../ListadoComprasLonjaDeIsla/LonjaDeIslaVentaDirectaCard";

export default function LonjaDeIslaExportPreview({ document }) {
    const { tables: { ventas, vendidurias } } = document;

    const ventasVendidurias = {};
    const ventasDirectas = {};

    ventas.forEach((venta) => {
        const barcoEncontrado = findBarcoMatch(barcosLonja, venta);
        if (!barcoEncontrado) return;

        const nombreBarco = barcoEncontrado.barco;
        const codBarco = `${barcoEncontrado.cod}`;
        const barcoVentaDirectaEncontrado = barcosVentaDirecta.find((barco) => barco.cod === codBarco);

        if (!barcoVentaDirectaEncontrado) {
            const vendiduria = datosVendidurias.find((v) => v.cod === barcoEncontrado.codVendiduria);
            if (!vendiduria) return;
            if (!ventasVendidurias[codBarco]) {
                ventasVendidurias[codBarco] = { cod: codBarco, nombre: nombreBarco, vendiduria, lineas: [] };
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
        0,
    );

    const servicios = serviciosLonjaDeIsla.map((s) => ({
        ...s,
        unidades: 1,
        base: importeTotalVentasDirectas,
        precio: (importeTotalVentasDirectas * s.porcentaje) / 100,
        importe: (importeTotalVentasDirectas * s.porcentaje) / 100,
    }));
    const tarifaG4 = servicios.find((s) => s.descripcion === "REPERCUSION TARIFA G-4 COMP.")?.importe || 0;
    servicios.splice(1, 0, {
        ...servicioExtraLonjaDeIsla,
        unidades: 1,
        base: tarifaG4,
        precio: tarifaG4 * servicioExtraLonjaDeIsla.porcentaje / 100,
        importe: tarifaG4 * servicioExtraLonjaDeIsla.porcentaje / 100,
    });

    return (
        <div className="space-y-4">
            <LonjaDeIslaUnifiedExportTable
                ventasVendidurias={ventasVendidurias}
                sourceVendidurias={vendidurias}
                ventasDirectas={ventasDirectas}
                servicios={servicios}
            />
            <LonjaDeIslaVentaDirectaCard
                ventasDirectasArray={Object.values(ventasDirectas).filter(Boolean)}
                servicios={servicios}
            />
        </div>
    );
}

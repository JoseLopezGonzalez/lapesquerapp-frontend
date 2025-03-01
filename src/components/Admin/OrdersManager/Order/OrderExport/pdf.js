"use client"
import { LOGIN_FORM_LOGO, NAVBAR_LOGO } from '@/configs/config'
import React from 'react'


import { useRef } from "react"
import { Printer, Package } from "lucide-react"

const orderData = {
    id: "ORD-2023-0568",
    created_at: "15/05/2023",
    buyer_reference: "REF-BUY-78945",
    total_boxes: 48,
    total_weight: 960.5,
    pallets: [
        {
            number: 1,
            lots: ["150523HKE01A", "150523COD02B"],
            total_weight: 480.25,
            total_boxes: 24,
            products: [
                {
                    name: "Merluza Europea 2-3kg",
                    boxes: 14,
                    net_weight: 280.5,
                    box_weight: 20.0,
                    lot: "150523HKE01A",
                },
                {
                    name: "Bacalao del Atlántico 1-2kg",
                    boxes: 10,
                    net_weight: 199.75,
                    box_weight: 20.0,
                    lot: "150523COD02B",
                },
            ],
            // Añadir información detallada de cada caja individual
            boxes: [
                { id: "P1-B001", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B002", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B003", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B004", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B005", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B006", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B007", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B008", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B009", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B010", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B011", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B012", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B013", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B014", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P1-B015", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B016", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B017", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B018", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B019", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B020", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B021", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B022", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
                { id: "P1-B023", product: "Bacalao del Atlántico 1-2kg", weight: 19.75, lot: "150523COD02B" },
                { id: "P1-B024", product: "Bacalao del Atlántico 1-2kg", weight: 20.0, lot: "150523COD02B" },
            ],
        },
        {
            number: 2,
            lots: ["150523HKE01A", "160523HAD03C"],
            total_weight: 480.25,
            total_boxes: 24,
            products: [
                {
                    name: "Merluza Europea 2-3kg",
                    boxes: 14,
                    net_weight: 280.5,
                    box_weight: 20.0,
                    lot: "150523HKE01A",
                },
                {
                    name: "Eglefino 0.5-1kg",
                    boxes: 10,
                    net_weight: 199.75,
                    box_weight: 20.0,
                    lot: "160523HAD03C",
                },
            ],
            // Añadir información detallada de cada caja individual
            boxes: [
                { id: "P2-B001", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B002", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B003", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B004", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B005", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B006", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B007", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B008", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B009", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B010", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B011", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B012", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B013", product: "Merluza Europea 2-3kg", weight: 20.0, lot: "150523HKE01A" },
                { id: "P2-B014", product: "Merluza Europea 2-3kg", weight: 20.5, lot: "150523HKE01A" },
                { id: "P2-B015", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B016", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B017", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B018", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B019", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B020", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B021", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B022", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
                { id: "P2-B023", product: "Eglefino 0.5-1kg", weight: 19.75, lot: "160523HAD03C" },
                { id: "P2-B024", product: "Eglefino 0.5-1kg", weight: 20.0, lot: "160523HAD03C" },
            ],
        },
    ],
}

const PDFSHEET = () => {



    return (
        <div className="w-[210mm] h-[297mm] mx-auto bg-white p-8 text-gray-800 flex flex-col">
            {/* Encabezado */}
            <header className="mb-6 border-b-2 border-gray-300 pb-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">PESCADOS DEL NORTE S.L.</h1>
                        <p className="text-sm mt-1">
                            Polígono Industrial Pesquero, Nave 24
                            <br />
                            36200 Vigo, Pontevedra, España
                            <br />
                            Tel: +34 986 123 456 | info@pescadosdelnorte.es
                        </p>
                    </div>
                    <div className="w-24 h-24 bg-gray-100 flex items-center justify-center border border-gray-300">
                        <span className="text-xs text-gray-400">LOGO</span>
                    </div>
                </div>

                <div className="flex justify-between mt-4">
                    <div>
                        <h2 className="text-xl font-bold bg-gray-100 px-3 py-1 inline-block">Pedido #{orderData.id}</h2>
                    </div>
                    <div className="text-right">
                        <p>
                            <span className="font-semibold">Buyer Reference:</span> {orderData.buyer_reference}
                        </p>
                        <p>
                            <span className="font-semibold">Fecha:</span> {orderData.created_at}
                        </p>
                    </div>
                </div>
            </header>

            {/* Información de Lotes */}
            <div className="mb-6 bg-gray-50 p-3 border border-gray-200 text-sm">
                <h3 className="font-bold mb-1">Formato de Código de Lote:</h3>
                <p className="grid grid-cols-4 gap-2">
                    <span>
                        <b>1.</b> Fecha de captura (DDMMAA)
                    </span>
                    <span>
                        <b>2.</b> Código FAO de la especie
                    </span>
                    <span>
                        <b>3.</b> Código de zona de captura
                    </span>
                    <span>
                        <b>4.</b> Código interno de producción
                    </span>
                </p>
                <p className="mt-1 text-xs italic">
                    Ejemplo: 150523HKE01A = Capturado el 15/05/23, Merluza (HKE), Zona 01, Producción A
                </p>
            </div>

            {/* Tabla de Palets */}
            <div className="mb-6">
                {orderData.pallets.map((pallet, index) => (
                    <div key={index} className="mb-8">
                        <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
                            <h3 className="font-bold text-lg">PALET #{pallet.number}</h3>
                            <div className="text-sm">
                                <span className="mr-4">Peso Neto: {pallet.total_weight} kg</span>
                                <span>Cajas: {pallet.total_boxes}</span>
                            </div>
                        </div>

                        <div className="border border-gray-300 border-t-0 p-2 mb-2 bg-gray-50">
                            <span className="font-semibold">Lotes en este palet: </span>
                            {pallet.lots.map((lot, i) => (
                                <span key={i} className="inline-block bg-gray-200 px-2 py-1 text-sm mr-2 mb-1">
                                    {lot}
                                </span>
                            ))}
                        </div>

                        {/* Tabla de Productos */}
                        <table className="w-full border-collapse mb-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 text-left">Producto</th>
                                    <th className="border border-gray-300 p-2 text-center">Cajas</th>
                                    <th className="border border-gray-300 p-2 text-center">Peso/Caja (kg)</th>
                                    <th className="border border-gray-300 p-2 text-center">Peso Total (kg)</th>
                                    <th className="border border-gray-300 p-2 text-center">Lote</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pallet.products.map((product, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="border border-gray-300 p-2 font-semibold">{product.name}</td>
                                        <td className="border border-gray-300 p-2 text-center">{product.boxes}</td>
                                        <td className="border border-gray-300 p-2 text-center">{product.box_weight}</td>
                                        <td className="border border-gray-300 p-2 text-center">{product.net_weight}</td>
                                        <td className="border border-gray-300 p-2 text-center">{product.lot}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Códigos de barras GS1-128 (simulados) */}
                        <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
                            {pallet.products.map((product, i) => (
                                <div key={i} className="border border-gray-300 p-2 bg-white">
                                    <p className="text-xs mb-1 font-semibold">
                                        {product.name} - Lote: {product.lot}
                                    </p>
                                    <div className="h-10 bg-gray-800 relative flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center">
                                            {/* Simulación de código de barras con líneas verticales */}
                                            {Array.from({ length: 30 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-full"
                                                    style={{
                                                        width: `${Math.random() * 3 + 1}px`,
                                                        backgroundColor: "white",
                                                        marginLeft: `${Math.random() * 3 + 1}px`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-white z-10 bg-gray-800 px-1">GS1-128</span>
                                    </div>
                                    <p className="text-xs mt-1 text-center">{product.lot}</p>
                                </div>
                            ))}
                        </div>

                        {/* NUEVO: Listado detallado de cajas */}
                        <div className="mt-4 mb-4">
                            <h4 className="font-bold text-sm bg-gray-200 p-2 border-t border-l border-r border-gray-300">
                                LISTADO DETALLADO DE CAJAS - PALET #{pallet.number}
                            </h4>
                            <div className="border border-gray-300 p-2 max-h-60 overflow-y-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="sticky top-0 bg-white">
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 p-1 text-left">ID Caja</th>
                                            <th className="border border-gray-300 p-1 text-left">Producto</th>
                                            <th className="border border-gray-300 p-1 text-center">Peso (kg)</th>
                                            <th className="border border-gray-300 p-1 text-center">Lote</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pallet.boxes.map((box, i) => (
                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="border border-gray-300 p-1 font-mono">{box.id}</td>
                                                <td className="border border-gray-300 p-1">{box.product}</td>
                                                <td className="border border-gray-300 p-1 text-center">{box.weight.toFixed(2)}</td>
                                                <td className="border border-gray-300 p-1 text-center font-mono text-xs">{box.lot}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen Final */}
            <div className="mt-auto">
                <div className="border-t-2 border-gray-300 pt-4 mb-4">
                    <div className="flex justify-between">
                        <div>
                            <h3 className="font-bold text-lg">RESUMEN DEL PEDIDO</h3>
                            <p className="mt-2">
                                <span className="font-semibold">Total Cajas:</span> {orderData.total_boxes}
                                <br />
                                <span className="font-semibold">Peso Neto Total:</span> {orderData.total_weight} kg
                            </p>
                        </div>

                        {/* QR Code */}
                        <div className="text-center">
                            {/* <QRCodeSVG
                                value={`Pedido: ${orderData.id} - Pallets: ${orderData.pallets.length}`}
                                size={100}
                                level="M"
                            /> */}
                            <p className="text-xs mt-1">Pedido: {orderData.id}</p>
                        </div>
                    </div>
                </div>

                {/* Firma y sello */}
                <div className="flex justify-between mt-8">
                    <div className="border-t border-gray-400 pt-1 w-64">
                        <p className="text-center text-sm">Firma y Sello</p>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                        <p>Documento generado el {new Date().toLocaleDateString()}</p>
                        <p>Página 1 de 1</p>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default PDFSHEET
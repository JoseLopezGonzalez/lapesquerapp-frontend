import { LOGIN_FORM_LOGO, NAVBAR_LOGO } from '@/configs/config'
import React from 'react'

const PDFSHEET = () => {
    return (
        <div class="max-w-[210mm] mx-auto p-6 bg-white shadow-md rounded text-black ">
            {/* <!-- Encabezado --> */}
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-2">
                    {/*  <div class="w-16 h-16 bg-slate-100 flex items-center justify-center rounded border">
                        <img src={NAVBAR_LOGO} alt="Logo de la empresa"
                            class="object-contain w-16 h-16" />
                    </div> */}
                    <div>
                        <h1 class="text-xl font-bold ">Congelados Brisamar S.L.</h1>
                        <p class="text-sm ">C/Dieciocho de Julio de 1922 Nº2 - 21410 Isla Cristina</p>
                        <p class="text-sm ">Tel: +34 613 09 14 94 - administracion@congeladosbrisamar.es</p>
                    </div>
                </div>

                <div class="flex items-start gap-4">
                    <div class="  rounded  text-end">
                        <h2 class="text-lg font-bold ">PEDIDO</h2>
                        <p class="text-sm font-medium">#1528 <span class="">{/* {{ $order->formattedId }} */}</span></p>
                        <p class="text-sm font-medium">Fecha: 02/02/2025 <span class="">{/* {{ $order->load_date }} */}</span></p>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="p-1 border rounded flex items-center justify-center bg-white">
                            <img alt='Barcode Generator TEC-IT'
                                src='https://barcode.tec-it.com/barcode.ashx?data=Pedido%3A123654&code=QRCode&eclevel=L'
                                class="w-20 h-20"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* <!-- Datos del cliente y transporte | Direcciones --> */}
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="space-y-4">
                    <div class="border rounded p-4">
                        <h3 class="font-bold  mb-2">DATOS DEL CLIENTE</h3>
                        <div class="text-sm space-y-1">
                            <p><span class="font-medium">Nombre:</span> Distribuciones Marítimas S.A.</p>
                            <p><span class="font-medium">NIF/CIF:</span> B-12345678</p>
                            <p><span class="font-medium">Buyer Reference:</span> BUY-2025-0789</p>
                            <p class="font-medium mt-2">Correos electrónicos:</p>
                            <ul class="list-disc pl-5">
                                <li>pedidos@distribuciones-maritimas.com</li>
                                <li>logistica@distribuciones-maritimas.com</li>
                                <li>facturacion@distribuciones-maritimas.com</li>
                            </ul>
                        </div>
                    </div>

                    <div class="border rounded p-4">
                        <h3 class="font-bold  mb-2">DATOS DE TRANSPORTE</h3>
                        <div class="text-sm space-y-1">
                            <p><span class="font-medium">Empresa:</span> Transportes Rápidos del Norte S.L.</p>
                            <p><span class="font-medium">Email:</span> logistica@transportesrapidos.es</p>
                        </div>
                    </div>
                </div>

                <div class="border rounded p-4">
                    <h3 class="font-bold  mb-2">DIRECCIÓN DE FACTURACIÓN</h3>
                    <p class="text-sm">Polígono Industrial La Marina, Nave 12</p>
                    <p class="text-sm">48950 Erandio, Vizcaya</p>
                    <p class="text-sm">España</p>

                    <hr class="my-4 border-dashed border-slate-300" />

                    <h3 class="font-bold  mb-2">DIRECCIÓN DE ENVÍO</h3>
                    <p class="text-sm">Mercado Central de Abastos</p>
                    <p class="text-sm">Puesto 45-48</p>
                    <p class="text-sm">48002 Bilbao, Vizcaya</p>
                    <p class="text-sm">España</p>
                </div>
            </div>

            {/* <!-- Tabla de productos --> */}
            <div class="mb-6">
                <h3 class="font-bold  mb-2">DETALLE DE PRODUCTOS</h3>
                <div class="border rounded overflow-hidden p-4">
                    <table class="w-full border-collapse text-xs">
                        <thead class=" border-b ">
                            <tr>
                                <th class="p-1 font-medium">Producto</th>
                                <th class="p-1 font-medium">Código GTIN</th>
                                <th class="p-1 font-medium">Lote</th>
                                <th class="p-1 font-medium">Cajas</th>
                                <th class="p-1 font-medium">Peso Neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* <!-- @foreach($order->products as $product) --> */}
                            <tr>
                                <td class=" p-1">Langostinos 20/30</td>
                                <td class=" p-1">1234567890123</td>
                                <td class=" p-1">L-2025-123</td>
                                <td class=" p-1">56</td>
                                <td class=" p-1">27,50 kg</td>
                            </tr>
                            <tr>
                                <td class=" p-1">Langostinos 30/40</td>
                                <td class=" p-1">1234567890124</td>
                                <td class=" p-1">L-2025-124</td>
                                <td class=" p-1">3</td>
                                <td class=" p-1">32,00 kg</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* <!-- Totales --> */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="border rounded p-4 flex justify-between">
                    <h3 class="font-bold ">TOTAL PALETS:</h3>
                    {/*  <!--  <span class="text-xl"></span> --> */}
                </div>

                <div class="border rounded p-4 flex justify-between">
                    <h3 class="font-bold ">TOTAL CAJAS:</h3>
                    {/* <!-- <span class="text-xl"></span> --> */}
                </div>

                <div class="border rounded p-4 flex justify-between bg-slate-50 border-2 border-slate-300">
                    <h3 class="font-bold ">PESO NETO TOTAL:</h3>
                    <span class="text-xl font-bold">{/* {{ number_format($order->netWeight, 2) }} */} kg</span>
                </div>
            </div>

            <hr class="my-4 border-dashed border-slate-300" />
            <div class="flex justify-between items-end">
                <div class="text-xs text-slate-500">
                    <p>Documento generado electrónicamente. No requiere firma.</p>
                    {/* <!-- <p>Ref: </p> --> */}
                </div>


            </div>
        </div>
    )
}

export default PDFSHEET
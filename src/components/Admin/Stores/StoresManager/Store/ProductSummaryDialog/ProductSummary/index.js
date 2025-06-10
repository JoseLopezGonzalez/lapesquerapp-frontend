"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useStoreContext } from "@/context/StoreContext"
import { formatDecimal, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { Input } from "@/components/ui/input"
import { DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PiMicrosoftExcelLogo } from "react-icons/pi"
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ProductSummary() {

    const { speciesSummary, store } = useStoreContext()
    const species = speciesSummary
    const storeName = store.name

    const [searchText, setSearchText] = useState("")
    const [selectedSpecies, setSelectedSpecies] = useState(null)
    const [products, setProducts] = useState([])

    const currentSpecies = species.find((s) => s.name === selectedSpecies)
    const totalWeight = species.reduce((sum, s) => sum + s.quantity, 0)
    const totalProducts = species.reduce((sum, s) => sum + s.products.length, 0)
    const totalSpecies = species.length

    useEffect(() => {
        setSelectedSpecies(species[0].name)
    }, [species])

    useEffect(() => {
        setProducts(currentSpecies?.products ?? [])
    }, [currentSpecies])

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchText.toLowerCase())
    )

    const totalFilteredProducts = filteredProducts.length
    const totalQuantityFilteredProducts = filteredProducts.reduce((sum, product) => sum + product.quantity, 0)

    const generateExcel = () => {
        const allProducts = species.reduce((acc, species) => {
            const speciesProducts = species.products.map((product) => ({
                Producto: product.name,
                Especie: species.name,
                Cantidad: Number(product.quantity.toFixed(2)),
                Porcentaje: Number(product.productPercentage.toFixed(2)),
                Cajas: product.boxes,
            }))
            return acc.concat(speciesProducts)
        }, [])

        const currenDate = new Date();
        const formattedDate = `${currenDate.getDate().toString().padStart(2, '0')}-${(currenDate.getMonth() + 1).toString().padStart(2, '0')}-${currenDate.getFullYear()}`;
        const formattedStoreName = storeName.replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const worksheet = XLSX.utils.json_to_sheet(allProducts);
        // Agregar encabezados
        // ;
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'PRODUCTOS');

        // Guardar archivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
        saveAs(blob, `Productos_${formattedStoreName}_${formattedDate}.xlsx`);
    };

    return (
        <div className="bg-background text-foreground p-6 max-w-3xl mx-auto rounded-lg  min-w-[700px]">
            <div className="text-sm text-muted-foreground/90 mb-6 flex items-center">
                <span>{totalSpecies} {totalSpecies > 1 ? 'Especies' : 'Especie'}</span>
                <Separator orientation="vertical" className="mx-2 h-3" />
                <span>{totalProducts} Productos</span>
                <Separator orientation="vertical" className="mx-2 h-3" />
                <span>{formatDecimalWeight(totalWeight)}</span>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Especies
                </h3>
                <ScrollArea className="w-full whitespace-nowrap pb-4">
                    <div className="flex space-x-2  p-2">
                        {species.map((species, index) => {
                            return (
                                <Card
                                    key={index}
                                    className={cn(
                                        "bg-card border cursor-pointer transition-all duration-200 hover:shadow-md shadow-foreground-200 flex-shrink-0 ",
                                        selectedSpecies === species.name ? " shadow-md shadow-foreground-400" : "border-muted"
                                    )}
                                    onClick={() => setSelectedSpecies(species.name)}
                                >
                                    <CardContent className="p-3 flex items-center space-x-3">
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                selectedSpecies === species.name
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            <span className="text-sm font-semibold">
                                                {species.name.substring(0, 1)}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline gap-3">
                                                <div className="text-sm font-medium truncate pr-1" title={species.name}>
                                                    {species.name}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "text-xs font-medium rounded-sm px-1.5 py-0.5 flex-shrink-0",
                                                        selectedSpecies === species.name
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {species.percentage.toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {formatDecimalWeight(species.quantity)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            {currentSpecies && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className=" max-w-[300px] w-full">
                            <Input
                                type="text"
                                placeholder="Buscar producto..."
                                className="border rounded-md px-4 py-2 w-full"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground flex items-center justify-center">
                            {totalFilteredProducts} {totalFilteredProducts > 1 ? 'productos' : 'producto'}
                            <Separator orientation="vertical" className="mx-2 h-3 bg-muted-foreground" />
                            {formatDecimalWeight(totalQuantityFilteredProducts)}
                        </div>
                    </div>

                    <div className="border rounded-md max-h-[315px] overflow-y-auto">
                        <table className="w-full">
                            {/* <tbody >
                                {filteredProducts.map((product) => {
                                    return (
                                        <tr key={product.name} className="border-b border-muted last:border-0 hover:bg-muted/20">
                                            <td className="py-3 px-4 text-sm">{product.name}</td>
                                            <td className="py-3 px-4 text-sm text-right">{formatDecimalWeight(product.quantity)}</td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                {formatDecimal(product.productPercentage)}%
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody> */}
                            <tbody>
                                {filteredProducts.map((product) => {
                                    return (
                                        <tr key={product.name} className="border-b border-muted last:border-0 hover:bg-muted/20">
                                            <td className="py-3 px-4 text-sm">{product.name}</td>
                                            <td className="py-3 px-4 text-sm text-right">{product.boxes ?? '-'} cajas</td> {/* NUEVA CELDA */}
                                            <td className="py-3 px-4 text-sm text-right">{formatDecimalWeight(product.quantity)}</td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                {formatDecimal(product.productPercentage)}%
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                    </div>
                </div>
            )}

            <DialogFooter className='pt-7'>
                <Button variant="secondary" onClick={generateExcel} >
                    <PiMicrosoftExcelLogo />
                    Exportar todo .xlsx
                </Button>
                {/* <Button variant="secondary" >
                    <LucideFileJson />
                    Exportar .json
                </Button> */}
            </DialogFooter>
        </div>
    )
}

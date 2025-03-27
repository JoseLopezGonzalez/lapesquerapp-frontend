
"use client"

import {
    Box,
    Package,
    Filter,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Combobox } from '@/components/Shadcn/Combobox';
import { useStoreContext } from "@/context/StoreContext"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"


const Filters = () => {

    const { productsOptions, onChangeFilters, filters, resetFilters, palletsOptions } = useStoreContext();

    const selectedProducts = filters.products.map((product) => productsOptions.find((option) => option.value === product));

    const handleOnAddProduct = (value) => {
        if (!value || filters.products.some((product) => product === value)) return;
        onChangeFilters({
            ...filters,
            products: [...filters.products, value]
        })
    }

    const handleOnRemoveProduct = (value) => {
        onChangeFilters({
            ...filters,
            products: filters.products.filter((product) => product !== value)
        })
    }

    const selectedPallets = filters.pallets.map((pallet) => palletsOptions.find((option) => option.value === pallet));

    const handleOnAddPallet = (value) => {
        if (!value || filters.pallets.some((pallet) => pallet === value)) return;
        onChangeFilters({
            ...filters,
            pallets: [...filters.pallets, value]
        })
    }

    const handleOnRemovePallet = (value) => {
        onChangeFilters({
            ...filters,
            pallets: filters.pallets.filter((pallet) => pallet !== value)
        })
    }





    return (
        <Card className=' w-full  h-full overflow-hidden bg-neutral-900 flex flex-col '>
            <CardHeader>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                    </h2>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                        Limpiar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='flex-1 overflow-y-auto pb-5'>
                <div className=' w-full h-full'>
                    <div className="">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium mb-3">Nombre del producto</h3>
                                <Combobox
                                    options={productsOptions}
                                    placeholder="Buscar producto"
                                    searchPlaceholder="Buscar producto"
                                    notFoundMessage="No se encontraron productos"
                                    onChange={handleOnAddProduct}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {selectedProducts.map((product) => (
                                    <Badge
                                        key={product.value}
                                        className='flex items-center gap-1 px-1 '
                                    >

                                        {product.label}
                                        <Button
                                            variant="ghost"
                                            size="xs"
                                            className='rounded-full'
                                            onClick={() => handleOnRemoveProduct(product.value)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-sm font-medium mb-3">Id Palets</h3>
                                <Combobox
                                    options={palletsOptions}
                                    placeholder="Buscar palet"
                                    searchPlaceholder="Buscar palet"
                                    notFoundMessage="No se encontraron palets"
                                    onChange={handleOnAddPallet}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedPallets.map((product) => (
                                    <Badge
                                        key={product.value}
                                        className='flex items-center gap-1 px-1 '
                                    >
                                        {product.label}
                                        <Button
                                            variant="ghost"
                                            size="xs"
                                            className='rounded-full'
                                            onClick={() => handleOnRemovePallet(product.value)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>

                            <Separator />

                            {/* Filter by type */}
                            <div>
                                <h3 className="text-sm font-medium mb-3">Tipo de producto</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-pallet"
                                        /* checked={filters.types.pallet}
                                        onCheckedChange={(checked) =>
                                            setFilters({
                                                ...filters,
                                                types: { ...filters.types, pallet: checked === true },
                                            })
                                        } */
                                        />
                                        <label htmlFor="filter-pallet" className="text-sm flex items-center">
                                            <Package className="h-4 w-4 mr-2" />
                                            Pallets
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-box"
                                        /* checked={filters.types.box}
                                        onCheckedChange={(checked) =>
                                            setFilters({
                                                ...filters,
                                                types: { ...filters.types, box: checked === true },
                                            })
                                        } */
                                        />
                                        <label htmlFor="filter-box" className="text-sm flex items-center">
                                            <Box className="h-4 w-4 mr-2" />
                                            Cajas
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="filter-tub"
                                        /* checked={filters.types.tub}
                                        onCheckedChange={(checked) =>
                                            setFilters({
                                                ...filters,
                                                types: { ...filters.types, tub: checked === true },
                                            })
                                        } */
                                        />
                                        <label htmlFor="filter-tub" className="text-sm flex items-center">
                                            <Box className="h-4 w-4 rotate-45 mr-2" />
                                            Tinas
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="w-full">
                                <Button variant="secondary" className="w-full">
                                    <PiMicrosoftExcelLogoFill className="h-5 w-5" />
                                    Exportar a Excel
                                </Button>

                            </div>

                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
            </CardFooter>

        </Card>

    )
}

export default Filters
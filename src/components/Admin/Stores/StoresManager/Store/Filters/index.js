
"use client"



import {
    Box,

    Package,

    Filter,
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react"

// Add these imports at the top of the file

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
/* import { Slider } from "@/components/ui/slider" */
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Combobox } from '@/components/Shadcn/Combobox';
import { useStoreContext } from "@/context/StoreContext"
import { use, useEffect, useState } from "react"
import { set } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

const Filters = () => {

    const { loading, error, productsOptions, onChangeFilters } = useStoreContext();


    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleOnAddProduct = (value) => {
        const newSelectedProduct = productsOptions.find((product) => product.value === value);
        /* Si ya existe en selectedProducts o no hay newSelecterProduct */
        if (!newSelectedProduct || selectedProducts.some((product) => product.value === value)) return;
        setSelectedProducts([...selectedProducts, newSelectedProduct]);
        setSelectedProduct(null);
    }

    const handleOnRemoveProduct = (value) => {
        setSelectedProducts(selectedProducts.filter((product) => product.value !== value
        ));
    }

    const handleOnChangeFilters = () => {
        onChangeFilters({
            products: selectedProducts.map((product) => product.value)
        })
    }

    useEffect(() => {
        handleOnChangeFilters();
    }, [selectedProducts])

    return (
        <div className='max-w-[350px] w-full h-full  dark:bg-neutral-900 p-5'>
            <div className="">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                    </h2>
                    <Button variant="ghost" size="sm" /* onClick={resetFilters} */>
                        Limpiar
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Filter by product name */}
                    <div>
                        <h3 className="text-sm font-medium mb-3">Nombre del producto</h3>
                        <Combobox
                            options={productsOptions}
                            placeholder="Buscar producto"
                            searchPlaceholder="Buscar producto"
                            notFoundMessage="No se encontraron productos"
                            value={selectedProduct}
                            onChange={handleOnAddProduct}
                        /* className={field.props?.className} */
                        />
                    </div>

                    {/* lista badges con vbotton x para todos los selectedProducts */}
                    <div className="flex flex-wrap gap-2">
                        {selectedProducts.map((product) => (
                            <Badge
                                key={product.value}
                                className='flex items-center gap-1 px-1 '
                            >

                                {product.label}
                                {/* button x */}
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


                </div>
            </div>
        </div>
    )
}

export default Filters
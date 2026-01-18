"use client"

import ProductsInventoryOverview from "./ProductsInventoryOverview"
import RawAreaChart from "./RawMaterialReceptions/RawAreaChart"
import RawMaterialRadialBarChart from "./RawMaterialReceptions/RawMaterialRadialBarChart"
import SpeciesInventoryOverview from "./SpeciesInventoryOverview"
import { cn } from "@/lib/utils"
import { useIsMobileSafe } from "@/hooks/use-mobile"

const Home = () => {
    const { isMobile, mounted } = useIsMobileSafe()
    
    // Si no está montado, mostrar layout sin cards
    if (!mounted) {
        return (
            <div className={cn(
                "w-full h-full overflow-y-auto",
                "grid grid-cols-10 gap-5", // Desktop layout por defecto
                "px-6 xl:px-20 pb-10 pt-14"
            )}>
                <div className="col-span-10 mb-5">
                    <h1 className="text-3xl font-thin text-neutral-300">Panel de Control</h1>
                </div>
                {/* Cards ocultos en todas las versiones */}
            </div>
        )
    }

    return (
        <>
            <div className={cn(
                "w-full h-full overflow-y-auto",
                "flex flex-col md:grid md:grid-cols-10 gap-4 md:gap-5", // Stack vertical en mobile, grid en desktop
                "px-4 md:px-6 xl:px-20", // Padding responsive
                "pb-10 pt-4 md:pt-14" // Padding top reducido en mobile
            )}>
                {/* Title */}
                <div className="w-full md:col-span-10 mb-2 md:mb-5">
                    <h1 className="text-2xl md:text-3xl font-thin text-neutral-300">Panel de Control</h1>
                </div>

                {/* Cards - Desocultar uno por uno para corregirlos */}
                {/* 
                    ESTRATEGIA: Desocultar uno por uno para corregirlos
                    Para ocultar un card: cambiar a {false && ...}
                    Para desocultar: cambiar a {true && ...} o simplemente quitar la condición
                */}
                
                {/* Card 1: SpeciesInventoryOverview - VISIBLE */}
                {true && (
                    <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-4">
                        <SpeciesInventoryOverview />
                    </div>
                )}

                {/* Card 2: RawMaterialRadialBarChart - VISIBLE */}
                {true && (
                    <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-6">
                        <RawMaterialRadialBarChart />
                    </div>
                )}

                {/* Card 3: ProductsInventoryOverview - VISIBLE */}
                {true && (
                    <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-6">
                        <ProductsInventoryOverview/>
                    </div>
                )}

                {/* Card 4: RawAreaChart - VISIBLE */}
                {true && (
                    <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-4">
                        <RawAreaChart />
                    </div>
                )}

                {/* Resto de cards - OCULTOS en todas las versiones */}
                {/* Desocultar uno por uno según se vayan corrigiendo */}

            </div>
        </>
    )
}

export default Home
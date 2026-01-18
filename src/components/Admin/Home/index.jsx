import ProductsInventoryOverview from "./ProductsInventoryOverview"
import RawAreaChart from "./RawMaterialReceptions/RawAreaChart"
import RawMaterialRadialBarChart from "./RawMaterialReceptions/RawMaterialRadialBarChart"
import SpeciesInventoryOverview from "./SpeciesInventoryOverview"
import { cn } from "@/lib/utils"

const Home = () => {
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

                {/* Cards - Full width en mobile, grid en desktop */}
                <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-4">
                    <SpeciesInventoryOverview />
                </div>

                <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-6">
                    <RawMaterialRadialBarChart />
                </div>

                <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-6">
                    <ProductsInventoryOverview/>
                </div>

                <div className="w-full md:col-span-10 xl:col-span-4 2xl:col-span-4">
                    <RawAreaChart />
                </div>

            </div>
        </>
    )
}

export default Home
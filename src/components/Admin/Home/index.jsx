import ProductsInventoryOverview from "./ProductsInventoryOverview"
import RawAreaChart from "./RawMaterialReceptions/RawAreaChart"
import RawMaterialRadialBarChart from "./RawMaterialReceptions/RawMaterialRadialBarChart"
import SpeciesInventoryOverview from "./SpeciesInventoryOverview"

const Home = () => {
    return (
        <>
            <div className="grid grid-cols-10 gap-5 w-full px-6 md:px-10 xl:px-20 pb-10 pt-14 h-full overflow-y-auto ">
                {/* Title */}
                <div className=" col-span-10 mb-5">
                    <h1 className="text-3xl font-thin text-neutral-300">Panel de Control</h1>
                </div>

                <div className="col-span-10 xl:col-span-4 2xl:col-span-4">
                    <SpeciesInventoryOverview />
                </div>

                <div className="col-span-10 xl:col-span-4 2xl:col-span-6">
                    <RawMaterialRadialBarChart />
                </div>

                <div className="col-span-10 xl:col-span-4 2xl:col-span-6">
                    <ProductsInventoryOverview/>
                </div>

                <div className="col-span-10 xl:col-span-4 2xl:col-span-4">
                    <RawAreaChart />
                </div>

            </div>
        </>
    )
}

export default Home
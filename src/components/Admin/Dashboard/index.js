"use client";

import { useState } from "react";
import { OrderRankingChart } from "./OrderRanking";
import { SalesBySalespersonPieChart } from "./SalesBySalespersonPieChart";
import { TotalQuantitySoldCard } from "./TotalQuantitySoldCard";
import { TotalAmountSoldCard } from "./TotalAmountSoldCard";
import { StockBySpeciesCard } from "./StockBySpeciesCard";
import { StockByProductsCard } from "./StockByProductsCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewLabelingFeatureCard } from "./NewLabelingFeatureCard";
import { CurrentStockCard } from "./CurrentStockCard";
import { SalesChart } from "./SalesChart";
import { ReceptionChart } from "./ReceptionChart";
import { DispatchChart } from "./DispatchChart";
import { TransportRadarChart } from "./TransportRadarChart";
import Masonry from "react-masonry-css";

const breakpointColumnsObj = {
    default: 3,
    1920: 3,
    1536: 3,
    1280: 2,
    768: 1,
    640: 1,
};

const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 12) {
        return "Buenos días,";
        } else if (hour >= 12 && hour < 20) {
        return "Buenas tardes,";
        } else {
        return "Buenas noches,";
        }
};

export default function Dashboard() {
    const [greeting] = useState(() => getGreeting());

    return (
        <div className="h-full w-full flex flex-col gap-4 px-6 py-3">
            <ScrollArea className="w-full h-full pr-4">
                <div className="w-full h-full flex flex-col gap-4 pb-4">
                    <div className="w-full">
                        <div className="flex flex-col items-start justify-center mb-4">
                            <p className="text-md text-neutral-500 dark:text-neutral-400">{greeting}</p>
                            <h1 className="text-4xl font-light">Administración</h1>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                        <div className="w-full overflow-hidden">
                            <CurrentStockCard />
                        </div>
                        <div className="w-full h-full overflow-hidden">
                            <TotalQuantitySoldCard />
                        </div>
                        <div className="w-full h-full overflow-hidden">
                            <TotalAmountSoldCard />
                        </div>
                        <div className="w-full overflow-hidden hidden sm:block">
                            <NewLabelingFeatureCard />
                        </div>
                    </div>

                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="masonry-grid"
                        columnClassName="masonry-grid_column"
                    >
                        <div>
                            <OrderRankingChart />
                        </div>
                        <div>
                            <SalesBySalespersonPieChart />
                        </div>
                        <div>
                            <StockBySpeciesCard />
                        </div>
                        <div>
                            <StockByProductsCard />
                        </div>
                        <div>
                            <SalesChart />
                        </div>
                        <div>
                            <ReceptionChart />
                        </div>
                        <div>
                            <DispatchChart />
                        </div>
                        <div>
                            <TransportRadarChart />
                        </div>
                    </Masonry>
                </div>
            </ScrollArea>
        </div>
    );
}

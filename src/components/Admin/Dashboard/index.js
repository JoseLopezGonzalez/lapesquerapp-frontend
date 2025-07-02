// components/dashboard/DashboardCardWrapper.jsx

"use client";

import { useEffect, useState } from "react";
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
import { TransportRadarChart } from "./TransportTadarChart";

export default function Dashboard() {
    const [greeting, setGreeting] = useState("Hola");

    useEffect(() => {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 12) {
            setGreeting("Buenos días,");
        } else if (hour >= 12 && hour < 20) {
            setGreeting("Buenas tardes,");
        } else {
            setGreeting("Buenas noches,");
        }
    }, []);

    return (
        <div className="h-full w-full flex flex-col gap-4 px-6 py-3">
            <ScrollArea className="w-full h-full pr-4 ">
                <div className="w-full h-full flex flex-col gap-4 pb-4">

                    <div className="w-full">
                        <div className="flex flex-col items-start justify-center mb-4">
                            <p className="text-md text-gray-500">{greeting}</p>
                            <h1 className="text-4xl font-light">Administración</h1>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-4 gap-4">
                        <div className=" w-full overflow-hidden">
                            <CurrentStockCard />
                        </div>
                        <div className="">
                            <TotalQuantitySoldCard />
                        </div>
                        <div className="">
                            <TotalAmountSoldCard />
                        </div>
                        {/* <div className="">
                            <CurrentStockCard />
                        </div> */}

                        <div className="w-full overflow-hidden">
                            <NewLabelingFeatureCard />
                        </div>

                    </div>

                    <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 space-y-4">
                        <div className="break-inside-avoid mb-4">
                            <OrderRankingChart />
                        </div>
                        <div className="break-inside-avoid mb-4">
                            <SalesBySalespersonPieChart />
                        </div>
                        <div className="break-inside-avoid mb-4">
                            <StockBySpeciesCard />
                        </div>
                        <div className="break-inside-avoid mb-4">
                            <StockByProductsCard />
                        </div>
                        <div className="break-inside-avoid mb-4">
                            <SalesChart />
                        </div>
                        <div className="break-inside-avoid mb-4">
                            <TransportRadarChart />
                        </div>
                    </div>
                </div>

            </ScrollArea>
        </div>

    );
}
